import React, { useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  NodeTypes,
  useReactFlow,
  BackgroundVariant,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play } from 'lucide-react';

import { useWorkflowStore } from '../store/workflowStore';
import ModularNode from './nodes/ModularNode';

interface FlowEditorProps {
  onNodeSelect: (nodeId: string | null) => void;
  onPaneClick?: () => void;
  onRunWorkflow?: () => void;
}

const nodeTypes: NodeTypes = {
  webhook: ModularNode,
  manualTrigger: ModularNode,
  scheduleTrigger: ModularNode,
  workflowTrigger: ModularNode,
  start: ModularNode,
  httpRequest: ModularNode,
  set: ModularNode,
  if: ModularNode,
  // Novos nodes
  filter: ModularNode,
  dateTime: ModularNode,
  splitOut: ModularNode,
  removeDuplicates: ModularNode,
  wait: ModularNode,
  switch: ModularNode,
  default: ModularNode,
};

const FlowEditor = ({ onNodeSelect, onPaneClick: onPaneClickProp, onRunWorkflow }: FlowEditorProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,
    setSelectedNode,
    executeWorkflow,
    isExecuting
  } = useWorkflowStore();

  let screenToFlowPosition;
  try {
    const reactFlowInstance = useReactFlow();
    screenToFlowPosition = reactFlowInstance.screenToFlowPosition;
  } catch (error) {
    console.error('Error getting ReactFlow instance:', error);
    return (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Erro ao inicializar ReactFlow</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">ReactFlow deve estar dentro de um ReactFlowProvider</p>
        </div>
      </div>
    );
  }

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !screenToFlowPosition) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type) return;
      
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    onNodeSelect(node.id);
    setSelectedNode(node.id);
  }, [onNodeSelect, setSelectedNode]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
    setSelectedNode(null);
    if (onPaneClickProp) {
      onPaneClickProp();
    }
  }, [onNodeSelect, setSelectedNode, onPaneClickProp]);

  const defaultEdgeOptions = useMemo(() => ({
    style: {
      stroke: '#9ca3af',
      strokeWidth: 2,
      strokeDasharray: '5,5',
    },
    animated: false,
  }), []);

  // Verificar se temos dados para renderizar
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} className="h-full w-full bg-gray-100 dark:bg-gray-900 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView={true}
        fitViewOptions={{ padding: 0.2 }}
        nodesConnectable={true}
        nodesDraggable={true}
        elementsSelectable={true}
        deleteKeyCode={['Delete', 'Backspace']}
        connectionLineType={ConnectionLineType.Bezier}
        snapToGrid={false}
        snapGrid={[15, 15]}
        onlyRenderVisibleElements={true}
        className="bg-gray-100 dark:bg-gray-900"
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          className="!bottom-6 !left-1/2 !transform !-translate-x-1/2 !top-auto !right-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg px-4 py-2"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          orientation="horizontal"
        >
          {onRunWorkflow && (
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200 dark:border-gray-600">
              <button
                className={`test-flow-button ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={onRunWorkflow}
                disabled={isExecuting}
                title={isExecuting ? 'Executando...' : 'Test Flow'}
              >
                <Play className="w-4 h-4 mr-2" fill="currentColor" />
                {isExecuting ? 'Testing...' : 'Test Flow'}
              </button>
            </div>
          )}
        </Controls>
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20} 
          size={1.5}
          color="#c1c1c1"
          className="bg-gray-100 dark:bg-gray-900"
        />
      </ReactFlow>
    </div>
  );
};

export default FlowEditor;