import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  UserPlus, 
  Save, 
  Eye, 
  EyeOff, 
  Trash2,
  Shield,
  Mail,
  Calendar,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import authService from '../services/authService';

interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

type SettingsTab = 'password' | 'users' | 'create-user';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  
  // Estado da aba ativa baseado na URL
  const getActiveTab = (): SettingsTab => {
    switch (tab) {
      case 'users':
        return 'users';
      case 'create-user':
        return 'create-user';
      default:
        return 'password';
    }
  };
  
  const [activeTab, setActiveTabState] = useState<SettingsTab>(getActiveTab());
  
  // Atualizar aba quando a URL mudar
  useEffect(() => {
    setActiveTabState(getActiveTab());
  }, [tab]);
  
  // Função para mudar de aba
  const setActiveTab = (newTab: SettingsTab) => {
    setActiveTabState(newTab);
    if (newTab === 'password') {
      navigate('/settings');
    } else {
      navigate(`/settings/${newTab}`);
    }
  };
  
  // Estados para mudança de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Estados para criação de usuário
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  
  // Estados para lista de usuários
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Estados de loading
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Configuração das abas
  const tabs: TabConfig[] = [
    {
      id: 'password',
      label: 'Alterar Senha',
      icon: Lock,
      description: 'Atualize sua senha de acesso'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      description: 'Gerencie usuários do workspace'
    },
    {
      id: 'create-user',
      label: 'Criar Usuário',
      icon: UserPlus,
      description: 'Adicione novos usuários'
    }
  ];

  // Carregar usuários quando a aba de usuários for ativada
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        showToast('error', 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      showToast('error', 'Erro ao carregar usuários');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast('error', 'As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast('error', 'A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (response.ok) {
        showToast('success', 'Senha alterada com sucesso');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        showToast('error', error.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showToast('error', 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast('error', 'Todos os campos são obrigatórios');
      return;
    }
    
    if (newUser.password.length < 6) {
      showToast('error', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsCreatingUser(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        showToast('success', 'Usuário criado com sucesso');
        setNewUser({ name: '', email: '', password: '', role: 'user' });
        // Se estiver na aba de usuários, recarregar a lista
        if (activeTab === 'users') {
          loadUsers();
        }
      } else {
        const error = await response.json();
        showToast('error', error.message || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      showToast('error', 'Erro ao criar usuário');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        showToast('success', 'Usuário excluído com sucesso');
        loadUsers(); // Recarregar lista
      } else {
        const error = await response.json();
        showToast('error', error.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      showToast('error', 'Erro ao excluir usuário');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Aba de alterar senha
  const renderPasswordTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full">
      <form onSubmit={handleChangePassword} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Senha Atual
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nova Senha
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isChangingPassword}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} className="mr-2" />
          {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>
    </div>
  );

  // Aba de criar usuário
  const renderCreateUserTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full">
      <form onSubmit={handleCreateUser} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showNewUserPassword ? 'text' : 'password'}
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewUserPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Função
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreatingUser}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus size={16} className="mr-2" />
          {isCreatingUser ? 'Criando...' : 'Criar Usuário'}
        </button>
      </form>
    </div>
  );

  // Aba de lista de usuários
  const renderUsersTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full">
      <div className="p-6">
        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando usuários...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((userAccount) => (
              <div
                key={userAccount.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {userAccount.name}
                      </h3>
                      {userAccount.role === 'admin' && (
                        <Shield size={16} className="text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Mail size={14} className="mr-1" />
                        {userAccount.email}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        Criado em {new Date(userAccount.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {userAccount.id !== user?.id && (
                  <button
                    onClick={() => handleDeleteUser(userAccount.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-6 border-b border-gray-200 dark:border-gray-700 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Configurações</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie sua conta e configurações do workspace
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`mr-2 ${
                      isActive 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 w-full">
        <div className="px-6 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
          
          {/* Tab Content */}
          <div className="w-full">
            {activeTab === 'password' && renderPasswordTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'create-user' && renderCreateUserTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 