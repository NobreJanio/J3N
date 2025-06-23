import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3,
  Key,
  Calendar,
  User,
  RefreshCw,
  ChevronDown,
  TestTube
} from 'lucide-react';
import { CredentialService } from '../services/credentialService';

interface Credential {
  id: number;
  name: string;
  type: string;
  user_id: number;
  credential_data?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CredentialsListProps {
  onCreateCredential: () => void;
}

const CredentialsList: React.FC<CredentialsListProps> = ({ onCreateCredential }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [testingCredentialId, setTestingCredentialId] = useState<number | null>(null);

  // Carregar credenciais do backend
  useEffect(() => {
    console.log('CredentialsList: useEffect executado');
    // Verificar se há token antes de carregar
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    console.log('CredentialsList: Token no localStorage:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
      console.error('CredentialsList: Token não encontrado, não carregando credenciais');
      console.error('CredentialsList: Chaves verificadas: auth_token, token');
      alert('Token de autenticação não encontrado. Faça login novamente.');
      setLoading(false);
      return;
    }
    
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      console.log('CredentialsList: Iniciando carregamento de credenciais...');
      const credentialsData = await CredentialService.getCredentials();
      console.log('CredentialsList: Credenciais carregadas com sucesso:', credentialsData);
      setCredentials(credentialsData);
    } catch (error) {
      console.error('CredentialsList: Erro ao carregar credenciais:', error);
      console.error('CredentialsList: Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Erro ao carregar credenciais. Tente novamente.');
    } finally {
      setLoading(false);
      console.log('CredentialsList: Loading finalizado');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
    return `${Math.floor(diffInDays / 365)} anos atrás`;
  };

  const getCredentialTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'httpBasicAuth': 'HTTP Basic Auth',
      'httpHeaderAuth': 'HTTP Header Auth',
      'oauth2': 'OAuth2',
      'apiKey': 'API Key'
    };
    return typeMap[type] || type;
  };

  const getCredentialIcon = (type: string) => {
    // Retorna um ícone baseado no tipo de credencial
    return Key;
  };

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credential.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || credential.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleTestCredential = async (credentialId: number) => {
    try {
      setTestingCredentialId(credentialId);
      const result = await CredentialService.testCredential(credentialId);
      
      if (result.success) {
        alert('Credencial testada com sucesso!');
      } else {
        alert(`Erro ao testar credencial: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao testar credencial:', error);
      alert('Erro ao testar credencial. Tente novamente.');
    } finally {
      setTestingCredentialId(null);
      setOpenMenuId(null);
    }
  };

  const handleDeleteCredential = async (credentialId: number) => {
    if (confirm('Tem certeza que deseja excluir esta credencial?')) {
      try {
        await CredentialService.deleteCredential(credentialId);
        await loadCredentials(); // Recarregar lista
        setOpenMenuId(null);
      } catch (error) {
        console.error('Erro ao deletar credencial:', error);
        alert('Erro ao deletar credencial. Tente novamente.');
      }
    }
  };

  // Obter tipos únicos para o filtro
  const uniqueTypes = Array.from(new Set(credentials.map(c => c.type)));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando credenciais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-6 border-b border-gray-200 dark:border-gray-700 w-full">
        {/* Search and Filters */}
        <div className="flex items-center justify-between w-full">
          <div className="w-80">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {getCredentialTypeDisplayName(type)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 w-full">
        {filteredCredentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Key size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma credencial encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {searchTerm ? 'Tente ajustar sua busca' : 'Crie sua primeira credencial para começar'}
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateCredential}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
              >
                <Key size={16} />
                <span>Criar Credencial</span>
              </button>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 space-y-2">
            {filteredCredentials.map((credential) => {
              const CredentialIcon = getCredentialIcon(credential.type);
              
              return (
                <div
                  key={credential.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm dark:hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                >
                  <div className="flex items-center justify-between px-6 py-4 w-full">
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <CredentialIcon size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                          {credential.name}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                          <span>{getCredentialTypeDisplayName(credential.type)}</span>
                          <span>|</span>
                          <span>Last updated {formatDate(credential.updated_at)}</span>
                          <span>|</span>
                          <span>Created {formatDate(credential.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 ml-6">
                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Personal</span>
                      </div>

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === credential.id ? null : credential.id);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
                        </button>

                        {openMenuId === credential.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 w-48">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestCredential(credential.id);
                                }}
                                disabled={testingCredentialId === credential.id}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50"
                              >
                                {testingCredentialId === credential.id ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <TestTube size={14} />
                                )}
                                <span>Testar Conexão</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implementar edição de credencial
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm"
                              >
                                <Edit3 size={14} />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCredential(credential.id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm"
                              >
                                <Trash2 size={14} />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialsList; 