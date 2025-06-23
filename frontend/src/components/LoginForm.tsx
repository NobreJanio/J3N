import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && email && password) {
      await onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 z-10"
        title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      >
        {theme === 'dark' ? (
          <Sun size={20} className="text-yellow-500" />
        ) : (
          <Moon size={20} className="text-gray-700" />
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
          {/* Header Section */}
          <div className="px-8 pt-12 pb-8 text-center bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src={theme === 'dark' ? '/logos/I2N logo yellow sf.png' : '/logos/I2N logo preto.png'} 
                alt="I2N Logo" 
                className="h-16 w-auto object-contain mx-auto transition-all duration-300"
                onError={(e) => {
                  // Fallback para o logo padrão se não encontrar o novo logo
                  e.currentTarget.src = '/logos/logo I2N yellow.png';
                }}
              />
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bem vindo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Digite suas credenciais para acessar sua conta
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 pr-12"
                required
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 p-1"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              I2N - Plataforma de Automação
            </p>
          </div>
        </div>

        {/* Demo Credentials Card */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 transition-all duration-300">
          <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Credenciais de Demonstração:
          </h3>
          <div className="text-blue-700 dark:text-blue-400 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Email:</span>
              <span className="font-mono text-xs bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded">admin@flowbuilder.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Senha:</span>
              <span className="font-mono text-xs bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded">admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 