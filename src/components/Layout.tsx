import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Wrench, 
  Home, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const NavLink: React.FC<{
    to: string;
    icon: React.ReactNode;
    label: string;
  }> = ({ to, icon, label }) => (
    <Link
      to={to}
      className={`flex items-center p-3 rounded-lg transition-colors ${
        isActive(to)
          ? 'bg-blue-100 text-blue-600'
          : 'hover:bg-gray-100'
      }`}
      onClick={() => setIsOpen(false)}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button
        className="fixed z-20 p-2 m-2 text-white bg-blue-600 rounded-md lg:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-6 bg-blue-600">
            <h1 className="text-xl font-bold text-white">AutoCare</h1>
          </div>

          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavLink to="/" icon={<Home size={20} />} label="Dashboard" />
            <NavLink to="/vehicles" icon={<Car size={20} />} label="Vehicles" />
            <NavLink to="/maintenance" icon={<Wrench size={20} />} label="Maintenance" />
            <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" />
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={20} className="mr-3" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <main className="container p-4 mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;