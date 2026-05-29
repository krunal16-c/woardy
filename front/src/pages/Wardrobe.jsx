import { useState, useEffect, useRef } from 'react';
import { getWardrobe, addWardrobeItem, deleteWardrobeItem, IMG_BASE } from '../api.service';
import WardrobeScan from '../components/WardrobeScan';

const CATEGORIES = ['tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'dresses'];
const CAT_ICON = { tops: 'tshirt', bottoms: 'straighten', outerwear: 'dry_cleaning', shoes: 'steps', accessories: 'diamond', dresses: 'styler' };
const CAT_LABEL = { tops: 'Tops', bottoms: 'Bottoms', outerwear: 'Outerwear', shoes: 'Shoes', accessories: 'Accessories', dresses: 'Dresses' };
const CAT_COLOR = {
  tops: 'bg-sky-50 text-sky-700',
  bottoms: 'bg-stone-100 text-stone-600',
  outerwear: 'bg-orange-50 text-orange-700',
  shoes: 'bg-yellow-50 text-yellow-700',
  accessories: 'bg-pink-50 text-pink-700',
  dresses: 'bg-violet-50 text-violet-700',
};
const TAGS = ['casual', 'formal', 'business', 'sport', 'outdoor', 'party', 'summer', 'winter', 'spring', 'fall', 'light', 'heavy'];

function Icon({ name, size = 20, filled = false, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}>
      {name}
    </span>
  );
}

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'tops', color: '', tags: [] });
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getWardrobe().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function onFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  }

  function toggleTag(t) {
    setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('category', form.category);
    fd.append('color', form.color);
    fd.append('tags', JSON.stringify(form.tags));
    if (file) fd.append('image', file);
    const res = await addWardrobeItem(fd).catch(() => null);
    if (res?.id) {
      closeDrawer();
      await load();
    }
    setSaving(false);
  }

  function closeDrawer() {
    setShowDrawer(false);
    setForm({ name: '', category: 'tops', color: '', tags: [] });
    setFile(null); setPreview(null);
  }

  async function del(id) {
    setDeleting(id);
    await deleteWardrobeItem(id).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-stone-900 tracking-tight">My Wardrobe</h1>
          <p className="text-stone-400 text-sm mt-0.5">{items.length} items catalogued</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScan(true)}
            className="flex items-center gap-2 bg-white border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50 text-stone-700 hover:text-indigo-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Icon name="auto_awesome" size={18} className="text-indigo-500" />
            Scan
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Icon name="add" size={18} />
            Add item
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
              filter === cat
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            {cat !== 'all' && <Icon name={CAT_ICON[cat]} size={13} filled={filter === cat} />}
            {cat === 'all' ? 'All' : CAT_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-stone-300 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Icon name={filter === 'all' ? 'checkroom' : CAT_ICON[filter]} size={48} className="text-stone-200 mb-3" />
          <p className="text-sm font-semibold text-stone-500">No {filter === 'all' ? 'items' : CAT_LABEL[filter].toLowerCase()} yet</p>
          <button onClick={() => setShowDrawer(true)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Add your first item →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} onDelete={del} deleting={deleting === item.id} />
          ))}
        </div>
      )}

      {/* Add item drawer — bottom sheet on mobile, right panel on desktop */}
      {showDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute inset-x-0 bottom-0 md:inset-x-auto md:inset-y-0 md:right-0 md:w-[28rem] bg-white shadow-card-lg flex flex-col overflow-hidden rounded-t-2xl md:rounded-none max-h-[92vh] md:max-h-full">
            {/* Drag handle pill — mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">Add Clothing Item</h2>
              <button onClick={closeDrawer} className="text-stone-400 hover:text-stone-600 transition-colors">
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Photo */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Photo</label>
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-stone-200 rounded-xl h-36 overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-300 bg-stone-50 transition-colors"
                >
                  {preview
                    ? <img src={preview} className="w-full h-full object-cover" alt="preview" />
                    : <div className="text-center text-stone-400">
                        <Icon name="photo_camera" size={28} className="mb-1" />
                        <p className="text-xs">Tap to upload or take photo</p>
                      </div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Blue Oxford Shirt"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`flex items-center gap-1.5 justify-center py-2 px-2 rounded-xl text-[12px] font-semibold border transition-all ${
                        form.category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                      }`}>
                      <Icon name={CAT_ICON[cat]} size={14} filled={form.category === cat} />
                      {CAT_LABEL[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Color</label>
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="e.g. Navy Blue"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Style Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        form.tags.includes(t) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Add to Wardrobe'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showScan && (
        <WardrobeScan
          onClose={() => setShowScan(false)}
          onDone={() => { setShowScan(false); load(); }}
        />
      )}
    </div>
  );
}

function ItemCard({ item, onDelete, deleting }) {
  const src = item.imageUrl ? `${IMG_BASE}${item.imageUrl}` : null;
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden group hover:shadow-card-md transition-shadow">
      <div className="aspect-square bg-stone-50 relative">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Icon name={CAT_ICON[item.category] || 'checkroom'} size={36} className="text-stone-300" />
            </div>}
        <button
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity hover:bg-red-50 border border-stone-100"
        >
          <Icon name="delete" size={14} className="text-red-400" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-stone-800 truncate mb-1.5">{item.name}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${CAT_COLOR[item.category] || 'bg-stone-100 text-stone-600'}`}>
            {CAT_LABEL[item.category] || item.category}
          </span>
          {item.color && <span className="text-[10px] text-stone-400">{item.color}</span>}
        </div>
        {(item.wornSinceWash || 0) >= 2 && (
          <p className="text-[10px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
            <Icon name="info" size={11} filled /> {item.wornSinceWash}× since wash
          </p>
        )}
      </div>
    </div>
  );
}
