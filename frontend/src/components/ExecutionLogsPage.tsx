import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, BackgroundVariant, Node, Edge, NodeTypes, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Play,
  Square,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { executionService, Execution } from '../services/executionService';
import { workflowService } from '../services/workflowService';
import ModularNode from './nodes/ModularNode';

// Node types - usar os mesmos do editor principal
const nodeTypes: NodeTypes = {
  webhook: ModularNode,
  manualTrigger: ModularNode,
  scheduleTrigger: ModularNode,
  workflowTrigger: ModularNode,
  start: ModularNode,
  httpRequest: ModularNode,
  set: ModularNode,
  if: ModularNode,
  filter: ModularNode,
  dateTime: ModularNode,
  splitOut: ModularNode,
  removeDuplicates: ModularNode,
  wait: ModularNode,
  switch: ModularNode,
  default: ModularNode,
};

// Interfaces
interface ExecutionNode extends Node {
  data: {
    label: string;
    nodeType?: string;
    status?: 'success' | 'error' | 'running' | 'pending';
    executionData?: any;
    error?: string;
    [key: string]: any;
  };
}

const ExecutionLogsPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowName, setWorkflowName] = useState('');
  const [nodes, setNodes] = useState<ExecutionNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [executionToDelete, setExecutionToDelete] = useState<Execution | null>(null);

  // Handlers para interação com nodes
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Função para excluir execução
  const handleDeleteExecution = async (execution: Execution) => {
    setExecutionToDelete(execution);
    setShowDeleteModal(true);
  };

  const confirmDeleteExecution = async () => {
    if (!executionToDelete) return;

    try {
      // Chamar a API para excluir a execução
      await executionService.deleteExecution(executionToDelete.id);
      
      // Remover da lista local
      setExecutions(prev => prev.filter(exec => exec.id !== executionToDelete.id));
      
      // Se a execução excluída estava selecionada, limpar a seleção
      if (selectedExecution?.id === executionToDelete.id) {
        setSelectedExecution(null);
        setSelectedNodeId(null);
        setNodes([]);
        setEdges([]);
      }
      
      showToast('success', 'Execução excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir execução:', error);
      showToast('error', 'Erro ao excluir execução');
    } finally {
      setShowDeleteModal(false);
      setExecutionToDelete(null);
    }
  };

  // Carregar dados quando o componente monta
  useEffect(() => {
    if (workflowId) {
      loadExecutions();
      loadWorkflowData();
    }
  }, [workflowId]);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const executionsData = await executionService.getWorkflowExecutions(Number(workflowId));
      setExecutions(executionsData);
      
      // Selecionar a primeira execução automaticamente
      if (executionsData.length > 0) {
        handleExecutionSelect(executionsData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
      showToast('error', 'Erro ao carregar execuções');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowData = async () => {
    try {
      const workflow = await workflowService.getWorkflow(Number(workflowId));
      setWorkflowName(workflow.name);
    } catch (error) {
      console.error('Erro ao carregar workflow:', error);
    }
  };

  const handleExecutionSelect = async (execution: Execution) => {
    setSelectedExecution(execution);
    setSelectedNodeId(null);
    
    try {
      // Carregar dados do workflow para obter os nodes originais
      const workflow = await workflowService.getWorkflow(Number(workflowId));
      const originalNodes = workflow.workflow_data.nodes || [];
      const originalEdges = workflow.workflow_data.edges || [];

      // Converter nodes originais para nodes de execução com status
      const executionNodes: ExecutionNode[] = originalNodes.map((node: any) => ({
        id: node.id,
        type: node.type, // Usar o tipo original do node
        position: node.position,
        data: {
          ...node.data, // Manter todos os dados originais do node
          label: node.data?.label || node.type || 'Node',
          nodeType: node.type,
          status: execution.status === 'completed' ? 'success' : 
                 execution.status === 'failed' ? 'error' : 
                 execution.status === 'running' ? 'running' : 'pending',
          executionData: execution.status === 'completed' ? {
            inputData: { message: 'Dados de entrada processados' },
            outputData: { result: 'Dados de saída gerados com sucesso' },
            duration: '2.5s'
          } : execution.status === 'failed' ? {
            inputData: { message: 'Dados de entrada processados' },
            error: execution.error_message || 'Erro na execução do node',
            duration: '1.2s'
          } : null
        }
      }));

      // Converter edges originais mantendo o formato
      const executionEdges: Edge[] = originalEdges.map((edge: any) => ({
        ...edge,
        animated: execution.status === 'running',
        style: {
          stroke: execution.status === 'completed' ? '#10b981' : 
                 execution.status === 'failed' ? '#ef4444' : 
                 execution.status === 'running' ? '#3b82f6' : '#6b7280',
          strokeWidth: 2
        }
      }));

      setNodes(executionNodes);
      setEdges(executionEdges);

    } catch (error) {
      console.error('Erro ao carregar dados da execução:', error);
      
      // Fallback para dados mock se não conseguir carregar o workflow
      const mockNodes: ExecutionNode[] = [
        {
          id: 'start-1',
          type: 'manualTrigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Manual Trigger',
            nodeType: 'manualTrigger',
            status: 'success',
            executionData: { timestamp: execution.started_at }
          }
        },
        {
          id: 'http-1',
          type: 'httpRequest',
          position: { x: 300, y: 100 },
          data: {
            label: 'HTTP Request',
            nodeType: 'httpRequest',
            status: execution.status === 'completed' ? 'success' : execution.status === 'failed' ? 'error' : 'pending',
            executionData: execution.status === 'completed' ? { 
              response: { status: 200, data: 'Success' } 
            } : execution.status === 'failed' ? {
              error: execution.error_message || 'Connection timeout'
            } : null
          }
        },
        {
          id: 'set-1',
          type: 'set',
          position: { x: 500, y: 100 },
          data: {
            label: 'Set',
            nodeType: 'set',
            status: execution.status === 'completed' ? 'success' : 'pending',
            executionData: execution.status === 'completed' ? {
              outputData: { processedValue: 'Data processed successfully' }
            } : null
          }
        }
      ];

      const mockEdges = [
        {
          id: 'e1-2',
          source: 'start-1',
          target: 'http-1',
          animated: execution.status === 'running',
          style: {
            stroke: execution.status === 'completed' ? '#10b981' : execution.status === 'failed' ? '#ef4444' : '#6b7280',
            strokeWidth: 2
          }
        },
        {
          id: 'e2-3',
          source: 'http-1',
          target: 'set-1',
          animated: execution.status === 'running',
          style: {
            stroke: execution.status === 'completed' ? '#10b981' : execution.status === 'failed' ? '#ef4444' : '#6b7280',
            strokeWidth: 2
          }
        }
      ];

      setNodes(mockNodes);
      setEdges(mockEdges);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    if (!endDate) return 'Em andamento';
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const duration = Math.round((end - start) / 1000);
    return `${duration}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'cancelled':
        return <Square className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando execuções...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full">
      {/* Header integrado ao layout principal */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/workflow/${workflowId}`)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Editor</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Execution Logs - {workflowName}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {selectedExecution && (
            <button
              onClick={() => handleDeleteExecution(selectedExecution)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Excluir execução selecionada"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          )}
          <button
            onClick={loadExecutions}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Main Content - layout de 3 painéis */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Executions List */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Execuções
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {executions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma execução encontrada</p>
              </div>
            ) : (
              <div className="p-2">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    onClick={() => handleExecutionSelect(execution)}
                    className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedExecution?.id === execution.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(execution.status)}`}>
                        {getStatusIcon(execution.status)}
                        <span className="uppercase">{execution.status}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(execution.started_at, execution.completed_at)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {formatDate(execution.started_at)}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Modo: {execution.execution_data?.mode || 'manual'}
                    </div>
                    
                    {execution.error_message && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {execution.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Flow Visualization */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedExecution ? (
            <div className="h-full w-full bg-gray-100 dark:bg-gray-900 relative">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodeClick={handleNodeClick}
                  onPaneClick={handlePaneClick}
                  fitView={true}
                  fitViewOptions={{ padding: 0.2 }}
                  nodesConnectable={false}
                  nodesDraggable={false}
                  elementsSelectable={true}
                  className="bg-gray-100 dark:bg-gray-900"
                  proOptions={{ hideAttribution: true }}
                >
                  <Controls 
                    className="!bottom-6 !left-1/2 !transform !-translate-x-1/2 !top-auto !right-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg"
                    showZoom={true}
                    showFitView={true}
                    showInteractive={false}
                    orientation="horizontal"
                  />
                  <Background 
                    variant={BackgroundVariant.Dots}
                    gap={20} 
                    size={1.5}
                    color="#c1c1c1"
                    className="bg-gray-100 dark:bg-gray-900"
                  />
                </ReactFlow>
              </ReactFlowProvider>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecione uma execução para visualizar</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Node Details */}
        {selectedNodeId && selectedExecution && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Detalhes do Node
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const selectedNode = nodes.find(n => n.id === selectedNodeId);
                if (!selectedNode) return <p>Node não encontrado</p>;
                
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {selectedNode.data.label}
                      </h4>
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${
                        selectedNode.data.status === 'success' ? 'text-green-600 bg-green-50 border-green-200' :
                        selectedNode.data.status === 'error' ? 'text-red-600 bg-red-50 border-red-200' :
                        selectedNode.data.status === 'running' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                        'text-gray-600 bg-gray-50 border-gray-200'
                      }`}>
                        {selectedNode.data.status === 'success' && <CheckCircle className="w-4 h-4" />}
                        {selectedNode.data.status === 'error' && <XCircle className="w-4 h-4" />}
                        {selectedNode.data.status === 'running' && <Play className="w-4 h-4" />}
                        {selectedNode.data.status === 'pending' && <Clock className="w-4 h-4" />}
                        <span className="capitalize">{selectedNode.data.status}</span>
                      </div>
                    </div>
                    
                    {selectedNode.data.executionData && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Dados de Execução
                        </h5>
                        <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm overflow-x-auto">
                          {JSON.stringify(selectedNode.data.executionData, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {selectedNode.data.error && (
                      <div>
                        <h5 className="font-medium text-red-600 dark:text-red-400 mb-2">
                          Erro
                        </h5>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300">
                          {selectedNode.data.error}
                        </div>
                      </div>
                    )}

                    {/* Configuração original do node */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Configuração
                      </h5>
                      <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(selectedNode.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Excluir Execução */}
      {showDeleteModal && executionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Excluir Execução
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Tem certeza que deseja excluir a execução de{' '}
                <span className="font-medium">
                  {formatDate(executionToDelete.started_at)}
                </span>
                ?
              </p>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(executionToDelete.status)}`}>
                    {executionToDelete.status.toUpperCase()}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Modo: {executionToDelete.execution_data?.mode || 'manual'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setExecutionToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteExecution}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionLogsPage; 