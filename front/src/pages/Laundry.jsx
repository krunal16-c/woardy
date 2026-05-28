import { useState, useEffect } from 'react';
import { getLaundry, markAsWashed, IMG_BASE } from '../api.service';

const CAT_ICON = { tops: 'tshirt', bottoms: 'straighten', outerwear: 'dry_cleaning', shoes: 'steps', accessories: 'diamond', dresses: 'styler' };

function Icon({ name, size = 18, filled = false, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}>
      {name}
    </span>
  );
}

const URGENCY_STYLE = {
  due:     'bg-amber-50  text-amber-700  border-amber-100',
  overdue: 'bg-orange-50 text-orange-700 border-orange-100',
  urgent:  'bg-red-50    text-red-700    border-red-100',
};

const URGENCY_LABEL = {
  due:     'Due for a wash',
  overdue: 'Overdue',
  urgent:  'Wash urgently!',
};

function UrgencyBadge({ wornSinceWash, washThreshold, urgency }) {
  const style = URGENCY_STYLE[urgency] || URGENCY_STYLE.due;
  const label = URGENCY_LABEL[urgency] || 'Due for a wash';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style}`}>
      {wornSinceWash}/{washThreshold}× — {label}
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
    const data = await getLaundry().catch(() => ({ items: [], isWeekend: false }));
    setItems(Array.isArray(data?.items) ? data.items : []);
    setIsWeekend(!!data?.isWeekend);
    setLoading(false);
  }

  async function washItem(id) {
    setWashing(prev => new Set([...prev, id]));
    await markAsWashed([id]).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
    setWashing(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  async function washAll() {
    if (!items.length) return;
    setWashingAll(true);
    await markAsWashed(items.map(i => i.id)).catch(() => {});
    setItems([]);
    setWashingAll(false);
  }

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-stone-900 tracking-tight">Laundry</h1>
          <p className="text-stone-400 text-sm mt-0.5">Items worn multiple times since last wash</p>
        </div>
        {items.length > 0 && (
          <button onClick={washAll} disabled={washingAll}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-3 md:px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0">
            <Icon name="local_laundry_service" size={16} filled />
            <span className="hidden sm:inline">{washingAll ? 'Washing…' : 'Wash all'}</span>
            <span className="sm:hidden">{washingAll ? '…' : 'All'}</span>
          </button>
        )}
      </div>

      {/* Weekend banner */}
      {isWeekend && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl px-5 py-4 mb-5 shadow-card-md">
          <div className="flex items-center gap-3">
            <Icon name="weekend" size={28} filled className="opacity-90" />
            <div>
              <p className="font-bold text-base">Weekend — perfect laundry time!</p>
              <p className="text-emerald-100 text-sm mt-0.5">A fresh wardrobe starts with clean clothes.</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-stone-300 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="check_circle" size={52} filled className="text-emerald-300 mb-3" />
          <p className="text-sm font-bold text-stone-600">All clean!</p>
          <p className="text-xs text-stone-400 mt-1">Items appear here after being worn 2+ times since the last wash.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
            {items.length} item{items.length !== 1 ? 's' : ''} reached wash threshold
          </p>
          {items.map(item => (
            <LaundryRow key={item.id} item={item} onWash={washItem} busy={washing.has(item.id)} />
          ))}
        </div>
      )}

      {/* Wash threshold guide */}
      <div className="mt-10 bg-white border border-stone-100 rounded-2xl p-4 shadow-card">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">When each type needs washing</p>
        <div className="space-y-2">
          {[
            { icon: 'tshirt',       label: 'Tops',       rule: 'Every 2 wears',  note: 'Summer/light tops: every 1 wear' },
            { icon: 'straighten',   label: 'Bottoms',    rule: 'Every 3 wears',  note: 'Denim: every 5 · Sport: every 1' },
            { icon: 'styler',       label: 'Dresses',    rule: 'Every 2 wears',  note: 'Formal/evening: every 3 · Sport: every 1' },
            { icon: 'dry_cleaning', label: 'Outerwear',  rule: 'Every 8 wears',  note: 'Sport outerwear: every 1' },
            { icon: 'fitness_center', label: 'Sport items', rule: 'Every 1 wear', note: 'Any category tagged sport/athletic' },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name={r.icon} size={14} className="text-stone-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-700">{r.label}</span>
                  <span className="text-[10px] font-bold text-stone-400">{r.rule}</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">{r.note}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-stone-100 flex gap-3 flex-wrap">
          {Object.entries(URGENCY_STYLE).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style}`}>{URGENCY_LABEL[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LaundryRow({ item, onWash, busy }) {
  const src = item.imageUrl ? `${IMG_BASE}${item.imageUrl}` : null;
  return (
    <div className="bg-white border border-stone-100 shadow-card rounded-2xl p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <Icon name={CAT_ICON[item.category] || 'checkroom'} size={22} className="text-stone-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 truncate mb-1">{item.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <UrgencyBadge
            wornSinceWash={item.wornSinceWash}
            washThreshold={item.washThreshold}
            urgency={item.urgency}
          />
          {item.color && <span className="text-[10px] text-stone-400">{item.color}</span>}
        </div>
        {item.lastWashed && (
          <p className="text-[10px] text-stone-400 mt-1">
            Last washed {new Date(item.lastWashed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
      <button onClick={() => onWash(item.id)} disabled={busy}
        className="shrink-0 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap">
        <Icon name="local_laundry_service" size={14} filled />
        {busy ? '…' : 'Washed'}
      </button>
    </div>
  );
}
