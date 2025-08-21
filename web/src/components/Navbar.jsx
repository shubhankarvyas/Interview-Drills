import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="nav-glass sticky top-0 z-50 px-4 py-3 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-700 to-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <span className="text-2xl font-bold text-white group-hover:text-gray-300 transition-colors duration-300">Upivot</span>
        </Link>

        {/* Navigation Links */}
        {user && (
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'bg-gray-800 text-white shadow-lg shadow-black/25 border border-gray-600'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/history"
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive('/history')
                  ? 'bg-gray-800 text-white shadow-lg shadow-black/25 border border-gray-600'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              History
            </Link>
          </div>
        )}

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <img
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                />
                <span className="text-white font-medium hidden sm:block">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="glass-button text-white hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href="http://localhost:5001/auth/google"
              className="glass-button text-white hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
            >
              Sign In
            </a>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10">
          <div className="flex space-x-4">
            <Link
              to="/dashboard"
              className={`flex-1 px-4 py-2 rounded-lg text-center transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'bg-gray-800 text-white shadow-lg shadow-black/25 border border-gray-600'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/history"
              className={`flex-1 px-4 py-2 rounded-lg text-center transition-all duration-300 ${
                isActive('/history')
                  ? 'bg-gray-800 text-white shadow-lg shadow-black/25 border border-gray-600'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              History
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
