import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { toast } from 'react-toastify';
import { FaUser, FaArrowLeft, FaPhone, FaIdCard, FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';

const UserProfile = () => {
  const { currentUser, userDetails, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    phone: '',
    cpf: '',
    role: 'user'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from userDetails first, then fetch from Firestore if needed
    if (userDetails) {
      setUserData({
        displayName: userDetails.displayName || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        cpf: userDetails.cpf || '',
        role: userDetails.role || 'user'
      });
    } else if (currentUser?.uid) {
      loadUserData();
    }
  }, [currentUser, userDetails]);

  const loadUserData = async () => {
    try {
      // Get full user data from Firestore
      const userData = await firebaseService.getUserData(currentUser.uid);
      if (userData) {
        setUserData({
          displayName: userData.displayName || currentUser.displayName || '',
          email: userData.email || currentUser.email || '',
          phone: userData.phone || '',
          cpf: userData.cpf || '',
          role: userData.role || 'user'
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Erro ao carregar dados do usuário");
    }
  };

  // Format phone input
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = numbers;
    
    if (numbers.length > 0) {
      formatted = '(' + numbers.substring(0, 2);
      
      if (numbers.length > 2) {
        formatted += ') ' + numbers.substring(2, 7);
        
        if (numbers.length > 7) {
          formatted += '-' + numbers.substring(7, 11);
        }
      }
    }
    
    return formatted;
  };

  // Format CPF input
  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = numbers;
    
    if (numbers.length > 3) {
      formatted = numbers.substring(0, 3) + '.' + numbers.substring(3);
    }
    if (numbers.length > 6) {
      formatted = formatted.substring(0, 7) + '.' + formatted.substring(7);
    }
    if (numbers.length > 9) {
      formatted = formatted.substring(0, 11) + '-' + formatted.substring(11, 13);
    }
    
    return formatted;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    setUserData(prev => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  const handleCPFChange = (e) => {
    setUserData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      // Update display name in Firebase Auth - using the actual Firebase user object
      await updateProfile(currentUser, {
        displayName: userData.displayName
      });
      
      // Update all user data in Firestore
      await firebaseService.updateUserData(currentUser.uid, {
        displayName: userData.displayName,
        phone: userData.phone,
        cpf: userData.cpf
      });
      
      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    try {
      // Change password using Firebase Auth
      await firebaseService.changePassword(
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      
      toast.success('Senha atualizada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Erro ao atualizar senha. Verifique sua senha atual.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="h-full flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl w-full px-4">
        <button 
          onClick={goBack} 
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <FaArrowLeft className="mr-2" /> Voltar
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <FaUser className="text-blue-600 text-4xl" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-center mb-8">Meu Perfil</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="displayName"
                    value={userData.displayName}
                    onChange={handleChange}
                    className="pl-10 appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="pl-10 appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 bg-gray-50"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={userData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(99) 99999-9999"
                    maxLength="15"
                    className="pl-10 appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaIdCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="cpf"
                    value={userData.cpf}
                    onChange={handleCPFChange}
                    placeholder="123.456.789-00"
                    maxLength="14"
                    className="pl-10 appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <FaLock className="mr-2" />
              {showPasswordSection ? 'Cancelar alteração de senha' : 'Alterar senha'}
            </button>
            
            {showPasswordSection && (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha atual
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                    className="appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="appearance-none block w-full rounded-md border border-gray-300 shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                  >
                    {loading ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {userData.role === 'admin' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md">
                <span className="font-semibold">Permissões de administrador</span>
                <p className="text-sm mt-1">Você possui privilégios de administrador no sistema</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;