import { useState, useEffect, useRef } from 'react';
import { getWardrobe, addWardrobeItem, deleteWardrobeItem, IMG_URL } from '../api.service';

const CATEGORIES = ['tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'dresses'];
const CAT_ICON = { tops: '👕', bottoms: '👖', outerwear: '🧥', shoes: '👟', accessories: '💍', dresses: '👗' };
const CAT_COLOR = {
  tops: 'bg-blue-100 text-blue-700',
  bottoms: 'bg-gray-100 text-gray-700',
  outerwear: 'bg-orange-100 text-orange-700',
  shoes: 'bg-yellow-100 text-yellow-700',
  accessories: 'bg-pink-100 text-pink-700',
  dresses: 'bg-purple-100 text-purple-700',
};
const TAGS = ['casual', 'formal', 'business', 'sport', 'outdoor', 'party', 'summer', 'winter', 'spring', 'fall', 'light', 'heavy'];

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: '', category: 'tops', color: '', tags: [] });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getWardrobe();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('category', form.category);
    fd.append('color', form.color);
    fd.append('tags', JSON.stringify(form.tags));
    if (imageFile) fd.append('image', imageFile);

    const result = await addWardrobeItem(fd);
    if (result.id) {
      setShowAdd(false);
      setForm({ name: '', category: 'tops', color: '', tags: [] });
      setImageFile(null);
      setImagePreview(null);
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    setDeleting(id);
    await deleteWardrobeItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Wardrobe</h1>
          <p className="text-gray-500 text-sm">{items.length} items catalogued</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Add Item
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {cat === 'all' ? 'All' : `${CAT_ICON[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">{filter === 'all' ? '👗' : CAT_ICON[filter]}</p>
          <p className="font-medium">No {filter === 'all' ? 'items' : filter} yet</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
            Add your first item →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} onDelete={handleDelete} deleting={deleting === item.id} />
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Clothing Item</h2>
              <button onClick={() => { setShowAdd(false); setImagePreview(null); setImageFile(null); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl h-36 flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-colors overflow-hidden bg-gray-50"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="text-3xl mb-1">📷</p>
                      <p className="text-xs">Tap to upload or take photo</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Blue Oxford Shirt"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.category === cat
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {CAT_ICON[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="e.g. Navy Blue"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        form.tags.includes(tag)
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add to Wardrobe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, onDelete, deleting }) {
  const src = item.imageUrl ? `${IMG_URL}${item.imageUrl}` : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {src
          ? <img src={src} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{CAT_ICON[item.category] || '👔'}</div>}
        <button
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
        >
          ×
        </button>
      </div>
      <div className="p-3">
        <p className="font-medium text-sm text-gray-800 truncate">{item.name}</p>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[item.category] || 'bg-gray-100 text-gray-600'}`}>
            {item.category}
          </span>
          {item.color && <span className="text-xs text-gray-400">{item.color}</span>}
        </div>
        {(item.wornSinceWash || 0) > 0 && (
          <p className="text-xs text-amber-600 mt-1">Worn {item.wornSinceWash}× since wash</p>
        )}
      </div>
    </div>
  );
}
