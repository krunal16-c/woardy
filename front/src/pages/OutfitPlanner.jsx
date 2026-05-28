import { useState, useEffect } from 'react';
import { getOutfits, generateOutfits, markOutfitWorn, markOutfitUnworn, IMG_URL } from '../api.service';

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

const EVENT_ICON = {
  casual: '😊', formal: '🤵', business: '💼',
  outdoor: '🌿', sport: '🏃', party: '🎉',
};

const CAT_ICON = {
  tops: '👕', bottoms: '👖', outerwear: '🧥',
  shoes: '👟', accessories: '💍', dresses: '👗',
};

function ItemChip({ item }) {
  const src = item.imageUrl ? `${IMG_URL}${item.imageUrl}` : null;
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <span className="text-xl">{CAT_ICON[item.category] || '👔'}</span>}
      </div>
      <p className="text-xs text-gray-500 w-14 text-center leading-tight truncate">{item.name}</p>
    </div>
  );
}

function DayCard({ suggestion, onToggleWorn }) {
  const [busy, setBusy] = useState(false);
  const dateObj = new Date(suggestion.date + 'T12:00:00');
  const isToday = suggestion.date === new Date().toISOString().split('T')[0];
  const isPast = suggestion.date < new Date().toISOString().split('T')[0];
  const wx = suggestion.weatherContext;
  const isWorn = suggestion.status === 'worn';

  async function toggle() {
    setBusy(true);
    await onToggleWorn(suggestion.id, isWorn);
    setBusy(false);
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isToday ? 'border-indigo-300 shadow-indigo-100' : isPast ? 'border-gray-100 opacity-80' : 'border-gray-100'
    }`}>
      {/* Day header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isToday ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-gray-800">
                {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              {isToday && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Today</span>}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {wx && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {WEATHER_ICON(wx.weatherCode)} {wx.tempMin}–{wx.tempMax}°C
                </span>
              )}
              {suggestion.eventContext && suggestion.eventContext !== 'casual' && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {EVENT_ICON[suggestion.eventContext] || '📌'} {suggestion.eventContext}
                </span>
              )}
            </div>
          </div>
        </div>
        {isWorn && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Worn</span>
        )}
      </div>

      {/* Outfit items */}
      <div className="px-4 py-4">
        {suggestion.items && suggestion.items.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-4">
            {suggestion.items.map(item => <ItemChip key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            No wardrobe items found for this outfit
          </div>
        )}

        <button
          onClick={toggle}
          disabled={busy}
          className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
            isWorn
              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {busy ? '...' : isWorn ? '✓ Worn — tap to undo' : 'Mark as worn'}
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
    const data = await getOutfits();
    setOutfits(Array.isArray(data) ? data.sort((a, b) => a.date.localeCompare(b.date)) : []);
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    const data = await generateOutfits();
    if (data.message && !Array.isArray(data)) {
      setError(data.message);
    } else if (Array.isArray(data)) {
      setOutfits(data.sort((a, b) => a.date.localeCompare(b.date)));
    }
    setGenerating(false);
  }

  async function handleToggleWorn(id, currentlyWorn) {
    const updated = currentlyWorn ? await markOutfitUnworn(id) : await markOutfitWorn(id);
    setOutfits(prev =>
      prev.map(o => o.id === id ? { ...o, status: currentlyWorn ? 'suggested' : 'worn' } : o)
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Outfit Planner</h1>
          <p className="text-gray-500 text-sm">7-day weather & calendar based suggestions</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span className={generating ? 'animate-spin inline-block' : ''}>✨</span>
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : outfits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">✨</p>
          <p className="font-medium text-gray-600">No outfits planned yet</p>
          <p className="text-sm mt-1">Make sure you have wardrobe items and your city is set, then click Generate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {outfits.map(o => (
            <DayCard key={o.id} suggestion={o} onToggleWorn={handleToggleWorn} />
          ))}
        </div>
      )}
    </div>
  );
}
