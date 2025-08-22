import React, { useState, useEffect, useRef } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaKey, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

const PasswordEntryModal = ({ isOpen, onClose, onSubmit, title, itemName, passwordError }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  // Update error state when passwordError prop changes
  useEffect(() => {
    if (passwordError) {
      setError('Senha incorreta. Por favor, tente novamente.');
      setAttemptCount(prev => prev + 1);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [passwordError]);

  // Add this to save last entered password for specific items in session storage
  const savePasswordToSessionStorage = (password) => {
    try {
      // Only store if we have an item name (used as key)
      if (itemName) {
        const key = `pwd_${itemName.replace(/\s+/g, '_')}`;
        sessionStorage.setItem(key, password);
      }
    } catch (error) {
      console.error("Error saving password to session storage:", error);
      // Continue without saving - not critical
    }
  };

  // Try to get password from session storage
  useEffect(() => {
    if (isOpen && itemName) {
      try {
        const key = `pwd_${itemName.replace(/\s+/g, '_')}`;
        const savedPassword = sessionStorage.getItem(key);
        if (savedPassword) {
          setPassword(savedPassword);
          // Auto-submit if we have a saved password
          setTimeout(() => {
            onSubmit(savedPassword);
          }, 100);
        }
      } catch (error) {
        console.error("Error getting password from session storage:", error);
      }
    }
  }, [isOpen, itemName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, digite a senha');
      return;
    }
    
    // Save password before submitting
    savePasswordToSessionStorage(password);
    onSubmit(password);
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Get error class based on attempt count
  const getErrorClass = () => {
    if (attemptCount >= 3) {
      return 'animate-shake border-red-500 bg-red-50';
    }
    if (error) {
      return 'border-red-300 focus:ring-red-500 focus:border-red-500';
    }
    return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="animate-slideIn w-full max-w-md">
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all">
          {/* Modal header with shield background */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white relative">
            <div className="absolute right-4 top-4 opacity-10">
              <FaShieldAlt className="h-24 w-24" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-full">
                <FaKey className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold" id="modal-title">
                  {title || 'Acesso Protegido'}
                </h3>
                <p className="mt-1 text-blue-100">
                  {`${itemName || 'Este item'} está protegido por senha`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm text-gray-500 mb-3">
                Digite a senha para acessar este item.
              </div>
              
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha de acesso
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className={`h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    ref={inputRef}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={handleKeyDown}
                    className={`block w-full pl-10 pr-10 py-3 border ${getErrorClass()} rounded-lg shadow-sm focus:outline-none transition-colors`}
                    placeholder="Digite a senha"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <FaExclamationTriangle className="h-4 w-4 mr-2" />
                    <span>{error}</span>
                  </div>
                )}
                
                {attemptCount >= 3 && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    <p>Muitas tentativas incorretas. Se você é o proprietário deste item e esqueceu sua senha, entre em contato com um administrador.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex justify-center items-center px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <FaKey className="mr-2" /> Desbloquear
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto flex justify-center items-center px-6 py-2.5 border border-gray-300 text-gray-700 font-medium text-sm rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordEntryModal;
