import { useEffect } from 'react';
import { Link } from 'react-router-dom';

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('w-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('.w-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ name, size = 20, filled = false, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${filled ? 500 : 300}, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

// ── Mini preview cards ────────────────────────────────────────────────────────
function PreviewWeather() {
  return (
    <div className="bg-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden w-52 shadow-2xl shadow-indigo-900/50">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
      <div className="absolute -right-2 top-8 w-14 h-14 bg-white/5 rounded-full" />
      <div className="relative">
        <p className="text-indigo-200 text-[11px] font-medium mb-2.5">London, UK</p>
        <div className="flex items-center gap-2.5 mb-3">
          <Icon name="wb_sunny" size={34} filled className="text-white/90" />
          <div>
            <p className="text-[30px] font-bold tracking-tight leading-none">18°</p>
            <p className="text-indigo-200 text-[11px] mt-0.5">Clear sky</p>
          </div>
        </div>
        <div className="flex gap-1 pt-2.5 border-t border-indigo-500/50">
          {[['Mon', 'wb_sunny', 20], ['Tue', 'partly_cloudy_day', 17], ['Wed', 'rainy_light', 14]].map(([d, ic, t]) => (
            <div key={d} className="flex-1 text-center">
              <p className="text-indigo-300 text-[9px] font-medium">{d}</p>
              <Icon name={ic} size={13} filled className="text-white/80 my-0.5" />
              <p className="text-white text-[10px] font-semibold">{t}°</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewOutfit() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-2xl p-4 w-56">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Today's Outfit</p>
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <Icon name="check_circle" size={9} filled /> Worn
        </span>
      </div>
      <div className="flex gap-2 mb-3">
        {[['checkroom', 'bg-indigo-50'], ['straighten', 'bg-stone-100'], ['steps', 'bg-amber-50']].map(([ic, bg], i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-[46px] h-[46px] rounded-xl ${bg} border border-stone-200 flex items-center justify-center`}>
              <Icon name={ic} size={18} className="text-stone-400" />
            </div>
            <p className="text-[8px] text-stone-400">Item {i + 1}</p>
          </div>
        ))}
      </div>
      <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl py-1.5 text-center text-[10px] font-semibold">
        Marked as worn today
      </div>
    </div>
  );
}

function PreviewStats() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-2xl p-3 flex gap-2 w-48">
      {[
        { icon: 'checkroom', val: '24', sub: 'Items', bg: 'bg-indigo-50', fg: 'text-indigo-600' },
        { icon: 'check_circle', val: '5', sub: 'Worn', bg: 'bg-emerald-50', fg: 'text-emerald-600' },
        { icon: 'local_laundry_service', val: '2', sub: 'Laundry', bg: 'bg-amber-50', fg: 'text-amber-600' },
      ].map(({ icon, val, sub, bg, fg }) => (
        <div key={sub} className="flex-1 text-center">
          <div className={`w-7 h-7 rounded-lg ${bg} ${fg} flex items-center justify-center mx-auto mb-1`}>
            <Icon name={icon} size={13} filled />
          </div>
          <p className="text-[13px] font-bold text-stone-800 leading-none">{val}</p>
          <p className="text-[9px] text-stone-400 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Features data ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'checkroom',             title: 'Wardrobe catalogue',   desc: 'Upload photos, tag by category, colour and season.' },
  { icon: 'auto_awesome',          title: '7-day outfit planner',  desc: 'Score-based picks matched to your forecast and calendar events.' },
  { icon: 'wb_sunny',              title: 'Weather-aware',         desc: 'Live 7-day forecast via Open-Meteo — no API key needed.' },
  { icon: 'calendar_month',        title: 'Calendar sync',         desc: 'Google and Apple Calendar — connect once, events sync automatically.' },
  { icon: 'history',               title: 'Wear tracking',         desc: 'Mark outfits worn and build a history automatically.' },
  { icon: 'local_laundry_service', title: 'Laundry reminders',     desc: 'Items worn 2+ times surface on the Laundry page with a weekend nudge.' },
];

// ── Landing ───────────────────────────────────────────────────────────────────
export default function Landing() {
  useScrollReveal();

  return (
    <>
      <style>{`
        /* ── Hero entrance animations ── */
        @keyframes woardy-float {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50%       { transform: translateY(-10px) rotate(var(--r, 0deg)); }
        }
        @keyframes woardy-float-rev {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50%       { transform: translateY(10px) rotate(var(--r, 0deg)); }
        }
        @keyframes woardy-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .w-float-a { animation: woardy-float 6s ease-in-out infinite; }
        .w-float-b { animation: woardy-float-rev 7s ease-in-out infinite; animation-delay: -2s; }
        .w-float-c { animation: woardy-float 5.5s ease-in-out infinite; animation-delay: -3.5s; }
        .w-fade-up { opacity: 0; animation: woardy-fade-up 0.5s ease-out forwards; }

        /* ── Scroll reveal ── */
        .w-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .w-revealed {
          opacity: 1;
          transform: none;
        }
      `}</style>

      <div className="font-sans flex flex-col">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#18181b' }} className="min-h-screen flex flex-col relative overflow-hidden">

          {/* Dot-grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Indigo glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 55% 65% at 72% 48%, rgba(79,70,229,0.13) 0%, transparent 70%)',
            }}
          />

          {/* Top bar */}
          <nav className="relative z-10 flex items-center justify-between px-6 md:px-14 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Icon name="style" filled size={16} />
              </div>
              <span className="text-white font-bold text-[15px] tracking-tight leading-none">woardy</span>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-[13px] font-medium transition-colors duration-150"
            >
              Open App <Icon name="arrow_forward" size={14} />
            </Link>
          </nav>

          {/* Hero body */}
          <div className="relative z-10 flex-1 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-6 md:px-14 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left: copy */}
              <div>
                <div
                  className="w-fade-up mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 text-xs font-medium tracking-wide"
                  style={{ animationDelay: '0.05s' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  Smart wardrobe. Zero effort.
                </div>

                <h1
                  className="w-fade-up text-[52px] md:text-[64px] font-bold text-white tracking-tight leading-[1.04] mb-5"
                  style={{ animationDelay: '0.12s' }}
                >
                  Dress for the day,
                  <br />
                  <span className="text-indigo-400">not the weather.</span>
                </h1>

                <p
                  className="w-fade-up text-zinc-400 text-[16px] leading-relaxed mb-8 max-w-[420px]"
                  style={{ animationDelay: '0.22s' }}
                >
                  woardy plans your outfits around your calendar and the forecast — so you always know what to wear.
                </p>

                <div className="w-fade-up mb-8" style={{ animationDelay: '0.32s' }}>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors duration-150 shadow-lg shadow-indigo-600/20"
                  >
                    Get started
                    <Icon name="arrow_forward" size={15} />
                  </Link>
                </div>

                <div
                  className="w-fade-up flex flex-wrap items-center gap-x-5 gap-y-2"
                  style={{ animationDelay: '0.42s' }}
                >
                  {['Weather-aware', 'Calendar sync', 'Wear tracking', 'Laundry alerts'].map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-[12px] text-zinc-500 font-medium">
                      <span className="w-[3px] h-[3px] rounded-full bg-indigo-500/70 shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: floating preview */}
              <div className="relative hidden lg:flex items-center justify-center" style={{ height: '460px' }}>
                <div className="w-float-a absolute top-0 right-0" style={{ '--r': '-3deg' }}>
                  <PreviewWeather />
                </div>
                <div className="w-float-b absolute left-4" style={{ '--r': '2deg', top: '160px' }}>
                  <PreviewOutfit />
                </div>
                <div className="w-float-c absolute bottom-0 right-12" style={{ '--r': '-1.5deg' }}>
                  <PreviewStats />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section className="bg-stone-50 py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <p
              className="w-reveal text-center text-[10px] font-semibold text-stone-400 uppercase tracking-[0.18em] mb-10"
            >
              Everything you need
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon, title, desc }, i) => (
                <div
                  key={title}
                  className="w-reveal bg-white rounded-2xl p-6 shadow-card border border-stone-100 flex flex-col gap-4 hover:shadow-card-md transition-shadow duration-200 cursor-default"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Icon name={icon} filled size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-[14px] mb-1">{title}</p>
                    <p className="text-stone-500 text-[13px] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer
          style={{ background: '#18181b' }}
          className="relative overflow-hidden border-t border-stone-200"
        >
          {/* Dot-grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Ghost watermark */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
            <span
              className="select-none leading-none font-black tracking-tighter text-white"
              style={{ fontSize: 'clamp(80px, 18vw, 220px)', opacity: 0.025 }}
            >
              woardy
            </span>
          </div>

          {/* Main columns */}
          <div className="relative px-6 md:px-14 pt-14 pb-14">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-start">

              {/* Brand */}
              <div className="w-reveal" style={{ transitionDelay: '0ms' }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                    <Icon name="style" filled size={16} />
                  </div>
                  <span className="text-white font-bold text-[15px] tracking-tight leading-none">woardy</span>
                </div>
                <p className="text-zinc-500 text-[13px] leading-relaxed max-w-[300px] mb-6">
                  Your wardrobe, organised. Outfit suggestions tailored to your calendar and the forecast — every day.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors duration-150 shadow-lg shadow-indigo-600/20"
                >
                  Open App <Icon name="arrow_forward" size={14} />
                </Link>
              </div>

              {/* App pages */}
              <div className="w-reveal" style={{ transitionDelay: '100ms' }}>
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.15em] mb-5">App</p>
                <ul className="space-y-3.5">
                  {[
                    { label: 'Dashboard',      to: '/dashboard' },
                    { label: 'Wardrobe',       to: '/wardrobe'  },
                    { label: 'Outfit Planner', to: '/planner'   },
                    { label: 'Calendar',       to: '/calendar'  },
                    { label: 'Laundry',        to: '/laundry'   },
                  ].map(({ label, to }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-zinc-500 hover:text-white text-[13px] transition-colors duration-150"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative border-t border-white/[0.06] px-6 md:px-14 py-5 flex items-center justify-between">
            <p className="text-zinc-700 text-[12px]">© 2025 woardy</p>
            <p className="text-zinc-700 text-[12px]">Made with care</p>
          </div>
        </footer>

      </div>
    </>
  );
}
