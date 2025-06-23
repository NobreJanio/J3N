import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Globe as HttpIcon,
  Settings as SetIcon,
  GitBranch as IfIcon,
  Webhook as WebhookIcon,
  Play as PlayIcon,
  Clock as ClockIcon,
  Workflow as WorkflowIcon,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
  Split as SplitIcon,
  Copy as CopyIcon,
  Timer as TimerIcon,
  Route as RouteIcon,
  LucideIcon
} from 'lucide-react';
import { NodeService } from '../../services/nodeService';


// Mapeamento de ícones para os nodes modulares
const MODULAR_NODE_ICONS: { [key: string]: LucideIcon } = {
  webhook: WebhookIcon,
  manualTrigger: PlayIcon,
  scheduleTrigger: ClockIcon,
  workflowTrigger: WorkflowIcon,
  start: PlayIcon,
  httpRequest: HttpIcon,
  set: SetIcon,
  if: IfIcon,
  filter: FilterIcon,
  dateTime: CalendarIcon,
  splitOut: SplitIcon,
  removeDuplicates: CopyIcon,
  wait: TimerIcon,
  switch: RouteIcon,
};

// Mapeamento de cores específicas para cada tipo de node
const NODE_COLORS: { [key: string]: string } = {
  // Triggers com cores diferentes
  webhook: 'linear-gradient(to right, #16a34a, #15803d)', // Verde
  manualTrigger: 'linear-gradient(to right, #2563eb, #1d4ed8)', // Azul
  scheduleTrigger: 'linear-gradient(to right, #f59e0b, #d97706)', // Amarelo/Laranja
  workflowTrigger: 'linear-gradient(to right, #8b5cf6, #7c3aed)', // Roxo
  start: 'linear-gradient(to right, #059669, #047857)', // Verde escuro
  
  // Outros grupos mantêm cores por categoria
  httpRequest: 'linear-gradient(to right, #3b82f6, #2563eb)', // Azul
  set: 'linear-gradient(to right, #f97316, #ea580c)', // Laranja
  if: 'linear-gradient(to right, #6366f1, #4f46e5)', // Índigo
  
  // Novos nodes - Transform
  filter: 'linear-gradient(to right, #f97316, #ea580c)', // Laranja (transform)
  dateTime: 'linear-gradient(to right, #f97316, #ea580c)', // Laranja (transform)
  splitOut: 'linear-gradient(to right, #f97316, #ea580c)', // Laranja (transform)
  removeDuplicates: 'linear-gradient(to right, #f97316, #ea580c)', // Laranja (transform)
  
  // Novos nodes - Logic
  wait: 'linear-gradient(to right, #6366f1, #4f46e5)', // Índigo (logic)
  switch: 'linear-gradient(to right, #6366f1, #4f46e5)', // Índigo (logic)
};

// Mapeamento de cores para os grupos (fallback)
const GROUP_COLORS: { [key: string]: string } = {
  trigger: 'linear-gradient(to right, #16a34a, #15803d)',
  input: 'linear-gradient(to right, #3b82f6, #2563eb)',
  communication: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
  transform: 'linear-gradient(to right, #f97316, #ea580c)',
  logic: 'linear-gradient(to right, #6366f1, #4f46e5)',
};

interface ModularNodeProps extends NodeProps {
  data: {
    nodeType?: string;
    label?: string;
    [key: string]: any;
  };
}

const ModularNode = ({ data, selected, type, id }: ModularNodeProps) => {
  // Usar o type do node ou o nodeType dos dados
  const nodeType = type || data.nodeType;

  
  if (!nodeType) {
    return (
      <div className="px-4 py-3 rounded-lg bg-red-100 border-2 border-red-300 text-red-800">
        <p className="text-sm font-medium">No node type specified</p>
        <p className="text-xs text-red-600 mt-1">Type: {type}, NodeType: {data.nodeType}</p>
      </div>
    );
  }
  
  let nodeDefinition;
  try {
    nodeDefinition = NodeService.getNodeDefinition(nodeType);
  } catch (error) {
    console.warn('Error getting node definition for', nodeType, ':', error);
  }
  
  if (!nodeDefinition) {
    return (
      <div className="px-4 py-3 rounded-lg bg-red-100 border-2 border-red-300 text-red-800">
        <p className="text-sm font-medium">Unknown node type: {nodeType}</p>
        <p className="text-xs text-red-600 mt-1">Available types: webhook, manualTrigger, scheduleTrigger, workflowTrigger, start, httpRequest, set, if, filter, dateTime, splitOut, removeDuplicates, wait, switch</p>
      </div>
    );
  }

  const Icon = MODULAR_NODE_ICONS[nodeType] || WebhookIcon;
  const group = nodeDefinition.group[0] || 'input';
  const colorClass = GROUP_COLORS[group] || 'from-gray-600 to-gray-500';
  
  // Determinar se o node tem múltiplas saídas (como o IF)
  const hasMultipleOutputs = nodeDefinition.outputs.length > 1;
  
  // Extrair a cor principal do gradiente para usar nos handles
  const getMainColor = (nodeType: string) => {
    const colorMap: { [key: string]: string } = {
      webhook: '#16a34a',
      manualTrigger: '#2563eb',
      scheduleTrigger: '#f59e0b',
      workflowTrigger: '#8b5cf6',
      start: '#059669',
      httpRequest: '#3b82f6',
      set: '#f97316',
      if: '#6366f1',
      filter: '#f97316',
      dateTime: '#f97316',
      splitOut: '#f97316',
      removeDuplicates: '#f97316',
      wait: '#6366f1',
      switch: '#6366f1',
    };
    return colorMap[nodeType] || '#3b82f6';
  };
  
  const mainColor = getMainColor(nodeType);
  
  return (
    <div 
      className={`px-6 py-4 rounded-xl shadow-lg w-64 text-white border-2 hover:shadow-xl transition-all duration-200 relative`}
      style={{
        minWidth: '200px',
        minHeight: '80px',
        background: NODE_COLORS[nodeType] || GROUP_COLORS[group] || 'linear-gradient(to right, #3b82f6, #2563eb)',
        color: 'white',
        borderRadius: '12px',
        padding: '16px 24px',
        boxShadow: selected 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: selected 
          ? '2px solid rgba(255, 255, 255, 0.9)' 
          : '2px solid rgba(255, 255, 255, 0.3)',
        '--handle-border-color': mainColor
      } as React.CSSProperties}
    >

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {data.label || nodeDefinition.displayName}
          </h3>
          <p className="text-sm text-white/80 mt-1 line-clamp-2">
            {nodeDefinition.description}
          </p>
        </div>
      </div>

      {/* Input Handle - apenas se o node aceita inputs */}
      {nodeDefinition.inputs.length > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white border-2 border-current"
        />
      )}

      {/* Output Handles */}
      {nodeDefinition.outputs.length > 0 && (
        <>
          {hasMultipleOutputs ? (
            // Múltiplas saídas
            <>
              {nodeType === 'if' ? (
                // IF node - 2 saídas (True/False)
                <>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="true"
                    style={{ top: '40%' }}
                    className="w-4 h-4 !bg-green-400 border-2 border-white"
                  />
                  <div className="absolute right-6 text-xs text-white/80" style={{ top: '35%' }}>
                    True
                  </div>
                  
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="false"
                    style={{ top: '60%' }}
                    className="w-4 h-4 !bg-red-400 border-2 border-white"
                  />
                  <div className="absolute right-6 text-xs text-white/80" style={{ top: '65%' }}>
                    False
                  </div>
                </>
              ) : nodeType === 'switch' ? (
                // Switch node - 4 saídas numeradas
                <>
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index}>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`output${index}`}
                        style={{ top: `${25 + index * 15}%` }}
                        className="w-4 h-4 !bg-blue-400 border-2 border-white"
                      />
                      <div className="absolute right-6 text-xs text-white/80" style={{ top: `${20 + index * 15}%` }}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                // Outros nodes com múltiplas saídas
                nodeDefinition.outputs.map((_, index) => (
                  <Handle
                    key={index}
                    type="source"
                    position={Position.Right}
                    id={`output${index}`}
                    style={{ top: `${30 + index * 20}%` }}
                    className="w-4 h-4 !bg-white border-2 border-current"
                  />
                ))
              )}
            </>
          ) : (
            // Saída única
            <Handle
              type="source"
              position={Position.Right}
              className="w-4 h-4 !bg-white border-2 border-current"
            />
          )}
        </>
      )}
    </div>
  );
};

export default memo(ModularNode); 