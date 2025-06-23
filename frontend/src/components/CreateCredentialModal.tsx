import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { CredentialService } from '../services/credentialService';

interface CreateCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialCreated: () => void;
}

const CreateCredentialModal: React.FC<CreateCredentialModalProps> = ({
  isOpen,
  onClose,
  onCredentialCreated
}) => {
  const [credentialName, setCredentialName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setCredentialName('');
      setApiKey('');
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === 'name') {
      setCredentialName(value);
    } else if (fieldName === 'apiKey') {
      setApiKey(value);
    }
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!credentialName.trim()) {
      newErrors.name = 'Nome da credencial é obrigatório';
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Modal: Iniciando submit do formulário');
    console.log('Modal: credentialName:', credentialName);
    console.log('Modal: apiKey:', apiKey ? `${apiKey.substring(0, 10)}...` : 'vazio');
    
    if (!validateForm()) {
      console.log('Modal: Validação falhou');
      return;
    }

    try {
      setLoading(true);
      console.log('Modal: Chamando CredentialService.createCredential');
      
      const credentialData = {
        name: credentialName.trim(),
        type: 'apiKey',
        credential_data: { apiKey: apiKey.trim() }
      };
      
      console.log('Modal: Dados da credencial:', credentialData);
      
      const result = await CredentialService.createCredential(credentialData);
      console.log('Modal: Credencial criada com sucesso:', result);

      onCredentialCreated();
      onClose();
    } catch (error) {
      console.error('Modal: Erro ao criar credencial:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Modal: Mensagem de erro:', errorMessage);
      setErrors({ general: `Erro ao criar credencial: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Key size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Nova Credencial
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                API Key
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Credential Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome da Credencial
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={credentialName}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Ex: Minha API Key"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Credential Type - Fixed as API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Credencial
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              API Key
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Todas as credenciais são do tipo API Key e podem ser usadas para qualquer serviço
            </p>
          </div>

          {/* API Key Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                placeholder="Sua chave de API"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 ${
                  errors.apiKey ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sua chave de API para autenticação no serviço
            </p>
            
            {errors.apiKey && (
              <p className="text-xs text-red-500">{errors.apiKey}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCredentialModal; 