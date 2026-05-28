import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/wardrobe', icon: 'checkroom', label: 'Wardrobe' },
  { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
  { to: '/planner', icon: 'auto_awesome', label: 'Planner' },
  { to: '/laundry', icon: 'local_laundry_service', label: 'Laundry' },
];

function Icon({ name, filled = false, size = 20 }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${filled ? 500 : 300}, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

export default function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[216px] shrink-0 bg-sidebar h-screen sticky top-0 select-none">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Icon name="style" filled size={16} />
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight leading-none">WardrobeAI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-sidebar-text text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 mb-3 mt-1">
            Navigation
          </p>
          {LINKS.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-sidebar-text hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={icon} filled={isActive} size={19} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-sidebar-text text-[11px] leading-relaxed">Smart outfit planning powered by weather &amp; calendar</p>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 bg-sidebar border-t border-white/5 flex z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {LINKS.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold tracking-wide transition-colors ${
                isActive ? 'text-indigo-400' : 'text-sidebar-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={icon} filled={isActive} size={22} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
