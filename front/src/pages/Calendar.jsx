import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCalendarEvents, addCalendarEvent, deleteCalendarEvent,
  getGoogleStatus, getGoogleAuthUrl, disconnectGoogle,
  getAppleStatus, connectApple, disconnectApple,
} from '../api.service';

const EVENT_TYPES = [
  { value: 'casual',   label: 'Casual',   icon: 'mood' },
  { value: 'formal',   label: 'Formal',   icon: 'business_center' },
  { value: 'business', label: 'Business', icon: 'work' },
  { value: 'outdoor',  label: 'Outdoor',  icon: 'park' },
  { value: 'sport',    label: 'Sport',    icon: 'fitness_center' },
  { value: 'party',    label: 'Party',    icon: 'celebration' },
];
const ET_MAP = Object.fromEntries(EVENT_TYPES.map(e => [e.value, e]));

const ET_STYLE = {
  casual:   'bg-sky-50   text-sky-700   border-sky-100',
  formal:   'bg-stone-50 text-stone-700 border-stone-200',
  business: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  outdoor:  'bg-green-50 text-green-700 border-green-100',
  sport:    'bg-orange-50 text-orange-700 border-orange-100',
  party:    'bg-pink-50  text-pink-700  border-pink-100',
};

function Icon({ name, size = 18, filled = false, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}>
      {name}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.62-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-166.2-141.4C112.2 714 65 612.1 65 512.6c0-165 107.4-252.3 107.4-252.3s-38.1-99.5 0-248.2c28.5-108.2 84.8-186.9 143.7-186.9s111.2 52.6 204.2 52.6c80 0 130.3-52.6 204.2-52.6 58.9 0 115.2 78.7 143.7 186.9 38.1 149.5 0 248.2 0 248.2s11.6 5.8 24.3 12.6c12.6 6.5 31.1 20.3 49.3 40.1z"/>
    </svg>
  );
}

function Toast({ message, type, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-card-lg text-sm font-medium animate-fade-in ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      <Icon name={type === 'success' ? 'check_circle' : 'error'} size={16} filled />
      {message}
    </div>
  );
}

export default function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [googleStatus, setGoogleStatus] = useState({ connected: false });
  const [appleStatus, setAppleStatus] = useState({ connected: false });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAppleForm, setShowAppleForm] = useState(false);
  const [appleForm, setAppleForm] = useState({ email: '', appPassword: '' });
  const [connectingApple, setConnectingApple] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), title: '', eventType: 'casual' });

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Handle OAuth redirect params
  useEffect(() => {
    const google = searchParams.get('google');
    if (google === 'connected') { showToast('Google Calendar connected!'); setSearchParams({}); }
    if (google === 'error') {
      showToast(searchParams.get('message') || 'Google Calendar connection failed', 'error');
      setSearchParams({});
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [evts, gs, as] = await Promise.all([
      getCalendarEvents().catch(() => []),
      getGoogleStatus().catch(() => ({ connected: false })),
      getAppleStatus().catch(() => ({ connected: false })),
    ]);
    setEvents(Array.isArray(evts) ? evts : []);
    setGoogleStatus(gs);
    setAppleStatus(as);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function addEvent(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await addCalendarEvent(form).catch(() => null);
    if (res?.id) {
      setEvents(prev => [...prev, res].sort((a, b) => a.date.localeCompare(b.date)));
      setForm(f => ({ ...f, title: '' }));
      setShowAddForm(false);
    }
    setSaving(false);
  }

  async function delEvent(id) {
    await deleteCalendarEvent(id).catch(() => {});
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function connectGoogle() {
    setConnectingGoogle(true);
    try {
      const { url, setup, message } = await getGoogleAuthUrl();
      if (setup) { showToast(message, 'error'); return; }
      window.location.href = url;
    } catch (err) {
      showToast(err.message || 'Failed to get auth URL', 'error');
    } finally { setConnectingGoogle(false); }
  }

  async function handleDisconnectGoogle() {
    await disconnectGoogle().catch(() => {});
    setGoogleStatus({ connected: false });
    showToast('Google Calendar disconnected');
  }

  async function handleConnectApple(e) {
    e.preventDefault();
    setConnectingApple(true);
    try {
      const res = await connectApple({ email: appleForm.email, appPassword: appleForm.appPassword });
      setAppleStatus({ connected: true, accountHint: res.accountHint, status: 'active' });
      setShowAppleForm(false);
      setAppleForm({ email: '', appPassword: '' });
      showToast('Apple Calendar connected!');
    } catch (err) {
      showToast(err.message || 'Connection failed', 'error');
    } finally { setConnectingApple(false); }
  }

  async function handleDisconnectApple() {
    await disconnectApple().catch(() => {});
    setAppleStatus({ connected: false });
    showToast('Apple Calendar disconnected');
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => e.date >= today);
  const past = events.filter(e => e.date < today);

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-stone-900 tracking-tight">Calendar</h1>
        <p className="text-stone-400 text-sm mt-0.5">Events that influence your outfit suggestions</p>
      </header>

      {/* Connected Calendars */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Connected Calendars</h2>
        <div className="space-y-2">
          {/* Google */}
          <div className="bg-white border border-stone-100 shadow-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
              <GoogleIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800">Google Calendar</p>
              {googleStatus.connected
                ? <p className="text-[11px] text-stone-400 truncate">{googleStatus.accountHint || 'Connected'} · Synced {googleStatus.lastSyncAt ? new Date(googleStatus.lastSyncAt).toLocaleDateString() : '—'}</p>
                : <p className="text-[11px] text-stone-400">Not connected</p>}
            </div>
            {googleStatus.connected
              ? <button onClick={handleDisconnectGoogle} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Disconnect</button>
              : <button onClick={connectGoogle} disabled={connectingGoogle}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1">
                  {connectingGoogle ? 'Redirecting…' : <><Icon name="link" size={13} /> Connect</>}
                </button>}
          </div>

          {/* Apple */}
          <div className="bg-white border border-stone-100 shadow-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shrink-0 text-white">
                <AppleIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">Apple Calendar</p>
                {appleStatus.connected
                  ? <p className="text-[11px] text-stone-400 truncate">{appleStatus.accountHint || 'Connected'} · iCloud CalDAV</p>
                  : <p className="text-[11px] text-stone-400">Connect via iCloud CalDAV</p>}
              </div>
              {appleStatus.connected
                ? <button onClick={handleDisconnectApple} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Disconnect</button>
                : <button onClick={() => setShowAppleForm(v => !v)}
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-1">
                    <Icon name="link" size={13} /> Connect
                  </button>}
            </div>

            {/* Apple connect form */}
            {!appleStatus.connected && showAppleForm && (
              <form onSubmit={handleConnectApple} className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-[11px] text-amber-800 leading-relaxed">
                  <strong>App-Specific Password required.</strong> Your real Apple ID password won't work due to 2FA.
                  Generate one at <span className="font-semibold underline">appleid.apple.com</span> → Security → App-Specific Passwords.
                </div>
                <input required type="email" value={appleForm.email} onChange={e => setAppleForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Apple ID email" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input required value={appleForm.appPassword} onChange={e => setAppleForm(f => ({ ...f, appPassword: e.target.value }))}
                  placeholder="xxxx-xxxx-xxxx-xxxx" pattern="[a-zA-Z]{4}-[a-zA-Z]{4}-[a-zA-Z]{4}-[a-zA-Z]{4}"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 font-mono tracking-wider" />
                <button type="submit" disabled={connectingApple}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {connectingApple ? 'Verifying…' : 'Connect Apple Calendar'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Manual events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">My Events</h2>
          <button onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            <Icon name={showAddForm ? 'remove' : 'add'} size={14} />
            {showAddForm ? 'Cancel' : 'Add event'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={addEvent} className="bg-white border border-stone-100 shadow-card rounded-2xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Date</label>
                <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Title</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Meeting, gym, party…"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map(et => (
                  <button key={et.value} type="button" onClick={() => setForm(f => ({ ...f, eventType: et.value }))}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      form.eventType === et.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                    }`}>
                    <Icon name={et.icon} size={12} filled={form.eventType === et.value} /> {et.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Event'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-10 text-stone-300 text-sm">Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="calendar_month" size={44} className="text-stone-200 mb-2" />
            <p className="text-sm font-medium text-stone-500">No events yet</p>
            <p className="text-xs text-stone-400 mt-1">Add events so outfits are chosen for the right occasion</p>
          </div>
        ) : (
          <div className="space-y-5">
            {upcoming.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Upcoming</p>
                <div className="space-y-1.5">
                  {upcoming.map(ev => <EventRow key={ev.id} event={ev} onDelete={delEvent} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Past</p>
                <div className="space-y-1.5 opacity-50">
                  {past.slice(-5).reverse().map(ev => <EventRow key={ev.id} event={ev} onDelete={delEvent} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function EventRow({ event, onDelete }) {
  const et = ET_MAP[event.eventType] || ET_MAP.casual;
  const d = new Date(event.date + 'T12:00:00');
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${ET_STYLE[event.eventType] || 'bg-white border-stone-100'}`}>
      <Icon name={et.icon} size={16} filled className="shrink-0 opacity-70" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{event.title}</p>
        <p className="text-[11px] opacity-60">{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>
      <span className="text-[10px] font-bold opacity-60 hidden sm:block">{et.label}</span>
      <button onClick={() => onDelete(event.id)} className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-70">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
