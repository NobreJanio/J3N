import { useState, useMemo } from 'react';
import { 
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Webhook as WebhookIcon, 
  Globe as HttpIcon,
  Settings as SetIcon,
  GitBranch as IfIcon,
  Play as PlayIcon,
  Clock as ClockIcon,
  Workflow as WorkflowIcon,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
  Split as SplitIcon,
  Copy as CopyIcon,
  Timer as TimerIcon,
  Route as RouteIcon,
} from 'lucide-react';
import { NodeService } from '../services/nodeService';

// Mapeamento de ícones para os nodes modulares
const NODE_ICONS = {
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
  webhook: 'bg-gradient-to-r from-green-600 to-green-500',
  manualTrigger: 'bg-gradient-to-r from-blue-600 to-blue-500',
  scheduleTrigger: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  workflowTrigger: 'bg-gradient-to-r from-purple-600 to-purple-500',
  start: 'bg-gradient-to-r from-green-700 to-green-600',
  
  // Outros grupos mantêm cores por categoria
  httpRequest: 'bg-gradient-to-r from-blue-600 to-blue-500',
  set: 'bg-gradient-to-r from-orange-600 to-orange-500',
  if: 'bg-gradient-to-r from-indigo-600 to-indigo-500',
  
  // Novos nodes - Transform
  filter: 'bg-gradient-to-r from-orange-600 to-orange-500',
  dateTime: 'bg-gradient-to-r from-orange-600 to-orange-500',
  splitOut: 'bg-gradient-to-r from-orange-600 to-orange-500',
  removeDuplicates: 'bg-gradient-to-r from-orange-600 to-orange-500',
  
  // Novos nodes - Logic
  wait: 'bg-gradient-to-r from-indigo-600 to-indigo-500',
  switch: 'bg-gradient-to-r from-indigo-600 to-indigo-500',
};

// Mapeamento de cores para os grupos (fallback)
const GROUP_COLORS: { [key: string]: string } = {
  trigger: 'bg-gradient-to-r from-green-600 to-green-500',
  input: 'bg-gradient-to-r from-blue-600 to-blue-500',
  communication: 'bg-gradient-to-r from-purple-600 to-purple-500',
  transform: 'bg-gradient-to-r from-orange-600 to-orange-500',
  logic: 'bg-gradient-to-r from-indigo-600 to-indigo-500',
};

interface SideBarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideBar = ({ isCollapsed = false, onToggleCollapse }: SideBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Triggers', 'Input/Output']);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Gerar categorias dinamicamente dos nodes modulares
  const nodeCategories = useMemo(() => {
    const groups = NodeService.getNodeGroups();
    const availableNodes = NodeService.getAvailableNodes();
    
    return groups.map(group => ({
      name: group.displayName,
      expanded: true,
      nodes: availableNodes
        .filter(node => node.group === group.name)
        .map(node => ({
          type: node.type,
          label: node.displayName,
          icon: NODE_ICONS[node.type as keyof typeof NODE_ICONS] || WebhookIcon,
          color: NODE_COLORS[node.type] || GROUP_COLORS[group.name as keyof typeof GROUP_COLORS] || 'bg-gradient-to-r from-gray-600 to-gray-500',
          description: node.description
        }))
    }));
  }, []);

  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => 
    searchTerm === '' || 
    category.nodes.length > 0 || 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quando recolhida, limitar o número de nodes visíveis para evitar scroll
  const getVisibleNodes = (nodes: any[]) => {
    if (isCollapsed) {
      // Limitar a 10 nodes quando recolhida para evitar scroll
      return nodes.slice(0, 10);
    }
    return nodes;
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Node Types</h2>}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} className={`transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Search */}
        {!isCollapsed && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>
        )}
      </div>

      {/* Categories */}
      <div className={`flex-1 p-4 ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {isCollapsed ? (
          // Modo recolhido: mostrar apenas ícones limitados sem categorias
          <div className="space-y-2">
            {filteredCategories.flatMap(category => 
              getVisibleNodes(category.nodes)
            ).map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className={`flex items-center justify-center p-2 rounded-lg cursor-move transition-all duration-200 hover:scale-105 hover:shadow-lg text-white ${NODE_COLORS[node.type] || 'bg-gradient-to-r from-gray-600 to-gray-500'}`}
                title={node.label}
              >
                <node.icon size={16} />
              </div>
            ))}
          </div>
        ) : (
          // Modo expandido: mostrar com categorias e scroll
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                  {expandedCategories.includes(category.name) ? (
                    <ChevronDown size={16} className="text-gray-400 dark:text-gray-300" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400 dark:text-gray-300" />
                  )}
                </button>

                {/* Nodes in category */}
                {expandedCategories.includes(category.name) && (
                  <div className="mt-2 space-y-2">
                    {category.nodes.map((node) => (
                      <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        className={`flex items-center p-3 rounded-lg cursor-move transition-all duration-200 hover:scale-105 hover:shadow-lg text-white ${NODE_COLORS[node.type] || GROUP_COLORS[category.name] || 'bg-gradient-to-r from-gray-600 to-gray-500'}`}
                      >
                        <node.icon size={16} className="mr-3" />
                        <div className="flex-1">
                          <span className="font-medium block">{node.label}</span>
                          {typeof node.description === 'string' && (
                            <p className="text-xs text-white/80 mt-1 leading-tight">{node.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;