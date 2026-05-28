import { useState, useEffect } from 'react';
import { getOutfits, generateOutfits, markOutfitWorn, markOutfitUnworn, IMG_BASE } from '../api.service';

const WX = code => {
  if (code === 0)  return { icon: 'wb_sunny', color: 'text-amber-500' };
  if (code <= 2)   return { icon: 'partly_cloudy_day', color: 'text-sky-400' };
  if (code === 3)  return { icon: 'cloud', color: 'text-stone-400' };
  if (code <= 48)  return { icon: 'foggy', color: 'text-stone-400' };
  if (code <= 65)  return { icon: 'rainy', color: 'text-sky-500' };
  if (code <= 77)  return { icon: 'ac_unit', color: 'text-sky-300' };
  if (code <= 82)  return { icon: 'rainy', color: 'text-sky-500' };
  return { icon: 'thunderstorm', color: 'text-violet-500' };
};

const ET_ICON = { casual: 'mood', formal: 'business_center', business: 'work', outdoor: 'park', sport: 'fitness_center', party: 'celebration' };
const CAT_ICON = { tops: 'tshirt', bottoms: 'straighten', outerwear: 'dry_cleaning', shoes: 'steps', accessories: 'diamond', dresses: 'styler' };

function Icon({ name, size = 18, filled = false, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}>
      {name}
    </span>
  );
}

function ItemChip({ item }) {
  const src = item.imageUrl ? `${IMG_BASE}${item.imageUrl}` : null;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <Icon name={CAT_ICON[item.category] || 'checkroom'} size={22} className="text-stone-300" />}
      </div>
      <p className="text-[10px] text-stone-500 w-14 text-center leading-tight truncate">{item.name}</p>
    </div>
  );
}

function DayCard({ suggestion, onToggle }) {
  const [busy, setBusy] = useState(false);
  const dateObj = new Date(suggestion.date + 'T12:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const isToday = suggestion.date === today;
  const isPast = suggestion.date < today;
  const isWorn = suggestion.status === 'worn';
  const wx = suggestion.weatherContext ? WX(suggestion.weatherContext.weatherCode) : null;

  async function toggle() {
    setBusy(true);
    await onToggle(suggestion.id, isWorn);
    setBusy(false);
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all ${
      isToday ? 'border-indigo-200 shadow-indigo-100/60' : isPast ? 'border-stone-100 opacity-75' : 'border-stone-100'
    }`}>
      {/* Day header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${isToday ? 'bg-indigo-50 border-indigo-100' : 'bg-stone-50/60 border-stone-100'}`}>
        <div className="flex items-center gap-2">
          {isToday && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md">TODAY</span>}
          <p className="text-sm font-bold text-stone-800">
            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wx && suggestion.weatherContext && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 font-medium">
              <Icon name={wx.icon} size={14} filled className={wx.color} />
              {suggestion.weatherContext.tempMin}–{suggestion.weatherContext.tempMax}°C
            </span>
          )}
          {suggestion.eventContext && suggestion.eventContext !== 'casual' && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500 font-medium bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
              <Icon name={ET_ICON[suggestion.eventContext] || 'event'} size={11} filled />
              {suggestion.eventContext}
            </span>
          )}
          {isWorn && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Icon name="check_circle" size={11} filled /> Worn
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {suggestion.items?.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-4">
            {suggestion.items.map(item => <ItemChip key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-3 mb-4 text-stone-400 text-sm">
            <Icon name="info" size={15} />
            Add wardrobe items to get outfit suggestions
          </div>
        )}
        <button onClick={toggle} disabled={busy}
          className={`w-full py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            isWorn
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-stone-900 text-white hover:bg-stone-800'
          }`}>
          <Icon name={isWorn ? 'undo' : 'check_circle'} size={14} filled={isWorn} />
          {busy ? '…' : isWorn ? 'Worn — tap to undo' : 'Mark as worn'}
        </button>
      </div>
    </div>
  );
}

export default function OutfitPlanner() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getOutfits().catch(() => []);
    setOutfits(Array.isArray(data) ? data.sort((a, b) => a.date.localeCompare(b.date)) : []);
    setLoading(false);
  }

  async function generate() {
    setGenerating(true); setError('');
    try {
      const data = await generateOutfits();
      if (Array.isArray(data)) setOutfits(data.sort((a, b) => a.date.localeCompare(b.date)));
      else setError(data.message || 'Generation failed');
    } catch (err) {
      setError(err.message || 'Failed to generate outfits');
    } finally { setGenerating(false); }
  }

  async function handleToggle(id, wasWorn) {
    wasWorn ? await markOutfitUnworn(id) : await markOutfitWorn(id);
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, status: wasWorn ? 'suggested' : 'worn' } : o));
  }

  const wornCount = outfits.filter(o => o.status === 'worn').length;

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-stone-900 tracking-tight">Outfit Planner</h1>
          <p className="text-stone-400 text-sm mt-0.5">7-day suggestions based on weather &amp; calendar</p>
        </div>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-3 md:px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60 shrink-0">
          <Icon name="auto_awesome" size={16} filled={!generating} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <Icon name="error" size={15} filled /> {error}
        </div>
      )}

      {outfits.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-[12px] text-stone-500 font-medium">
          <Icon name="check_circle" size={14} filled className="text-emerald-500" />
          {wornCount} of {outfits.length} outfits worn this week
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-stone-300 text-sm">Loading…</div>
      ) : outfits.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="auto_awesome" size={48} className="text-stone-200 mb-3" />
          <p className="text-sm font-semibold text-stone-600 mb-1">No outfits planned yet</p>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">Add wardrobe items, set your city, then click Generate to get 7-day suggestions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {outfits.map(o => <DayCard key={o.id} suggestion={o} onToggle={handleToggle} />)}
        </div>
      )}
    </div>
  );
}
