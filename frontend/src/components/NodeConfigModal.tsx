import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings, Play, Plus, Trash2, FileText, ArrowRight, RefreshCw, Code, Table, GitBranch, Search, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { NodeService } from '../services/nodeService';
import { useToast } from '../contexts/ToastContext';

interface NodeConfigModalProps {
  nodeId: string;
  onClose: () => void;
}

type ViewMode = 'table' | 'json' | 'schema';

// Componente para visualização em tabela
const TableView = ({ data }: { data: any[] }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  // Garantir que temos pelo menos um item válido
  const validItems = data.filter(item => item && typeof item === 'object' && item.json);
  
  if (validItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        No valid data items found
      </div>
    );
  }

  const firstItem = validItems[0]?.json || {};
  const headers = Object.keys(firstItem);

  if (headers.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        No properties found in data
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
              #
            </th>
            {headers.map((header) => (
              <th key={header} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {validItems.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                {index}
              </td>
              {headers.map((header) => (
                <td key={header} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-900 dark:text-gray-100">
                  {typeof item.json[header] === 'object' 
                    ? JSON.stringify(item.json[header]) 
                    : String(item.json[header] ?? '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente para visualização em JSON
const JsonView = ({ data }: { data: any }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Garantir que temos dados válidos para exibir
  const safeData = data || [{ json: {} }];
  
  const jsonString = JSON.stringify(safeData, null, 2);
  const highlightedJson = searchTerm 
    ? jsonString.replace(
        new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        (match) => `<mark class="bg-yellow-200 dark:bg-yellow-600">${match}</mark>`
      )
    : jsonString;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search in JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <button
          onClick={copyToClipboard}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Copy JSON"
        >
          <Copy size={16} />
        </button>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded border overflow-auto max-h-96">
        <pre 
          className="p-3 text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlightedJson }}
        />
      </div>
    </div>
  );
};

// Componente para item do schema (draggable)
const SchemaItem = ({ 
  path, 
  value, 
  level = 0, 
  onDragStart 
}: { 
  path: string; 
  value: any; 
  level?: number; 
  onDragStart: (path: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const hasChildren = isObject || isArray;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', `{{ $json.${path} }}`);
    onDragStart(path);
  };

  const getValuePreview = () => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value.length > 20 ? value.substring(0, 20) + '...' : value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (isArray) return `Array(${value.length})`;
    if (isObject) return `Object(${Object.keys(value).length})`;
    return String(value);
  };

  const getTypeIcon = () => {
    if (isArray) return '[]';
    if (isObject) return '{}';
    if (typeof value === 'string') return 'Aa';
    if (typeof value === 'number') return '123';
    if (typeof value === 'boolean') return 'T/F';
    if (value === null) return '∅';
    if (value === undefined) return '?';
    return '?';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`{{ $json.${path} }}`);
  };

  return (
    <div className="select-none">
      <div 
        className="flex items-center space-x-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        draggable={!hasChildren}
        onDragStart={handleDragStart}
        onClick={handleClick}
      >
        {hasChildren && (
          <button className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        
        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-300">
          {getTypeIcon()}
        </span>
        
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
          {path.split('.').pop()}
        </span>
        
        {!hasChildren && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
            {getValuePreview()}
          </span>
        )}
        
        {!hasChildren && (
          <button
            onClick={handleCopyPath}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Copy path"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {isArray ? (
            value.map((item: any, index: number) => (
              <SchemaItem
                key={index}
                path={`${path}[${index}]`}
                value={item}
                level={level + 1}
                onDragStart={onDragStart}
              />
            ))
          ) : (
            Object.entries(value || {}).map(([key, val]) => (
              <SchemaItem
                key={key}
                path={path ? `${path}.${key}` : key}
                value={val}
                level={level + 1}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Componente para visualização em schema
const SchemaView = ({ data }: { data: any }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedPath, setDraggedPath] = useState<string | null>(null);

  const handleDragStart = (path: string) => {
    setDraggedPath(path);
  };

  const filterData = (obj: any, search: string): any => {
    if (!search) return obj;
    
    const filtered: any = {};
    const searchLower = search.toLowerCase();
    
    const searchInObject = (current: any, currentPath: string = ''): void => {
      if (typeof current === 'object' && current !== null) {
        Object.entries(current).forEach(([key, value]) => {
          const fullPath = currentPath ? `${currentPath}.${key}` : key;
          
          if (key.toLowerCase().includes(searchLower) || 
              fullPath.toLowerCase().includes(searchLower) ||
              (typeof value === 'string' && value.toLowerCase().includes(searchLower))) {
            
            // Adicionar o caminho completo ao resultado
            const pathParts = fullPath.split('.');
            let current = filtered;
            
            for (let i = 0; i < pathParts.length - 1; i++) {
              if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
              }
              current = current[pathParts[i]];
            }
            current[pathParts[pathParts.length - 1]] = value;
          }
          
          if (typeof value === 'object' && value !== null) {
            searchInObject(value, fullPath);
          }
        });
      }
    };
    
    if (Array.isArray(obj)) {
      return obj.filter((item, index) => {
        if (typeof item === 'object') {
          searchInObject(item, `[${index}]`);
        }
        return true;
      });
    } else {
      searchInObject(obj);
    }
    
    return Object.keys(filtered).length > 0 ? filtered : obj;
  };

  // Garantir que temos dados válidos para exibir
  let displayData = {};
  
  if (Array.isArray(data) && data.length > 0) {
    // Pegar o primeiro item válido do array
    const firstValidItem = data.find(item => item && typeof item === 'object');
    if (firstValidItem) {
      displayData = firstValidItem.json || firstValidItem;
    }
  } else if (data && typeof data === 'object') {
    displayData = data.json || data;
  }

  // Se ainda não temos dados válidos, usar um objeto vazio
  if (!displayData || typeof displayData !== 'object') {
    displayData = {};
  }

  const filteredData = filterData(displayData, searchTerm);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Drag properties to inputs to create expressions
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded border overflow-auto max-h-96">
        {Object.keys(filteredData).length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {Object.keys(displayData).length === 0 ? 'No data available' : 'No properties found'}
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(filteredData).map(([key, value]) => (
              <SchemaItem
                key={key}
                path={key}
                value={value}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        )}
      </div>
      
      {draggedPath && (
        <div className="text-xs text-blue-600 dark:text-blue-400">
          Dragging: {`{{ $json.${draggedPath} }}`}
        </div>
      )}
    </div>
  );
};

// Componente principal para Input/Output com os 3 modos
const InputOutputContent = ({ 
  nodeId, 
  type,
  testResult 
}: { 
  nodeId: string; 
  type: 'input' | 'output';
  testResult?: any;
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const { nodes, edges } = useWorkflowStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentNode = nodes.find(n => n.id === nodeId);
      
      if (type === 'output') {
        // Para output, primeiro verificar se há dados de teste persistidos
        if (testResult) {
          console.log('📤 Usando testResult para output:', testResult);
          // Garantir que testResult está no formato correto
          if (Array.isArray(testResult)) {
            setData(testResult);
          } else if (testResult && typeof testResult === 'object') {
            setData([{ json: testResult }]);
          } else {
            setData([{ json: { result: testResult } }]);
          }
          return;
        }
        
        // Verificar se há dados persistidos no node
        if (currentNode?.data?._testOutputData) {
          console.log('📤 Usando dados persistidos para output:', currentNode.data._testOutputData);
          const persistedData = currentNode.data._testOutputData;
          if (Array.isArray(persistedData)) {
            setData(persistedData);
          } else if (persistedData && typeof persistedData === 'object') {
            setData([{ json: persistedData }]);
          } else {
            setData([{ json: { result: persistedData } }]);
          }
          return;
        }
        
        // Se não há dados persistidos, tentar executar o node
        console.log('📤 Executando node para obter output...');
        
        // Buscar dados de input primeiro
        let inputData = [{ json: {} }];
        const connectedEdges = edges.filter(edge => edge.target === nodeId);
        
        if (connectedEdges.length > 0) {
          for (const edge of connectedEdges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode?.data?._testOutputData) {
              // Usar dados persistidos do node anterior
              const sourceData = sourceNode.data._testOutputData;
              if (Array.isArray(sourceData)) {
                inputData = sourceData;
              } else if (sourceData && typeof sourceData === 'object') {
                inputData = [{ json: sourceData }];
              } else {
                inputData = [{ json: { result: sourceData } }];
              }
              console.log('📥 Usando dados persistidos do node anterior como input:', inputData);
              break;
            }
          }
        }
        
        // Executar o node atual
        if (currentNode?.type) {
          try {
            const response = await fetch('http://localhost:3001/api/nodes/execute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                nodeType: currentNode.type,
                parameters: currentNode.data || {},
                inputData: inputData
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                console.log('✅ Dados de output obtidos da execução:', result.data);
                // Garantir que os dados estão no formato correto
                if (Array.isArray(result.data)) {
                  setData(result.data);
                } else if (result.data && typeof result.data === 'object') {
                  setData([{ json: result.data }]);
                } else {
                  setData([{ json: { result: result.data } }]);
                }
                return;
              }
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
          } catch (fetchError) {
            console.warn('⚠️ Erro ao executar node para output:', fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Erro ao executar node');
          }
        }
        
        // Fallback para dados simulados
        console.log('📤 Usando dados simulados para output');
        setData([{
          json: {
            message: "Dados de exemplo - execute o node para ver dados reais",
            timestamp: new Date().toISOString(),
            nodeType: currentNode?.type || 'unknown'
          }
        }]);
        
      } else {
        // Para input, verificar se há dados persistidos
        if (currentNode?.data?._testInputData) {
          console.log('📥 Usando dados persistidos para input:', currentNode.data._testInputData);
          const persistedData = currentNode.data._testInputData;
          if (Array.isArray(persistedData)) {
            setData(persistedData);
          } else if (persistedData && typeof persistedData === 'object') {
            setData([{ json: persistedData }]);
          } else {
            setData([{ json: { result: persistedData } }]);
          }
          return;
        }
        
        // Buscar dados dos nodes conectados anteriormente
        const connectedEdges = edges.filter(edge => edge.target === nodeId);
        
        if (connectedEdges.length > 0) {
          console.log('📥 Buscando dados de input dos nodes conectados...');
          
          for (const edge of connectedEdges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;
            
            // Verificar se há dados persistidos no node fonte
            if (sourceNode.data?._testOutputData) {
              const sourceData = sourceNode.data._testOutputData;
              let inputData;
              if (Array.isArray(sourceData)) {
                inputData = sourceData;
              } else if (sourceData && typeof sourceData === 'object') {
                inputData = [{ json: sourceData }];
              } else {
                inputData = [{ json: { result: sourceData } }];
              }
              console.log('📥 Dados de input obtidos do node conectado (persistidos):', inputData);
              setData(inputData);
              return;
            }
            
            // Se não há dados persistidos, tentar executar o node fonte
            if (sourceNode.type) {
              try {
                const response = await fetch('http://localhost:3001/api/nodes/execute', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                  },
                  body: JSON.stringify({
                    nodeType: sourceNode.type,
                    parameters: sourceNode.data || {},
                    inputData: [{ json: {} }]
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success && result.data) {
                    let inputData;
                    if (Array.isArray(result.data)) {
                      inputData = result.data;
                    } else if (result.data && typeof result.data === 'object') {
                      inputData = [{ json: result.data }];
                    } else {
                      inputData = [{ json: { result: result.data } }];
                    }
                    console.log('📥 Dados de input obtidos da execução do node conectado:', inputData);
                    setData(inputData);
                    return;
                  }
                }
              } catch (fetchError) {
                console.warn('⚠️ Erro ao executar node conectado para input:', fetchError);
              }
            }
          }
        }
        
        // Fallback para dados vazios
        console.log('📥 Usando dados vazios para input');
        setData([{ json: {} }]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setData([{ json: { error: 'Erro ao carregar dados' } }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nodeId, type, testResult, edges.length]); // Adicionar edges.length para reagir a mudanças nas conexões

  const renderViewModeButtons = () => (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
      <button
        onClick={() => setViewMode('table')}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          viewMode === 'table'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <Table size={14} />
        <span>Table</span>
      </button>
      <button
        onClick={() => setViewMode('json')}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          viewMode === 'json'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <Code size={14} />
        <span>JSON</span>
      </button>
      <button
        onClick={() => setViewMode('schema')}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          viewMode === 'schema'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <GitBranch size={14} />
        <span>Schema</span>
      </button>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-red-500 mb-2">❌ Erro</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
            <button
              onClick={fetchData}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    // Garantir que data está no formato correto antes de passar para os componentes
    const safeData = data || [{ json: {} }];

    switch (viewMode) {
      case 'table':
        return <TableView data={safeData} />;
      case 'json':
        return <JsonView data={safeData} />;
      case 'schema':
        return <SchemaView data={safeData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {type} Data
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Array.isArray(data) ? data.length : (data ? 1 : 0)} item{(Array.isArray(data) ? data.length : (data ? 1 : 0)) !== 1 ? 's' : ''}
          </span>
        </div>
        {renderViewModeButtons()}
      </div>
      
      {renderContent()}
    </div>
  );
};

const InputMappingContent = ({ nodeId }: { nodeId: string }) => {
  const { nodes, edges } = useWorkflowStore();
  const [inputData, setInputData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const connectedEdges = edges.filter(edge => edge.target === nodeId);
  
  const fetchInputData = async () => {
    if (connectedEdges.length === 0) return;
    
    setLoading(true);
    try {
      const inputResults = await Promise.all(
        connectedEdges.map(async (edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          if (!sourceNode) return null;
          
          try {
            if (sourceNode.type) {
              const nodeDefinition = NodeService.getNodeDefinition(sourceNode.type);
              if (nodeDefinition) {
                const items = [{ json: {} }];
                const parameters = sourceNode.data || {};
                const result = await NodeService.executeNode(sourceNode.type, items, parameters);
                return {
                  nodeId: sourceNode.id,
                  nodeName: sourceNode.data?.label || sourceNode.type,
                  nodeType: sourceNode.type,
                  data: result
                };
              }
            }
          } catch (error) {
            console.warn('Error executing source node:', error);
          }
          
          let sampleData = {};
          if (sourceNode.type === 'httpRequest') {
            sampleData = {
              id: 1,
              name: "Rick Sanchez",
              status: "Alive",
              species: "Human",
              type: "",
              gender: "Male",
              origin: {
                name: "Earth (C-137)",
                url: "https://rickandmortyapi.com/api/location/1"
              },
              location: {
                name: "Citadel of Ricks",
                url: "https://rickandmortyapi.com/api/location/3"
              },
              image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
              episode: [
                "https://rickandmortyapi.com/api/episode/1",
                "https://rickandmortyapi.com/api/episode/2"
              ],
              _statusCode: 200,
              _statusMessage: "OK",
              _headers: { 'content-type': 'application/json' },
              _timestamp: new Date().toISOString()
            };
          } else if (sourceNode.type === 'webhook') {
            sampleData = {
              body: { webhook: 'data', timestamp: new Date().toISOString() },
              headers: { 'user-agent': 'webhook-client' },
              query: {}
            };
          } else {
            sampleData = {
              message: `Sample data from ${sourceNode.data?.label || sourceNode.type}`,
              timestamp: new Date().toISOString(),
              nodeId: sourceNode.id
            };
          }
          
          return {
            nodeId: sourceNode.id,
            nodeName: sourceNode.data?.label || sourceNode.type,
            nodeType: sourceNode.type,
            data: [{ json: sampleData }]
          };
        })
      );
      
      setInputData(inputResults.filter(Boolean));
    } catch (error) {
      console.error('Error fetching input data:', error);
      setInputData([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (connectedEdges.length > 0) {
      fetchInputData();
    }
  }, [nodeId, connectedEdges.length]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Carregando dados de entrada...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <ArrowRight className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">Input Data Mapping</h4>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Configure como os dados de nodes anteriores serão mapeados para este node.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">Dados de Entrada (1 conexão)</h4>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Start</span>
              <span className="text-sm text-gray-500">start</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">1 item</span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-auto max-h-64">
              <pre className="text-green-400">
{JSON.stringify(inputData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">💡 Como usar estes dados</h5>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Você pode referenciar estes dados nos parâmetros do node usando expressões como:
          </p>
          <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">{'{{$json.trigger}}'}</code> - Acessa o campo "trigger"</li>
            <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">{'{{$json.message}}'}</code> - Acessa o campo "message"</li>
            <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">{'{{$json.timestamp}}'}</code> - Acessa o campo "timestamp"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ErrorBoundary específico para o modal
class ModalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro no NodeConfigModal:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Erro no Modal</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Ocorreu um erro ao carregar as configurações do node.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const NodeConfigModal = ({ nodeId, onClose }: NodeConfigModalProps) => {
  const { nodes, edges, updateNodeData } = useWorkflowStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'input' | 'parameters' | 'code' | 'output'>('parameters');
  const [nodeConfig, setNodeConfig] = useState<{ [key: string]: any }>({});
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Obter dados de teste do workflow se disponíveis


  // Verificações de segurança
  if (!nodeId) {
    console.error('NodeConfigModal: nodeId não fornecido');
    return null;
  }

  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    console.error('NodeConfigModal: node não encontrado:', nodeId);
    return null;
  }

  const nodeType = (node.type || node.data?.nodeType || '') as string;
  if (!nodeType) {
    console.error('NodeConfigModal: nodeType não encontrado para o node:', nodeId);
    return null;
  }

  console.log('NodeConfigModal renderizando:', { nodeId, nodeType, node });

  // Inicializar configuração apenas uma vez
  useEffect(() => {
    if (!isInitialized && node && node.data) {
      console.log('Inicializando configuração do node:', node.data);
      setNodeConfig({ ...node.data });
      setIsInitialized(true);
    }
  }, [node, isInitialized]);

  // Função para atualizar configuração sem causar loops
  const handleChange = useCallback((key: string, value: any) => {
    try {
      console.log('🔄 handleChange chamado:', key, typeof value);
      
      setNodeConfig((prev: any) => {
        const newConfig = {
          ...prev,
          [key]: value
        };
        console.log('📝 Nova configuração atualizada para chave:', key);
        
        // Atualizar o store de forma assíncrona para evitar loops
        setTimeout(() => {
          updateNodeData(nodeId, newConfig);
        }, 0);
        
        return newConfig;
      });
    } catch (error) {
      console.error('❌ Erro ao alterar configuração:', error);
    }
  }, [nodeId, updateNodeData]);

  const handleTestNode = async () => {
    try {
      console.log('🚀 handleTestNode iniciado');
      console.log('📋 nodeType:', nodeType);
      console.log('📋 nodeConfig:', nodeConfig);
      
      setIsTestLoading(true);
      setTestResult(null);

      // Buscar dados dos nodes conectados anteriormente para usar como input
      let inputData = [{ json: {} }];
      
      try {
        const connectedEdges = edges.filter(edge => edge.target === nodeId);
        
        if (connectedEdges.length > 0) {
          console.log('🔗 Encontradas conexões de entrada:', connectedEdges.length);
          
          // Para cada node conectado, buscar dados reais
          for (const edge of connectedEdges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;
            
            console.log('🔧 Processando node conectado:', sourceNode.type, sourceNode.id);
            
            // Primeiro, verificar se há dados persistidos no node fonte
            if (sourceNode.data?._testOutputData) {
              console.log('📥 Usando dados persistidos do node fonte:', sourceNode.data._testOutputData);
              const sourceData = sourceNode.data._testOutputData;
              if (Array.isArray(sourceData)) {
                inputData = sourceData;
              } else if (sourceData && typeof sourceData === 'object') {
                inputData = [{ json: sourceData }];
              } else {
                inputData = [{ json: { result: sourceData } }];
              }
              break; // Usar dados persistidos se disponíveis
            }
            
            // Se não há dados persistidos, executar o node fonte para obter dados reais
            try {
              console.log('🔧 Executando node fonte para obter dados:', sourceNode.type);
              
              // Preparar dados de input para o node fonte
              let sourceInputData = [{ json: {} }];
              
              // Se o node fonte não é um trigger, buscar seus dados de entrada recursivamente
              if (sourceNode.type && !['manualTrigger', 'start', 'webhook', 'scheduleTrigger'].includes(sourceNode.type)) {
                const sourceConnectedEdges = edges.filter(e => e.target === sourceNode.id);
                if (sourceConnectedEdges.length > 0) {
                  // Executar recursivamente os nodes anteriores
                  for (const sourceEdge of sourceConnectedEdges) {
                    const prevNode = nodes.find(n => n.id === sourceEdge.source);
                    if (prevNode && prevNode.type) {
                      try {
                        console.log('🔧 Executando node anterior:', prevNode.type);
                        const response = await fetch('http://localhost:3001/api/nodes/execute', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                          },
                          body: JSON.stringify({
                            nodeType: prevNode.type as string,
                            parameters: prevNode.data || {},
                            inputData: [{ json: {} }]
                          })
                        });
                        
                        if (response.ok) {
                          const prevResult = await response.json();
                          if (prevResult.success && prevResult.data) {
                            // Se o resultado é um array, usar diretamente
                            if (Array.isArray(prevResult.data)) {
                              sourceInputData = prevResult.data;
                            } else {
                              // Se é um objeto, encapsular em array
                              sourceInputData = [{ json: prevResult.data }];
                            }
                            console.log('✅ Dados do node anterior obtidos:', sourceInputData);
                            break; // Usar apenas o primeiro node conectado
                          }
                        }
                      } catch (error) {
                        console.warn('⚠️ Erro ao executar node anterior:', error);
                      }
                    }
                  }
                }
              }
              
                            // Executar o node fonte com os dados corretos
              if (sourceNode.type) {
                console.log('🔧 Executando node fonte com inputData:', sourceInputData);
                const response = await fetch('http://localhost:3001/api/nodes/execute', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                  },
                  body: JSON.stringify({
                    nodeType: sourceNode.type,
                    parameters: sourceNode.data || {},
                    inputData: sourceInputData
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success && result.data) {
                    // Se o resultado é um array, usar diretamente
                    if (Array.isArray(result.data)) {
                      inputData = result.data;
                    } else {
                      // Se é um objeto, encapsular em array
                      inputData = [{ json: result.data }];
                    }
                    console.log('✅ Dados do node conectado obtidos para usar como input:', inputData);
                    
                    // Salvar os dados de output no node fonte para persistência
                    updateNodeData(sourceNode.id, {
                      ...sourceNode.data,
                      _testOutputData: result.data,
                      _lastTestResult: result.data,
                      _lastTestTimestamp: new Date().toISOString()
                    });
                    
                    break; // Usar apenas o primeiro node conectado
                  }
                } else {
                  console.warn('⚠️ Erro na resposta do node fonte:', response.status);
                }
              }
            } catch (error) {
              console.warn('⚠️ Erro ao executar node conectado:', error);
            }
          }
        } else {
          console.log('ℹ️ Nenhuma conexão de entrada encontrada, usando dados vazios');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar dados de entrada:', error);
      }

      console.log('🚀 Fazendo chamada para API com inputData:', inputData);
      
      // Fazer chamada para a API do backend com os dados corretos
      const response = await fetch('http://localhost:3001/api/nodes/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          nodeType: nodeType,
          parameters: nodeConfig,
          inputData: inputData
        })
      });

      console.log('📋 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Resultado recebido da API:', result);
      
      // Processar o resultado
      if (result.success && result.data) {
        setTestResult(result.data);
        
        // Salvar os dados de output no node atual para persistência
        updateNodeData(nodeId, {
          ...nodeConfig,
          _testInputData: inputData,
          _testOutputData: result.data,
          _lastTestResult: result.data,
          _lastTestTimestamp: new Date().toISOString()
        });
        
        console.log('💾 Dados de teste salvos no node para persistência');
      } else {
        setTestResult(result);
      }
      console.log('✅ testResult atualizado');
    } catch (error) {
      console.error('❌ Erro ao testar node:', error);
      setTestResult({
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      // Salvar erro no node para persistência
      updateNodeData(nodeId, {
        ...nodeConfig,
        _lastTestError: error instanceof Error ? error.message : 'Erro desconhecido',
        _lastTestTimestamp: new Date().toISOString()
      });
    } finally {
      setIsTestLoading(false);
      console.log('🏁 handleTestNode finalizado');
    }
  };

  // Funções para HTTP Request - otimizadas e simplificadas
  const addHeader = useCallback(() => {
    const currentHeaders = nodeConfig.headers || {};
    const existingKeys = Object.keys(currentHeaders);
    let newKey = 'Header';
    let counter = 1;
    
    // Encontrar um nome único para o header
    while (existingKeys.includes(newKey)) {
      newKey = `Header${counter}`;
      counter++;
    }
    
    const newHeaders = { ...currentHeaders, [newKey]: '' };
    handleChange('headers', newHeaders);
  }, [nodeConfig.headers, handleChange]);

  const removeHeader = useCallback((index: number) => {
    const currentHeaders = nodeConfig.headers || {};
    const headerKeys = Object.keys(currentHeaders);
    if (index >= 0 && index < headerKeys.length) {
      const keyToRemove = headerKeys[index];
      const newHeaders = { ...currentHeaders };
      delete newHeaders[keyToRemove];
      handleChange('headers', newHeaders);
    }
  }, [nodeConfig.headers, handleChange]);

  const updateHeader = useCallback((index: number, field: string, value: string) => {
    const currentHeaders = nodeConfig.headers || {};
    const headerKeys = Object.keys(currentHeaders);
    if (index >= 0 && index < headerKeys.length) {
      const oldKey = headerKeys[index];
      const newHeaders = { ...currentHeaders };
      
      if (field === 'key') {
        if (oldKey !== value && value.trim() !== '') {
          // Verificar se a nova chave já existe
          if (!newHeaders.hasOwnProperty(value)) {
            delete newHeaders[oldKey];
            newHeaders[value] = currentHeaders[oldKey] || '';
          }
        }
      } else {
        newHeaders[oldKey] = value;
      }
      
      handleChange('headers', newHeaders);
    }
  }, [nodeConfig.headers, handleChange]);

  const addQueryParam = useCallback(() => {
    const currentParams = nodeConfig.queryParameters || {};
    const existingKeys = Object.keys(currentParams);
    let newKey = 'param';
    let counter = 1;
    
    // Encontrar um nome único para o parâmetro
    while (existingKeys.includes(newKey)) {
      newKey = `param${counter}`;
      counter++;
    }
    
    const newParams = { ...currentParams, [newKey]: '' };
    handleChange('queryParameters', newParams);
  }, [nodeConfig.queryParameters, handleChange]);

  const removeQueryParam = useCallback((index: number) => {
    const currentParams = nodeConfig.queryParameters || {};
    const paramKeys = Object.keys(currentParams);
    if (index >= 0 && index < paramKeys.length) {
      const keyToRemove = paramKeys[index];
      const newParams = { ...currentParams };
      delete newParams[keyToRemove];
      handleChange('queryParameters', newParams);
    }
  }, [nodeConfig.queryParameters, handleChange]);

  const updateQueryParam = useCallback((index: number, field: string, value: string) => {
    const currentParams = nodeConfig.queryParameters || {};
    const paramKeys = Object.keys(currentParams);
    if (index >= 0 && index < paramKeys.length) {
      const oldKey = paramKeys[index];
      const newParams = { ...currentParams };
      
      if (field === 'key') {
        if (oldKey !== value && value.trim() !== '') {
          // Verificar se a nova chave já existe
          if (!newParams.hasOwnProperty(value)) {
            delete newParams[oldKey];
            newParams[value] = currentParams[oldKey] || '';
          }
        }
      } else {
        newParams[oldKey] = value;
      }
      
      handleChange('queryParameters', newParams);
    }
  }, [nodeConfig.queryParameters, handleChange]);

  const renderHttpRequestConfig = () => {
    if (nodeType !== 'httpRequest') {
      return null;
    }

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={nodeConfig.label || 'HTTP Request'}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="HTTP Request"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={nodeConfig.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Add notes about this node..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Method <span className="text-red-500">*</span>
          </label>
          <select
            value={nodeConfig.method || 'GET'}
            onChange={(e) => handleChange('method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={nodeConfig.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const droppedText = e.dataTransfer.getData('text/plain');
              if (droppedText.startsWith('{{') && droppedText.endsWith('}}')) {
                handleChange('url', droppedText);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('drag-over');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('drag-over');
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white drag-drop-field"
            placeholder="https://rickandmortyapi.com/api/character"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Authentication
          </label>
          <select
            value={nodeConfig.authentication || 'None'}
            onChange={(e) => handleChange('authentication', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="None">None</option>
            <option value="Basic Auth">Basic Auth</option>
            <option value="Bearer Token">Bearer Token</option>
            <option value="API Key">API Key</option>
          </select>
        </div>

        {/* Headers Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Headers
            </label>
            <button
              type="button"
              onClick={addHeader}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Add Header</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(nodeConfig.headers || {}).map(([key, value], index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const droppedText = e.dataTransfer.getData('text/plain');
                    if (droppedText.startsWith('{{') && droppedText.endsWith('}}')) {
                      updateHeader(index, 'value', droppedText);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  placeholder="Header value"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white drag-drop-field"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(index)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Query Parameters Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Query Parameters
            </label>
            <button
              type="button"
              onClick={addQueryParam}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Add Parameter</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(nodeConfig.queryParameters || {}).map(([key, value], index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                  placeholder="Parameter name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const droppedText = e.dataTransfer.getData('text/plain');
                    if (droppedText.startsWith('{{') && droppedText.endsWith('}}')) {
                      updateQueryParam(index, 'value', droppedText);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  placeholder="Parameter value"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white drag-drop-field"
                />
                <button
                  type="button"
                  onClick={() => removeQueryParam(index)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <details className="border border-gray-200 dark:border-gray-600 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            ▶ Advanced settings
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={nodeConfig.timeout || 10000}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value) || 10000)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                min="1000"
                max="300000"
              />
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nodeConfig.followRedirects !== false}
                  onChange={(e) => handleChange('followRedirects', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Follow Redirects
                </span>
              </label>
            </div>
          </div>
        </details>
      </div>
    );
  };

  const renderConfigFields = () => {
    switch (nodeType) {
      case 'httpRequest':
        return renderHttpRequestConfig();
      default:
        return renderGenericNodeConfig();
    }
  };

  const renderGenericNodeConfig = () => {
    try {
      const nodeDefinition = NodeService.getNodeDefinition(nodeType as string);
      
      if (!nodeDefinition || !nodeDefinition.properties) {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={nodeConfig.label || nodeType}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Configurações específicas para este tipo de node ainda não foram implementadas.
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {/* Display Name sempre presente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={nodeConfig.label || nodeDefinition.displayName}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Renderizar propriedades do node */}
          {nodeDefinition.properties.map((property, index) => 
            renderNodeProperty(property, index)
          )}
        </div>
      );
    } catch (error) {
      console.error('Erro ao renderizar configurações do node:', error);
      return (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Erro de Configuração</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              Não foi possível carregar as configurações para este tipo de node.
            </p>
          </div>
        </div>
      );
    }
  };

  const renderNodeProperty = (property: any, index: number) => {
    const key = `property-${index}`;
    const value = nodeConfig[property.name] || property.default;

    // Verificar se a propriedade deve ser exibida baseado em displayOptions
    if (property.displayOptions) {
      if (property.displayOptions.show) {
        const shouldShow = Object.entries(property.displayOptions.show).every(([key, values]) => {
          const currentValue = nodeConfig[key];
          return Array.isArray(values) && values.includes(currentValue);
        });
        if (!shouldShow) return null;
      }
      
      if (property.displayOptions.hide) {
        const shouldHide = Object.entries(property.displayOptions.hide).some(([key, values]) => {
          const currentValue = nodeConfig[key];
          return Array.isArray(values) && values.includes(currentValue);
        });
        if (shouldHide) return null;
      }
    }

    switch (property.type) {
      case 'string':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {property.displayName}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.typeOptions?.rows ? (
              <textarea
                value={value || ''}
                onChange={(e) => handleChange(property.name, e.target.value)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const droppedText = e.dataTransfer.getData('text/plain');
                  if (droppedText.startsWith('{{') && droppedText.endsWith('}}')) {
                    handleChange(property.name, droppedText);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('drag-over');
                }}
                placeholder={property.placeholder}
                rows={property.typeOptions.rows}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical drag-drop-field"
              />
            ) : (
              <input
                type={property.typeOptions?.password ? 'password' : 'text'}
                value={value || ''}
                onChange={(e) => handleChange(property.name, e.target.value)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const droppedText = e.dataTransfer.getData('text/plain');
                  if (droppedText.startsWith('{{') && droppedText.endsWith('}}')) {
                    handleChange(property.name, droppedText);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('drag-over');
                }}
                placeholder={property.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white drag-drop-field"
              />
            )}
            {property.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {property.description}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {property.displayName}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(property.name, parseFloat(e.target.value) || 0)}
              placeholder={property.placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {property.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {property.description}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={key}>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleChange(property.name, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {property.displayName}
                  {property.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {property.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {property.description}
                  </p>
                )}
              </div>
            </label>
          </div>
        );

      case 'options':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {property.displayName}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value || property.default}
              onChange={(e) => handleChange(property.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {property.options?.map((option: any, optIndex: number) => (
                <option key={optIndex} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
            {property.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {property.description}
              </p>
            )}
          </div>
        );

      case 'multiOptions':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {property.displayName}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
              {property.options?.map((option: any, optIndex: number) => (
                <label key={optIndex} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: any) => v !== option.value);
                      handleChange(property.name, newValues);
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.name}
                  </span>
                </label>
              ))}
            </div>
            {property.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {property.description}
              </p>
            )}
          </div>
        );

      case 'color':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {property.displayName}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={value || property.default}
                onChange={(e) => handleChange(property.name, e.target.value)}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md"
              />
              <input
                type="text"
                value={value || property.default}
                onChange={(e) => handleChange(property.name, e.target.value)}
                placeholder={property.placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {property.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {property.description}
              </p>
            )}
          </div>
        );

      case 'fixedCollection':
        return renderFixedCollection(property, key, value);

      default:
        return (
          <div key={key} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Tipo "{property.type}" não implementado
            </p>
          </div>
        );
    }
  };

  const renderFixedCollection = (property: any, key: string, value: any) => {
    const collectionValue = value || {};
    
    return (
      <div key={key} className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {property.displayName}
            {property.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        
        {property.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {property.description}
          </p>
        )}

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {property.options?.map((option: any, optIndex: number) => (
            <div key={optIndex} className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {option.displayName}
              </h4>
              
              {property.typeOptions?.multipleValues ? (
                <div className="space-y-3">
                  {(collectionValue[option.name] || []).map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {option.displayName} #{itemIndex + 1}
                        </span>
                        <button
                          onClick={() => {
                            const newItems = [...(collectionValue[option.name] || [])];
                            newItems.splice(itemIndex, 1);
                            handleChange(property.name, {
                              ...collectionValue,
                              [option.name]: newItems
                            });
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                      
                      {option.values?.map((subProperty: any, subIndex: number) => (
                        <div key={subIndex}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {subProperty.displayName}
                          </label>
                          {renderSubProperty(subProperty, item, (newValue) => {
                            const newItems = [...(collectionValue[option.name] || [])];
                            newItems[itemIndex] = { ...newItems[itemIndex], [subProperty.name]: newValue };
                            handleChange(property.name, {
                              ...collectionValue,
                              [option.name]: newItems
                            });
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const newItem = option.values?.reduce((acc: any, subProp: any) => {
                        acc[subProp.name] = subProp.default;
                        return acc;
                      }, {}) || {};
                      
                      handleChange(property.name, {
                        ...collectionValue,
                        [option.name]: [...(collectionValue[option.name] || []), newItem]
                      });
                    }}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    + Add {option.displayName}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {option.values?.map((subProperty: any, subIndex: number) => (
                    <div key={subIndex}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {subProperty.displayName}
                      </label>
                      {renderSubProperty(subProperty, collectionValue[option.name] || {}, (newValue) => {
                        handleChange(property.name, {
                          ...collectionValue,
                          [option.name]: {
                            ...(collectionValue[option.name] || {}),
                            [subProperty.name]: newValue
                          }
                        });
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubProperty = (subProperty: any, parentValue: any, onChange: (value: any) => void) => {
    const value = parentValue[subProperty.name] || subProperty.default;

    switch (subProperty.type) {
      case 'string':
        return subProperty.typeOptions?.rows ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={subProperty.placeholder}
            rows={subProperty.typeOptions.rows}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical text-sm"
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={subProperty.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {subProperty.displayName}
            </span>
          </label>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value || subProperty.default}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded"
            />
            <input
              type="text"
              value={value || subProperty.default}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        );

      default:
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Tipo "{subProperty.type}" não implementado
            </p>
          </div>
        );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'input':
        return <InputOutputContent nodeId={nodeId} type="input" testResult={testResult} />;
      case 'output':
        return <InputOutputContent nodeId={nodeId} type="output" testResult={testResult} />;
      case 'parameters':
        return renderConfigFields();
      case 'code':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Code Editor</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Funcionalidade de código personalizado será implementada em breve.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ModalErrorBoundary>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          // Fechar modal quando clicar no backdrop
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {nodeConfig.label || nodeType}
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure node parameters
                  </p>

                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTestNode}
                disabled={isTestLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                <span>{isTestLoading ? 'Testing...' : 'Test step'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {[
              { id: 'input', label: 'Input', icon: ArrowRight },
              { id: 'parameters', label: 'Parameters', icon: FileText },
              { id: 'code', label: 'Code', icon: Code },
              { id: 'output', label: 'Output', icon: ArrowRight }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </ModalErrorBoundary>
  );
};

export default NodeConfigModal;