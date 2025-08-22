import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const goToProfile = () => {
    navigate('/profile');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <h1 className="text-lg md:text-xl font-bold text-blue-600 truncate">
                  Sistema de Gestão de Poços
                </h1>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToProfile}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 cursor-pointer"
                >
                  <span>{currentUser?.displayName}</span>
                  <FaUser className="text-gray-600" />
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                  title="Logout"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-blue-600 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <FaTimes className="h-6 w-6" />
                ) : (
                  <FaBars className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white pt-2 pb-3 border-t border-gray-200">
            <div className="space-y-1 px-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">
                  {currentUser?.displayName || 'Usuário'}
                </span>
              </div>
              <button
                onClick={goToProfile}
                className="w-full text-left flex items-center space-x-2 py-2 text-gray-700 hover:text-blue-600"
              >
                <FaUser className="text-gray-600" />
                <span>Perfil</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center space-x-2 py-2 text-gray-700 hover:text-blue-600"
              >
                <FaSignOutAlt className="text-gray-600" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Add top padding to account for fixed navbar */}
      <div className="pt-16 flex-grow">
        <main className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;