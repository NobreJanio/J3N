import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Play, 
  Pause,
  Calendar,
  User,
  Power,
  PowerOff,
  Filter,
  RefreshCw,
  ChevronDown,
  Key
} from 'lucide-react';
import { workflowService, Workflow } from '../services/workflowService';
import CredentialsList from './CredentialsList';
import CreateCredentialModal from './CreateCredentialModal';
import { useToast } from '../contexts/ToastContext';

interface WorkflowsListProps {
  onCreateWorkflow: () => void;
  onOpenWorkflow: (workflowId: number) => void;
}

const WorkflowsList: React.FC<WorkflowsListProps> = ({ onCreateWorkflow, onOpenWorkflow }) => {
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showCreateCredentialModal, setShowCreateCredentialModal] = useState(false);

  // Carregar workflows do backend
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const workflowsData = await workflowService.getWorkflows();
      setWorkflows(workflowsData);
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
      showToast('error', 'Erro ao carregar workflows. Tente novamente.');
    } finally {
      setLoading(false);
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

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && workflow.is_active) ||
                         (filterActive === 'inactive' && !workflow.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const handleToggleActive = async (workflowId: number) => {
    try {
      await workflowService.toggleWorkflowActive(workflowId);
      await loadWorkflows(); // Recarregar lista
      setOpenMenuId(null);
    } catch (error) {
      console.error('Erro ao alterar status do workflow:', error);
      showToast('error', 'Erro ao alterar status do workflow. Tente novamente.');
    }
  };

  const handleDuplicate = async (workflowId: number) => {
    try {
      const original = workflows.find(w => w.id === workflowId);
      if (original) {
        const newName = `${original.name} (Cópia)`;
        await workflowService.duplicateWorkflow(workflowId, newName);
        await loadWorkflows(); // Recarregar lista
        showToast('success', 'Workflow duplicado com sucesso!');
      }
      setOpenMenuId(null);
    } catch (error) {
      console.error('Erro ao duplicar workflow:', error);
      showToast('error', 'Erro ao duplicar workflow. Tente novamente.');
    }
  };

  const handleDelete = async (workflowId: number) => {
    if (confirm('Tem certeza que deseja excluir este workflow?')) {
      try {
        await workflowService.deleteWorkflow(workflowId);
        await loadWorkflows(); // Recarregar lista
        setOpenMenuId(null);
        showToast('success', 'Workflow excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar workflow:', error);
        showToast('error', 'Erro ao deletar workflow. Tente novamente.');
      }
    }
  };

  const handleCreateCredential = () => {
    setShowCreateCredentialModal(true);
    setShowCreateDropdown(false);
  };

  const handleCredentialCreated = () => {
    // Recarregar credenciais se estivermos na aba de credenciais
    if (activeTab === 'credentials') {
      // A lista de credenciais será recarregada automaticamente pelo componente CredentialsList
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando workflows...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-6 border-b border-gray-200 dark:border-gray-700 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              All the workflows, credentials and executions you have access to
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Workflow</span>
              <ChevronDown size={16} className={`transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showCreateDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowCreateDropdown(false)}
                />
                <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 w-48">
                  <button
                    onClick={() => {
                      onCreateWorkflow();
                      setShowCreateDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <Plus size={14} />
                    <span>Create Workflow</span>
                  </button>
                  <button
                    onClick={handleCreateCredential}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <Key size={14} />
                    <span>Create Credential</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8 mb-6">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'workflows'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Workflows
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'credentials'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Credentials
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'executions'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Executions
          </button>
        </div>

        {/* Search and Filters - Only show for workflows and executions tabs */}
        {activeTab !== 'credentials' && (
          <div className="flex items-center justify-between w-full">
            <div className="w-80">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Filter size={16} />
                <span>Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 w-full">
        {activeTab === 'credentials' ? (
          <CredentialsList onCreateCredential={handleCreateCredential} />
        ) : activeTab === 'executions' ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <RefreshCw size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Execuções em breve
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Esta funcionalidade será implementada em breve
            </p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <RefreshCw size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum workflow encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {searchTerm ? 'Tente ajustar sua busca' : 'Crie seu primeiro workflow para começar'}
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateWorkflow}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Criar Workflow</span>
              </button>
            )}
          </div>
                ) : (
          <div className="px-6 py-4 space-y-2">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => onOpenWorkflow(workflow.id)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm dark:hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between px-6 py-4 w-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                      {workflow.name}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <span>Last updated {formatDate(workflow.updated_at)}</span>
                      <span>|</span>
                      <span>Created {formatDate(workflow.created_at)}</span>
                      {workflow.description && (
                        <>
                          <span>|</span>
                          <span>{workflow.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 ml-6">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      <User size={14} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Personal</span>
                    </div>

                    {/* Active/Inactive Status */}
                    <div className="flex items-center space-x-2 min-w-[80px]">
                      <span className={`text-sm font-medium ${workflow.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <div 
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                        workflow.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(workflow.id);
                      }}
                    >
                      <div 
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${
                          workflow.is_active ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </div>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === workflow.id ? null : workflow.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
                      </button>

                      {openMenuId === workflow.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 w-48">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenWorkflow(workflow.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              <Play size={14} />
                              <span>Abrir</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(workflow.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              <Copy size={14} />
                              <span>Duplicar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(workflow.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              {workflow.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                              <span>{workflow.is_active ? 'Desativar' : 'Ativar'}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(workflow.id);
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
            ))}
          </div>
        )}
      </div>

      {/* Create Credential Modal */}
      <CreateCredentialModal
        isOpen={showCreateCredentialModal}
        onClose={() => setShowCreateCredentialModal(false)}
        onCredentialCreated={handleCredentialCreated}
      />
    </div>
  );
};

export default WorkflowsList; 