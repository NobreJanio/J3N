import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginForm from './components/LoginForm';
import LeftSidebar from './components/LeftSidebar';
import SideBar from './components/Sidebar';
import FlowEditor from './components/FlowEditor';
import WorkflowsList from './components/WorkflowsList';
import SettingsPage from './components/SettingsPage';
import ExecutionLogsPage from './components/ExecutionLogsPage';
import NodeConfigModal from './components/NodeConfigModal';
import WorkflowActionsMenu, { DuplicateModal, DeleteModal } from './components/WorkflowActionsMenu';

import ErrorBoundary from './components/ErrorBoundary';
import { Play, Save, Upload, Terminal, Edit3 } from 'lucide-react';
import { useWorkflowStore } from './store/workflowStore';
import { useToast } from './contexts/ToastContext';
import { useEffect } from 'react';

// Componente para página de workflows
function WorkflowsPage() {
  const navigate = useNavigate();

  const handleCreateWorkflow = () => {
    navigate('/workflow/new');
  };

  const handleOpenWorkflow = (workflowId: number) => {
    navigate(`/workflow/${workflowId}`);
  };

  return (
    <WorkflowsList 
      onCreateWorkflow={handleCreateWorkflow}
      onOpenWorkflow={handleOpenWorkflow}
    />
  );
}

// Componente para editor de workflows
function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true); // Iniciar recolhida
  const [isEditingWorkflowName, setIsEditingWorkflowName] = useState(false);
  const [tempWorkflowName, setTempWorkflowName] = useState('');
  
  const { 
    executeWorkflow, 
    isExecuting, 
    workflowName, 
    setWorkflowName, 
    saveWorkflow, 
    loadWorkflow, 
    createNewWorkflow,
    currentWorkflowId,
    isSaving,
    isActive,
    toggleWorkflowActive,
    hasUnsavedChanges,
    duplicateWorkflow,
    deleteWorkflow,
    downloadWorkflow
  } = useWorkflowStore();

  // Carregar workflow quando a página carrega
  useEffect(() => {
    const loadWorkflowData = async () => {
      if (id === 'new') {
        // Criar novo workflow
        createNewWorkflow();
      } else if (id && !isNaN(Number(id))) {
        // Carregar workflow existente
        try {
          console.log('Carregando workflow:', id);
          await loadWorkflow(Number(id));
          console.log('Workflow carregado com sucesso');
        } catch (error) {
          console.error('Erro ao carregar workflow:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          showToast('error', `Erro ao carregar o workflow: ${errorMessage}`);
          // Redirecionar para lista de workflows se houver erro
          navigate('/workflows');
        }
      } else {
        // ID inválido, redirecionar para workflows
        navigate('/workflows');
      }
    };

    loadWorkflowData();
  }, [id, loadWorkflow, createNewWorkflow, navigate, showToast]);



  const handleToggleWorkflowActive = async () => {
    try {
      await toggleWorkflowActive();
    } catch (error) {
      console.error('Erro ao alterar status do workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast('error', `Erro ao alterar status: ${errorMessage}`);
    }
  };

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      setShowNodeConfig(true);
    }
  };

  const handleRunWorkflow = () => {
    if (!isExecuting) {
      executeWorkflow();
    }
  };

  const handleShowLogs = () => {
    // Navegar para a página de execution logs
    navigate(`/workflow/${currentWorkflowId}/executions`);
  };

  const handleSaveWorkflow = async () => {
    try {
      const savedWorkflow = await saveWorkflow();
      showToast('success', 'Workflow salvo com sucesso!');
      
      // Se estamos criando um novo workflow, atualizar a URL com o ID
      if (id === 'new' && savedWorkflow && savedWorkflow.id) {
        navigate(`/workflow/${savedWorkflow.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      showToast('error', 'Erro ao salvar o workflow. Tente novamente.');
    }
  };

  const handlePaneClick = () => {
    setRightSidebarCollapsed(true);
  };

  const handleStartEditingWorkflowName = () => {
    setTempWorkflowName(workflowName);
    setIsEditingWorkflowName(true);
  };

  const handleSaveWorkflowName = () => {
    if (tempWorkflowName.trim()) {
      setWorkflowName(tempWorkflowName.trim());
    }
    setIsEditingWorkflowName(false);
  };

  const handleCancelEditingWorkflowName = () => {
    setTempWorkflowName('');
    setIsEditingWorkflowName(false);
  };

  const handleWorkflowNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveWorkflowName();
    } else if (e.key === 'Escape') {
      handleCancelEditingWorkflowName();
    }
  };

  const handleRename = () => {
    handleStartEditingWorkflowName();
  };

  const handleDuplicate = () => {
    setShowDuplicateModal(true);
  };

  const handleDuplicateConfirm = async (newName: string) => {
    try {
      const duplicatedWorkflow = await duplicateWorkflow(newName);
      showToast('success', `Workflow "${newName}" duplicado com sucesso!`);
      // Navegar para o workflow duplicado
      navigate(`/workflow/${duplicatedWorkflow.id}`);
    } catch (error) {
      console.error('Erro ao duplicar workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast('error', `Erro ao duplicar workflow: ${errorMessage}`);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteWorkflow();
      showToast('success', 'Workflow deletado com sucesso!');
      // Navegar para a lista de workflows
      navigate('/workflows');
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast('error', `Erro ao deletar workflow: ${errorMessage}`);
    }
  };

  const handleDownload = () => {
    try {
      downloadWorkflow();
      showToast('success', 'Workflow baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar workflow:', error);
      showToast('error', 'Erro ao baixar o workflow');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-6">
            {isEditingWorkflowName ? (
              <input
                type="text"
                value={tempWorkflowName}
                onChange={(e) => setTempWorkflowName(e.target.value)}
                onBlur={handleSaveWorkflowName}
                onKeyDown={handleWorkflowNameKeyPress}
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 min-w-[200px] max-w-md"
                autoFocus
                placeholder="Nome do workflow"
                maxLength={100}
              />
            ) : (
              <div 
                className="flex items-center space-x-2 cursor-pointer group max-w-md"
                onClick={handleStartEditingWorkflowName}
                title={workflowName}
              >
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {workflowName}
                </h1>
                <Edit3 size={16} className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
              </div>
            )}

            {/* Status do Workflow - só mostrar se tiver um workflow carregado */}
            {currentWorkflowId && id !== 'new' && (
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Toggle Switch */}
                <div 
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={handleToggleWorkflowActive}
                  title={`${isActive ? 'Desativar' : 'Ativar'} workflow`}
                >
                  <div 
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${
                      isActive ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {/* Grupo de botões principais */}
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Upload size={16} />
                <span>Load</span>
              </button>
              <button 
                onClick={handleSaveWorkflow}
                disabled={isSaving || !hasUnsavedChanges}
                className={`flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasUnsavedChanges 
                    ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Save size={16} />
                <span>{isSaving ? 'Salvando...' : 'Save'}</span>
              </button>
              <button 
                onClick={handleShowLogs}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <Terminal size={16} />
                <span>Execution Logs</span>
              </button>
            </div>
            
            {/* Menu de Ações do Workflow - com mais espaçamento */}
            {currentWorkflowId && id !== 'new' && (
              <div className="ml-12 flex items-center">
                <WorkflowActionsMenu
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onSettings={handleSettings}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden w-full">
        <ErrorBoundary>
          <ReactFlowProvider>
            <div className="flex-1 flex">
              {/* Flow Editor */}
              <div className="flex-1">
                <FlowEditor 
                  onNodeSelect={handleNodeSelect} 
                  onPaneClick={handlePaneClick}
                  onRunWorkflow={handleRunWorkflow}
                />
              </div>
              
              {/* Right Sidebar (Node Types) */}
              <SideBar 
                isCollapsed={rightSidebarCollapsed}
                onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              />
            </div>
          </ReactFlowProvider>
        </ErrorBoundary>
      </div>

      {/* Modals */}
      {showNodeConfig && selectedNodeId && (
        <NodeConfigModal 
          nodeId={selectedNodeId} 
          onClose={() => {
            setShowNodeConfig(false);
            setSelectedNodeId(null);
          }} 
        />
      )}

      {/* Modal de Duplicar Workflow */}
      <DuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={handleDuplicateConfirm}
        currentWorkflowName={workflowName}
      />

      {/* Modal de Deletar Workflow */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        workflowName={workflowName}
      />


    </div>
  );
}

// Componente principal da aplicação (após login)
function MainApp() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true); // Iniciar recolhida

  // Determinar a view atual baseada na rota
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.startsWith('/workflow')) {
      return 'editor';
    } else if (path.startsWith('/settings')) {
      return 'settings';
    } else {
      return 'workflows';
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
      showToast('success', 'Logout realizado com sucesso!');
    }
  };

  const handleViewChange = (view: 'workflows' | 'editor' | 'settings') => {
    switch (view) {
      case 'workflows':
        navigate('/workflows');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'editor':
        navigate('/workflow/new');
        break;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <LeftSidebar 
        currentView={getCurrentView()}
        onViewChange={handleViewChange}
        isCollapsed={leftSidebarCollapsed}
        onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <Routes>
        <Route path="/" element={<Navigate to="/workflows" replace />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflow/:id" element={<WorkflowEditorPage />} />
        <Route path="/workflow/:workflowId/executions" element={<ExecutionLogsPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/workflows" replace />} />
      </Routes>
    </div>
  );
}

// Componente da página de login
function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string>('');

  const handleLogin = async (email: string, password: string) => {
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro no login. Verifique suas credenciais.');
    }
  };

  return <LoginForm onLogin={handleLogin} loading={loading} error={error} />;
}

// Componente principal com roteamento baseado em autenticação
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/workflows" replace />} />
        <Route path="/*" element={isAuthenticated ? <MainApp /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

// App principal com providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;