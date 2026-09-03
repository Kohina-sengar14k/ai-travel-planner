import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',           label: 'Dashboard', icon: '🏠' },
  { to: '/plan',       label: 'Plan Trip',  icon: '✈️' },
  { to: '/expenses',   label: 'Expenses',   icon: '💰' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-2xl">🌍</span>
            <span className="hidden sm:block">AI Travel Planner</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === to
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}
              >
                <span>{icon}</span>
                <span className="hidden md:block">{label}</span>
              </Link>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-blue-100 text-sm">
              👋 {user?.name?.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors border border-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
