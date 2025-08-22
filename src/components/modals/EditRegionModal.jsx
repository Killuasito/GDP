import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../services/firebaseService';
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaKey } from 'react-icons/fa';
import { toast } from 'react-toastify';

const EditRegionModal = ({ isOpen, onClose, onUpdate, region }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [fetchingPassword, setFetchingPassword] = useState(false);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (isOpen && region) {
      setName(region.name || '');
      setDescription(region.description || '');
      setIsPasswordProtected(region.isPasswordProtected || false);
      setPassword('');
      setCurrentPassword('');
      checkEditPermission();
      
      // If region is password protected, fetch the existing password for admin/creator
      if (region.isPasswordProtected) {
        fetchExistingPassword();
      }
    }
  }, [isOpen, region]);
  
  const checkEditPermission = async () => {
    if (!region) return;
    
    try {
      const hasPermission = await firebaseService.hasEditPermission('regions', region.id);
      setHasEditPermission(hasPermission);
    } catch (error) {
      console.error("Error checking permissions:", error);
      setHasEditPermission(false);
    }
  };
  
  const fetchExistingPassword = async () => {
    if (!region?.id) return;
    
    try {
      setFetchingPassword(true);
      const decryptedPassword = await firebaseService.getDecryptedPassword('regions', region.id);
      if (decryptedPassword) {
        setCurrentPassword(decryptedPassword);
      }
    } catch (error) {
      console.error("Error fetching password:", error);
      // Don't show toast here - it's ok if we can't fetch the password
    } finally {
      setFetchingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!name.trim()) {
      toast.error("O nome é obrigatório");
      setLoading(false);
      return;
    }
    
    try {
      // First update password if needed
      if (isPasswordProtected !== region.isPasswordProtected || 
          (isPasswordProtected && password.trim() !== '')) {
        
        // If enabling password protection and no new password entered,
        // check if we have the current password to reuse
        let passwordToUse = password;
        if (isPasswordProtected && !password.trim() && currentPassword) {
          passwordToUse = currentPassword;
        }
        
        await firebaseService.updateItemPassword(
          'regions', 
          region.id, 
          isPasswordProtected, 
          passwordToUse || undefined
        );
      }
      
      // Then update other fields
      await onUpdate(region.id, {
        name,
        description
      });
      
      // Toast success is handled by parent component
    } catch (error) {
      console.error("Error updating region:", error);
      toast.error(error.message || "Erro ao atualizar região");
    } finally {
      setLoading(false);
    }
  };
  
  // Password protection styles
  const getPasswordSectionClasses = () => {
    return isPasswordProtected 
      ? "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg transition-all duration-200" 
      : "mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 opacity-75";
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-lg w-full p-6 mx-auto">
          <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200">
            Editar Região
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Região
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Password protection section (only visible to creators/admins) */}
              {hasEditPermission && (
                <div className={getPasswordSectionClasses()}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FaShieldAlt className={`mr-2 ${isPasswordProtected ? 'text-yellow-500' : 'text-gray-400'}`} size={18} />
                      <h4 className="font-medium">Proteção por Senha</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPasswordProtected}
                        onChange={(e) => setIsPasswordProtected(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className={isPasswordProtected ? "transition-opacity duration-200" : "opacity-50 pointer-events-none transition-opacity duration-200"}>
                    {fetchingPassword ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Carregando senha...</span>
                      </div>
                    ) : currentPassword ? (
                      <div className="mb-3">
                        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-md flex items-start">
                          <FaKey className="mt-0.5 mr-2 flex-shrink-0" size={14} />
                          <div>
                            <p className="text-sm font-medium">Senha atual configurada</p>
                            <p className="text-xs">Deixe o campo abaixo em branco para manter a senha atual</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      {currentPassword ? "Nova senha (opcional)" : "Senha de acesso"}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={currentPassword ? "Digite uma nova senha (opcional)" : "Digite a senha"}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Esta senha será necessária para acessar {region ? `a região "${region.name}"` : 'a região'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRegionModal;
