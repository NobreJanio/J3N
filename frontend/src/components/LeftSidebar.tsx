import React, { useState } from 'react';
import { 
  Home, 
  FileText, 
  Variable, 
  HelpCircle, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface LeftSidebarProps {
  currentView: 'workflows' | 'editor' | 'settings';
  onViewChange: (view: 'workflows' | 'editor' | 'settings') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  currentView, 
  onViewChange,
  isCollapsed = false,
  onToggleCollapse 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      active: currentView === 'workflows',
      onClick: () => onViewChange('workflows'),
      description: 'All workflows, credentials and executions'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileText,
      active: false,
      onClick: () => {},
      description: 'Workflow templates to get started'
    },
    {
      id: 'variables',
      label: 'Variables',
      icon: Variable,
      active: false,
      onClick: () => {},
      description: 'Environment variables'
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      active: false,
      onClick: () => {},
      description: 'Documentation and support'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      active: currentView === 'settings',
      onClick: () => onViewChange('settings'),
      description: 'Configure your workspace'
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 px-4">
        <img 
          src={theme === 'dark' ? '/logos/I2N logo yellow sf.png' : '/logos/I2N logo preto.png'} 
          alt="I2N Logo" 
          className={`${isCollapsed ? 'h-6' : 'h-8'} w-auto object-contain transition-all duration-300`}
          onError={(e) => {
            // Fallback para o logo padrão se não encontrar o novo logo
            e.currentTarget.src = '/logos/logo I2N yellow.png';
          }}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <nav className="space-y-3 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-left rounded-lg transition-colors group relative ${
                item.active
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} className={isCollapsed ? '' : 'mr-3'} />
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </div>
                </div>
              )}
              
              {/* Tooltip para versão colapsada */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 py-4 px-3 space-y-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group relative`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {!isCollapsed && (
            <div className="ml-3">
              <div className="font-medium text-sm">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Alternar tema</div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </div>
          )}
        </button>

        {/* User Info & Logout */}
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group relative`}
        >
          {isCollapsed ? (
            <LogOut size={18} />
          ) : (
            <>
              <User size={18} className="mr-3" />
              <div className="flex-1">
                <div className="font-medium text-sm">Administrador</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
              <LogOut size={16} className="ml-2" />
            </>
          )}
          
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Administrador - Sair
            </div>
          )}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
      >
        {isCollapsed ? (
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </div>
  );
};

export default LeftSidebar; 