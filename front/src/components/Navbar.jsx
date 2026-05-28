import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { to: '/wardrobe', icon: '👕', label: 'Wardrobe' },
  { to: '/calendar', icon: '📅', label: 'Calendar' },
  { to: '/planner', icon: '✨', label: 'Outfit Planner' },
  { to: '/laundry', icon: '🧺', label: 'Laundry' },
];

export default function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shadow-sm h-screen sticky top-0">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight">WardrobeAI</h1>
          <p className="text-xs text-gray-400 mt-0.5">Smart outfit planner</p>
        </div>
        <div className="flex-1 py-4 px-3 space-y-1">
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">© 2024 WardrobeAI</p>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 flex">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span className="mt-0.5 leading-tight">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
