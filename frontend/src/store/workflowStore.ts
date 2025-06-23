import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import { workflowService, WorkflowData, Workflow } from '../services/workflowService';
import { NodeService } from '../services/nodeService';

export type LogType = 'info' | 'success' | 'error';

export interface Log {
  nodeId: string;
  message: string;
  type: LogType;
  timestamp: number;
}

export interface NodeData {
  [key: string]: any;
}

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  logs: Log[];
  selectedNode: string | null;
  isExecuting: boolean;
  workflowName: string;
  currentWorkflowId: number | null;
  isSaving: boolean;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: string, position: XYPosition) => void;
  updateNodeData: (nodeId: string, data: NodeData) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setWorkflowName: (name: string) => void;
  setCurrentWorkflowId: (id: number | null) => void;
  setIsActive: (isActive: boolean) => void;
  toggleWorkflowActive: () => Promise<void>;
  executeWorkflow: () => void;
  clearLogs: () => void;
  addLog: (nodeId: string, message: string, type: LogType) => void;
  saveWorkflow: () => Promise<Workflow>;
  loadWorkflow: (workflowId: number) => Promise<void>;
  createNewWorkflow: () => void;
  exportWorkflow: () => { nodes: Node[]; edges: Edge[] };
  importWorkflow: (data: { nodes: Node[]; edges: Edge[] }) => void;
  duplicateWorkflow: (newName: string) => Promise<Workflow>;
  deleteWorkflow: () => Promise<void>;
  downloadWorkflow: () => void;
}

const getDefaultNodes = (): Node[] => [
  {
    id: 'start-node',
    type: 'start',
    position: { x: 400, y: 300 },
    data: { 
      label: 'Start',
      nodeType: 'start',
      message: 'Workflow started',
      includeTimestamp: true
    },
  },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: getDefaultNodes(),
  edges: [],
  logs: [],
  selectedNode: null,
  isExecuting: false,
  workflowName: 'Novo Workflow',
  currentWorkflowId: null,
  isSaving: false,
  isActive: false,
  hasUnsavedChanges: false,

  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes);
      
      const hasPositionChanges = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      
      return {
        nodes: newNodes,
        hasUnsavedChanges: hasPositionChanges || state.hasUnsavedChanges
      };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      hasUnsavedChanges: true
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(connection, state.edges),
      hasUnsavedChanges: true
    }));
  },

  addNode: (type: string, position: XYPosition) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: type,
      position,
      data: { 
        nodeType: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      hasUnsavedChanges: true
    }));
  },

  updateNodeData: (nodeId: string, data: NodeData) => {
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      hasUnsavedChanges: true
    }));
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNode: nodeId });
  },

  setWorkflowName: (name: string) => {
    set({ 
      workflowName: name,
      hasUnsavedChanges: true
    });
  },

  setCurrentWorkflowId: (id: number | null) => {
    set({ currentWorkflowId: id });
  },

  setIsActive: (isActive: boolean) => {
    set({ isActive });
  },

  toggleWorkflowActive: async () => {
    const { currentWorkflowId } = get();
    if (!currentWorkflowId) return;

    try {
      const updatedWorkflow = await workflowService.toggleWorkflowActive(currentWorkflowId);
      set({ isActive: updatedWorkflow.is_active });
    } catch (error) {
      console.error('Erro ao alterar status do workflow:', error);
      throw error;
    }
  },

  executeWorkflow: async () => {
    const { nodes, edges, addLog } = get();
    
    if (get().isExecuting) return;
    
    const triggerNodes = nodes.filter(node => {
      try {
        if (!node.type) return false;
        const nodeDefinition = NodeService.getNodeDefinition(node.type);
        return nodeDefinition && nodeDefinition.group.includes('trigger');
      } catch {
        return false;
      }
    });
    
    if (triggerNodes.length === 0) {
      addLog('System', 'No trigger node found in the workflow', 'error');
      return;
    }
    
    set({ logs: [], isExecuting: true });
    
    for (const triggerNode of triggerNodes) {
      await executeNode(triggerNode.id);
    }
    
    set({ isExecuting: false });
    
    async function executeNode(nodeId: string, inputData?: any): Promise<any> {
      const node = nodes.find(n => n.id === nodeId);
      
      if (!node) {
        addLog('System', `Node ${nodeId} not found`, 'error');
        return null;
      }
      
      addLog((node.data as any)?.label || nodeId, `Executing ${(node.data as any)?.label || node.type}`, 'info');
      
      let result = null;
      
      try {
        if (!node.type) {
          throw new Error('Node type is undefined');
        }
        
        const nodeDefinition = NodeService.getNodeDefinition(node.type);
        
        if (nodeDefinition) {
          addLog((node.data as any)?.label || nodeId, `Executing modular node: ${nodeDefinition.displayName}`, 'info');
          
          const items = inputData ? [{ json: inputData }] : [{ json: {} }];
          const parameters = (node.data as any) || {};
          
          if (inputData) {
            addLog((node.data as any)?.label || nodeId, `Input data: ${JSON.stringify(inputData)}`, 'info');
          }
          
          const nodeResult = await NodeService.executeNode(node.type, items, parameters);
          
          if (nodeResult && nodeResult.length > 0) {
            result = nodeResult[0].json;
            addLog((node.data as any)?.label || nodeId, `Node executed successfully: ${JSON.stringify(result)}`, 'success');
          } else {
            result = { message: 'Node executed with no output' };
            addLog((node.data as any)?.label || nodeId, 'Node executed with no output', 'info');
          }
        } else {
          throw new Error(`Unknown node type: ${node.type}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addLog((node.data as any)?.label || nodeId, `Error executing node: ${errorMessage}`, 'error');
        return null;
      }
      
      const connectedEdges = edges.filter(edge => edge.source === nodeId);
      
      for (const edge of connectedEdges) {
        await executeNode(edge.target, result);
      }
      
      return result;
    }
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  addLog: (nodeId: string, message: string, type: LogType) => {
    set((state) => ({
      logs: [...state.logs, {
        nodeId,
        message,
        type,
        timestamp: Date.now()
      }]
    }));
  },

  saveWorkflow: async () => {
    const { nodes, edges, workflowName, currentWorkflowId } = get();
    
    try {
      set({ isSaving: true });
      
      // Limpar dados de test steps dos nodes antes de salvar
      const cleanNodes = nodes.map(node => {
        const cleanedData = { ...node.data };
        
        // Remover dados de teste que não devem ser salvos
        delete cleanedData.inputData;
        delete cleanedData.outputData;
        delete cleanedData.testResult;
        delete cleanedData._testInputData;
        delete cleanedData._testOutputData;
        delete cleanedData._lastTestResult;
        
        return {
          ...node,
          data: cleanedData
        };
      });
      
      const workflowData: WorkflowData = { 
        nodes: cleanNodes as any, 
        edges: edges as any 
      };
      const savedWorkflow = await workflowService.saveCurrentWorkflow(
        currentWorkflowId,
        workflowName,
        workflowData
      );
      
      set({ 
        currentWorkflowId: savedWorkflow.id,
        isSaving: false,
        hasUnsavedChanges: false
      });
      
      console.log('Workflow salvo com sucesso:', savedWorkflow.name);
      return savedWorkflow;
    } catch (error) {
      set({ isSaving: false });
      console.error('Erro ao salvar workflow:', error);
      throw error;
    }
  },

  loadWorkflow: async (workflowId: number) => {
    try {
      const workflow = await workflowService.getWorkflow(workflowId);
      
      set({
        nodes: workflow.workflow_data.nodes || getDefaultNodes(),
        edges: workflow.workflow_data.edges || [],
        workflowName: workflow.name,
        currentWorkflowId: workflow.id,
        isActive: workflow.is_active,
        hasUnsavedChanges: false
      });
    } catch (error) {
      console.error('Erro ao carregar workflow:', error);
      throw error;
    }
  },

  createNewWorkflow: () => {
    set({
      nodes: getDefaultNodes(),
      edges: [],
      workflowName: 'Novo Workflow',
      currentWorkflowId: null,
      isActive: false,
      logs: [],
      hasUnsavedChanges: false
    });
  },

  exportWorkflow: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },

  importWorkflow: (data: { nodes: Node[]; edges: Edge[] }) => {
    set({ 
      nodes: data.nodes, 
      edges: data.edges,
      hasUnsavedChanges: true
    });
  },

  duplicateWorkflow: async (newName: string) => {
    const { currentWorkflowId } = get();
    
    if (!currentWorkflowId) {
      throw new Error('Nenhum workflow carregado para duplicar');
    }

    try {
      const response = await workflowService.duplicateWorkflow(currentWorkflowId, newName);
      return response;
    } catch (error) {
      console.error('Erro ao duplicar workflow:', error);
      throw error;
    }
  },

  deleteWorkflow: async () => {
    const { currentWorkflowId } = get();
    
    if (!currentWorkflowId) {
      throw new Error('Nenhum workflow carregado para deletar');
    }

    try {
      await workflowService.deleteWorkflow(currentWorkflowId);
      // Limpar o estado após deletar
      set({
        currentWorkflowId: null,
        workflowName: 'Novo Workflow',
        nodes: getDefaultNodes(),
        edges: [],
        isActive: false,
        hasUnsavedChanges: false
      });
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
      throw error;
    }
  },

  downloadWorkflow: () => {
    const { nodes, edges, workflowName } = get();
    
    const workflowData = {
      name: workflowName,
      nodes,
      edges,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  },


}));