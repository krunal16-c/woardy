import { useState, useEffect } from 'react';
import { getLaundry, markAsWashed, IMG_URL } from '../api.service';

const CAT_ICON = {
  tops: '👕', bottoms: '👖', outerwear: '🧥',
  shoes: '👟', accessories: '💍', dresses: '👗',
};

function WashBadge({ count }) {
  const color =
    count >= 5 ? 'bg-red-100 text-red-700' :
    count >= 3 ? 'bg-orange-100 text-orange-700' :
    'bg-amber-100 text-amber-700';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      Worn {count}× since wash
    </span>
  );
}

export default function Laundry() {
  const [items, setItems] = useState([]);
  const [isWeekend, setIsWeekend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [washing, setWashing] = useState(new Set());
  const [washingAll, setWashingAll] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getLaundry();
    setItems(Array.isArray(data?.items) ? data.items : []);
    setIsWeekend(data?.isWeekend || false);
    setLoading(false);
  }

  async function handleWashItem(id) {
    setWashing(prev => new Set([...prev, id]));
    await markAsWashed([id]);
    setItems(prev => prev.filter(i => i.id !== id));
    setWashing(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  async function handleWashAll() {
    if (items.length === 0) return;
    setWashingAll(true);
    const ids = items.map(i => i.id);
    await markAsWashed(ids);
    setItems([]);
    setWashingAll(false);
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laundry Tracker</h1>
          <p className="text-gray-500 text-sm">Items worn multiple times since last wash</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleWashAll}
            disabled={washingAll}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {washingAll ? 'Washing...' : '🧼 Wash all'}
          </button>
        )}
      </div>

      {/* Weekend banner */}
      {isWeekend && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-5 mb-5 shadow-md">
          <p className="text-xl mb-1">🌟 Weekend time!</p>
          <p className="text-emerald-100 text-sm">Perfect day to do your laundry and refresh your wardrobe.</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">✨</p>
          <p className="font-medium text-gray-600">All clean!</p>
          <p className="text-sm mt-1">No items need washing right now.</p>
          <p className="text-xs mt-2 text-gray-400">Items appear here after being worn 2+ times since last wash.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} need washing</p>
          {items.map(item => (
            <LaundryItem
              key={item.id}
              item={item}
              onWash={handleWashItem}
              busy={washing.has(item.id)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-700 mb-2">When do items appear here?</p>
        <p>• Worn <strong>2×</strong> since last wash → appears in list (amber)</p>
        <p>• Worn <strong>3×</strong> → getting urgent (orange)</p>
        <p>• Worn <strong>5+×</strong> → definitely needs washing (red)</p>
        <p className="mt-2">Click "Mark as washed" to reset the counter.</p>
      </div>
    </div>
  );
}

function LaundryItem({ item, onWash, busy }) {
  const src = item.imageUrl ? `${IMG_URL}${item.imageUrl}` : null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <span className="text-2xl">{CAT_ICON[item.category] || '👔'}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <WashBadge count={item.wornSinceWash} />
          {item.color && <span className="text-xs text-gray-400">{item.color}</span>}
        </div>
        {item.lastWashed && (
          <p className="text-xs text-gray-400 mt-1">
            Last washed: {new Date(item.lastWashed).toLocaleDateString()}
          </p>
        )}
      </div>
      <button
        onClick={() => onWash(item.id)}
        disabled={busy}
        className="flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {busy ? '...' : '🧼 Washed'}
      </button>
    </div>
  );
}
