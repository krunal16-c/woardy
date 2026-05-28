import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSettings, saveSettings, getWeather, getOutfits,
  getWardrobe, getLaundry, markOutfitWorn, markOutfitUnworn, IMG_BASE,
} from '../api.service';

// WMO weather code → { icon name, label }
const WX = code => {
  if (code === 0)  return { icon: 'wb_sunny', label: 'Clear' };
  if (code <= 2)   return { icon: 'partly_cloudy_day', label: 'Partly cloudy' };
  if (code === 3)  return { icon: 'cloud', label: 'Overcast' };
  if (code <= 48)  return { icon: 'foggy', label: 'Foggy' };
  if (code <= 55)  return { icon: 'rainy_light', label: 'Drizzle' };
  if (code <= 65)  return { icon: 'rainy', label: 'Rain' };
  if (code <= 77)  return { icon: 'ac_unit', label: 'Snow' };
  if (code <= 82)  return { icon: 'rainy', label: 'Showers' };
  return { icon: 'thunderstorm', label: 'Thunderstorm' };
};

function Icon({ name, size = 20, filled = false, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

const CAT_ICON = { tops: 'tshirt', bottoms: 'straighten', outerwear: 'dry_cleaning', shoes: 'steps', accessories: 'diamond', dresses: 'styler' };

function ItemThumb({ item }) {
  const src = item.imageUrl ? `${IMG_BASE}${item.imageUrl}` : null;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <Icon name={CAT_ICON[item.category] || 'checkroom'} size={24} className="text-stone-400" />}
      </div>
      <p className="text-[10px] text-stone-500 w-[52px] text-center truncate leading-tight">{item.name}</p>
    </div>
  );
}

function StatCard({ icon, label, value, sub, colorClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-stone-100 shadow-card p-3 md:p-4 text-left hover:shadow-card-md transition-shadow w-full"
    >
      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center mb-2 md:mb-3 ${colorClass}`}>
        <Icon name={icon} size={16} filled className="opacity-80" />
      </div>
      <p className="text-xl md:text-2xl font-bold text-stone-800 leading-none mb-1">{value}</p>
      <p className="text-[10px] md:text-[11px] text-stone-400 font-medium uppercase tracking-wide">{sub}</p>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [weather, setWeather] = useState(null);
  const [todayOutfit, setTodayOutfit] = useState(null);
  const [stats, setStats] = useState({ wardrobe: 0, worn: 0, laundry: 0 });
  const [loading, setLoading] = useState(true);
  const [wornBusy, setWornBusy] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [settings, outfits, wardrobe, laundry] = await Promise.all([
        getSettings().catch(() => ({})),
        getOutfits().catch(() => []),
        getWardrobe().catch(() => []),
        getLaundry().catch(() => ({ items: [] })),
      ]);

      const c = settings?.city || '';
      setCity(c); setCityInput(c);
      setTodayOutfit(Array.isArray(outfits) ? outfits.find(o => o.date === todayStr) ?? null : null);
      setStats({
        wardrobe: Array.isArray(wardrobe) ? wardrobe.length : 0,
        worn: Array.isArray(outfits) ? outfits.filter(o => o.status === 'worn').length : 0,
        laundry: Array.isArray(laundry?.items) ? laundry.items.length : 0,
      });

      if (c) {
        getWeather(c).then(w => { if (!w.message) setWeather(w); }).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveCity() {
    if (!cityInput.trim()) return;
    await saveSettings({ city: cityInput.trim() });
    setCity(cityInput.trim());
    setShowCityModal(false);
    loadAll();
  }

  async function toggleWorn() {
    if (!todayOutfit) return;
    setWornBusy(true);
    try {
      todayOutfit.status === 'worn'
        ? await markOutfitUnworn(todayOutfit.id)
        : await markOutfitWorn(todayOutfit.id);
      setTodayOutfit(prev => ({ ...prev, status: prev.status === 'worn' ? 'suggested' : 'worn' }));
    } finally { setWornBusy(false); }
  }

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const wx = weather?.current ? WX(weather.current.weathercode) : null;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <header className="mb-7">
        <h1 className="text-[28px] font-bold text-stone-900 tracking-tight">{greeting}</h1>
        <p className="text-stone-400 text-sm mt-0.5">{dateLabel}</p>
      </header>

      {/* City setup prompt */}
      {!city && !loading && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
          <Icon name="location_on" size={18} filled className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">Set your city to get weather-based outfit suggestions.</p>
          <button onClick={() => setShowCityModal(true)} className="text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
            Set city →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Weather */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-card-md">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute -right-2 top-8 w-16 h-16 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-indigo-200 text-[12px] font-medium">{weather?.city || city || '—'}</p>
              <button onClick={() => setShowCityModal(true)} className="text-indigo-300 hover:text-white transition-colors">
                <Icon name="edit" size={14} />
              </button>
            </div>
            {wx ? (
              <div className="flex items-center gap-3 mb-4">
                <Icon name={wx.icon} size={42} filled className="text-white/90" />
                <div>
                  <p className="text-4xl font-bold tracking-tight">{Math.round(weather.current.temperature)}°</p>
                  <p className="text-indigo-200 text-[12px]">{wx.label}</p>
                </div>
              </div>
            ) : (
              <div className="h-14 flex items-center">
                <p className="text-indigo-300 text-sm">{city ? 'Loading weather…' : 'No city set'}</p>
              </div>
            )}
            {weather?.daily && (
              <div className="flex gap-1 pt-3 border-t border-indigo-500/50">
                {weather.daily.time.slice(0, 3).map((d, i) => {
                  const w = WX(weather.daily.weathercode[i]);
                  return (
                    <div key={d} className="flex-1 text-center">
                      <p className="text-indigo-300 text-[10px] font-medium">
                        {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <Icon name={w.icon} size={16} filled className="text-white/80 my-0.5" />
                      <p className="text-white text-[11px] font-semibold">{Math.round(weather.daily.temperature_2m_max[i])}°</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Today's outfit */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Today's Outfit</h2>
            {todayOutfit?.status === 'worn' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Icon name="check_circle" size={12} filled /> Worn
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-24 flex items-center justify-center text-stone-300 text-sm">Loading…</div>
          ) : todayOutfit?.items?.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3 mb-5">
                {todayOutfit.items.map(item => <ItemThumb key={item.id} item={item} />)}
              </div>
              <button
                onClick={toggleWorn}
                disabled={wornBusy}
                className={`w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  todayOutfit.status === 'worn'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Icon name={todayOutfit.status === 'worn' ? 'check_circle' : 'checkroom'} size={16} filled={todayOutfit.status === 'worn'} />
                {wornBusy ? 'Updating…' : todayOutfit.status === 'worn' ? 'Marked as worn — undo' : 'Mark as worn today'}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="checkroom" size={40} className="text-stone-200 mb-2" />
              <p className="text-sm font-medium text-stone-500">No outfit planned for today</p>
              <button onClick={() => navigate('/planner')} className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Generate suggestions →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="checkroom" label="Wardrobe" value={stats.wardrobe} sub="Total items" colorClass="bg-indigo-50 text-indigo-600" onClick={() => navigate('/wardrobe')} />
        <StatCard icon="check_circle" label="Worn" value={stats.worn} sub="This week" colorClass="bg-emerald-50 text-emerald-600" onClick={() => navigate('/planner')} />
        <StatCard icon="local_laundry_service" label="Laundry" value={stats.laundry} sub="Need wash" colorClass="bg-amber-50 text-amber-600" onClick={() => navigate('/laundry')} />
      </div>

      {/* City modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-1">Set your city</h2>
            <p className="text-sm text-stone-500 mb-4">Used to fetch the weather forecast for outfit suggestions.</p>
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCity()}
              placeholder="e.g. Mumbai, London, New York"
              autoFocus
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCityModal(false)} className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveCity} className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
