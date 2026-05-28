import { useState, useEffect } from 'react';
import { getCalendarEvents, addCalendarEvent, deleteCalendarEvent } from '../api.service';

const EVENT_TYPES = [
  { value: 'casual', label: 'Casual', icon: '😊' },
  { value: 'formal', label: 'Formal', icon: '🤵' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌿' },
  { value: 'sport', label: 'Sport', icon: '🏃' },
  { value: 'party', label: 'Party', icon: '🎉' },
];

const EVENT_STYLE = {
  casual: 'bg-blue-50 text-blue-700 border-blue-100',
  formal: 'bg-gray-50 text-gray-700 border-gray-200',
  business: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  outdoor: 'bg-green-50 text-green-700 border-green-100',
  sport: 'bg-orange-50 text-orange-700 border-orange-100',
  party: 'bg-pink-50 text-pink-700 border-pink-100',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), title: '', eventType: 'casual' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getCalendarEvents();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.date || !form.title.trim()) return;
    setSaving(true);
    const result = await addCalendarEvent(form);
    if (result.id) {
      setEvents(prev => [...prev, result].sort((a, b) => a.date.localeCompare(b.date)));
      setForm({ date: todayStr(), title: '', eventType: 'casual' });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    await deleteCalendarEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  // Group by date
  const today = todayStr();
  const upcoming = events.filter(e => e.date >= today);
  const past = events.filter(e => e.date < today);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Calendar</h1>
          <p className="text-gray-500 text-sm">Events that influence outfit suggestions</p>
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? '× Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">New Event</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Job interview, gym, birthday party"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(et => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, eventType: et.value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 justify-center ${
                    form.eventType === et.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <span>{et.icon}</span> {et.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Event'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📅</p>
          <p className="font-medium">No events added</p>
          <p className="text-sm mt-1">Add events to get smarter outfit suggestions</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map(event => <EventRow key={event.id} event={event} onDelete={handleDelete} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Past</h2>
              <div className="space-y-2 opacity-60">
                {past.slice(-5).reverse().map(event => <EventRow key={event.id} event={event} onDelete={handleDelete} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, onDelete }) {
  const et = EVENT_TYPES.find(t => t.value === event.eventType) || EVENT_TYPES[0];
  const dateObj = new Date(event.date + 'T12:00:00');
  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${EVENT_STYLE[event.eventType] || 'bg-white border-gray-100'}`}>
      <span className="text-2xl">{et.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{event.title}</p>
        <p className="text-xs opacity-70 mt-0.5">{dateLabel}</p>
      </div>
      <span className="text-xs font-medium opacity-80 hidden sm:block">{et.label}</span>
      <button
        onClick={() => onDelete(event.id)}
        className="text-red-400 hover:text-red-600 text-lg leading-none px-1 transition-colors"
        title="Delete event"
      >
        ×
      </button>
    </div>
  );
}
