import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Moon, Sun, User, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-200 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border-b shadow-sm`}>
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors hover:${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className={`text-xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            LimReview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors hover:${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className={`text-sm font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.name}
                </span>
              </div>
              
              <button
                onClick={logout}
                className={`p-2 rounded-lg transition-colors hover:${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;