import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSettings, saveSettings, getWeather, getOutfits, getWardrobe, getLaundry,
  markOutfitWorn, markOutfitUnworn, IMG_URL,
} from '../api.service';

const WEATHER_ICON = code => {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 99) return '⛈️';
  return '🌤️';
};

const WEATHER_DESC = code => {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return '';
};

const CAT_ICON = { tops: '👕', bottoms: '👖', outerwear: '🧥', shoes: '👟', accessories: '💍', dresses: '👗' };

function ItemPhoto({ item }) {
  const src = item.imageUrl ? `${IMG_URL}${item.imageUrl}` : null;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <span className="text-2xl">{CAT_ICON[item.category] || '👔'}</span>}
      </div>
      <p className="text-xs text-gray-500 truncate w-16 text-center">{item.name}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [weather, setWeather] = useState(null);
  const [todayOutfit, setTodayOutfit] = useState(null);
  const [stats, setStats] = useState({ wardrobe: 0, wornWeek: 0, laundry: 0 });
  const [loading, setLoading] = useState(true);
  const [togglingWorn, setTogglingWorn] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [settings, outfits, wardrobe, laundryData] = await Promise.all([
        getSettings(),
        getOutfits(),
        getWardrobe(),
        getLaundry(),
      ]);

      const cityName = settings?.city || 'Mumbai';
      setCity(cityName);
      setCityInput(cityName);

      const outfit = outfits.find ? outfits.find(o => o.date === todayStr) : null;
      setTodayOutfit(outfit || null);

      const wornThisWeek = Array.isArray(outfits) ? outfits.filter(o => o.status === 'worn').length : 0;
      setStats({
        wardrobe: Array.isArray(wardrobe) ? wardrobe.length : 0,
        wornWeek: wornThisWeek,
        laundry: Array.isArray(laundryData?.items) ? laundryData.items.length : 0,
      });

      try {
        const wx = await getWeather(cityName);
        if (!wx.message) setWeather(wx);
      } catch { /* weather optional */ }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCity() {
    if (!cityInput.trim()) return;
    await saveSettings({ city: cityInput.trim() });
    setCity(cityInput.trim());
    setEditingCity(false);
    loadAll();
  }

  async function toggleWorn() {
    if (!todayOutfit) return;
    setTogglingWorn(true);
    try {
      if (todayOutfit.status === 'worn') {
        await markOutfitUnworn(todayOutfit.id);
        setTodayOutfit(prev => ({ ...prev, status: 'suggested' }));
      } else {
        await markOutfitWorn(todayOutfit.id);
        setTodayOutfit(prev => ({ ...prev, status: 'worn' }));
      }
    } finally {
      setTogglingWorn(false);
    }
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">✨</div>
          <p>Loading your wardrobe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{greeting}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{dateStr}</p>
      </div>

      {/* City banner */}
      {!city && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Set your city for weather-based suggestions</p>
          </div>
          <button
            onClick={() => setEditingCity(true)}
            className="bg-amber-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Set City
          </button>
        </div>
      )}

      {/* City edit modal */}
      {editingCity && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Set Your City</h2>
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveCity()}
              placeholder="e.g. Mumbai, London, New York"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingCity(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveCity} className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Weather card */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-indigo-200 text-xs">{weather?.city || city || 'Set your city'}</p>
              {weather?.current ? (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-4xl">{WEATHER_ICON(weather.current.weathercode)}</span>
                    <div>
                      <p className="text-3xl font-bold">{Math.round(weather.current.temperature)}°C</p>
                      <p className="text-indigo-200 text-xs">{WEATHER_DESC(weather.current.weathercode)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-indigo-200 text-sm mt-2">No weather data</p>
              )}
            </div>
            <button
              onClick={() => setEditingCity(true)}
              className="text-indigo-200 hover:text-white text-xs underline"
            >
              Change
            </button>
          </div>

          {weather?.daily && (
            <div className="flex gap-2 pt-3 border-t border-indigo-400/50">
              {weather.daily.time.slice(0, 3).map((date, i) => (
                <div key={date} className="flex-1 text-center">
                  <p className="text-indigo-200 text-xs">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-lg mt-0.5">{WEATHER_ICON(weather.daily.weathercode[i])}</p>
                  <p className="text-xs font-medium">{Math.round(weather.daily.temperature_2m_max[i])}°</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's outfit */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Today's Outfit</h2>
            {todayOutfit?.status === 'worn' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Worn</span>
            )}
          </div>

          {todayOutfit && todayOutfit.items && todayOutfit.items.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                {todayOutfit.items.map(item => (
                  <ItemPhoto key={item.id} item={item} />
                ))}
              </div>
              <button
                onClick={toggleWorn}
                disabled={togglingWorn}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  todayOutfit.status === 'worn'
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {togglingWorn ? '...' : todayOutfit.status === 'worn' ? '✓ Marked as worn — undo?' : '✓ Mark as worn today'}
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-5xl mb-3">👔</p>
              <p className="text-sm font-medium text-gray-500">No outfit planned for today</p>
              <button
                onClick={() => navigate('/planner')}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                Go to Outfit Planner →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="👕" label="Wardrobe" value={stats.wardrobe} sub="items" color="blue" onClick={() => navigate('/wardrobe')} />
        <StatCard icon="✅" label="Worn" value={stats.wornWeek} sub="this week" color="green" onClick={() => navigate('/planner')} />
        <StatCard icon="🧺" label="Laundry" value={stats.laundry} sub="need wash" color="amber" onClick={() => navigate('/laundry')} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition-shadow w-full"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-2 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </button>
  );
}
