import { 
  nodeTypes, 
  credentialTypes, 
  availableNodes, 
  nodeGroups,
  getNodeType,
  getCredentialType,
  getNodesByGroup 
} from '../packages/nodes';

import { INodeType, INodeTypeDescription } from '../types/NodeTypes';

export class NodeService {
  /**
   * Obtém todos os nodes disponíveis
   */
  static getAvailableNodes() {
    return availableNodes;
  }

  /**
   * Obtém todos os grupos de nodes
   */
  static getNodeGroups() {
    return nodeGroups;
  }

  /**
   * Obtém nodes por grupo específico
   */
  static getNodesByGroup(group: string) {
    return getNodesByGroup(group);
  }

  /**
   * Obtém a definição de um node por tipo
   */
  static getNodeDefinition(nodeType: string): INodeTypeDescription | null {
    const NodeClass = getNodeType(nodeType);
    if (!NodeClass) {
      return null;
    }

    const nodeInstance = new NodeClass();
    return nodeInstance.description;
  }

  /**
   * Cria uma instância de um node
   */
  static createNodeInstance(nodeType: string): INodeType | null {
    const NodeClass = getNodeType(nodeType);
    if (!NodeClass) {
      return null;
    }

    return new NodeClass();
  }

  /**
   * Executa um node com dados fornecidos
   */
  static async executeNode(
    nodeType: string, 
    items: any[], 
    parameters: { [key: string]: any } = {}
  ): Promise<any[]> {
    console.log('🔧 NodeService.executeNode iniciado');
    console.log('📋 nodeType:', nodeType);
    console.log('📋 items:', items);
    console.log('📋 parameters:', parameters);
    
    const nodeInstance = this.createNodeInstance(nodeType);
    console.log('📋 nodeInstance:', nodeInstance);
    
    if (!nodeInstance) {
      console.error('❌ Node instance não encontrada para tipo:', nodeType);
      throw new Error(`Node type '${nodeType}' not found`);
    }

    console.log('✅ Node instance criada com sucesso');

    // Simular contexto de execução
    const executionContext = {
      getNodeParameter: (paramName: string, itemIndex: number, defaultValue?: any) => {
        const value = parameters[paramName] !== undefined ? parameters[paramName] : defaultValue;
        console.log(`📋 getNodeParameter(${paramName}, ${itemIndex}) = ${value}`);
        return value;
      },
      getInputData: () => {
        console.log('📋 getInputData() =', items);
        return items;
      },
      getCredentials: async (credentialType: string) => {
        console.log('📋 getCredentials para tipo:', credentialType);
        // Integração com o sistema de credenciais do banco
        try {
          const response = await fetch(`/api/credentials/type/${credentialType}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            // Retornar a primeira credencial ativa do tipo solicitado
            return result.data.length > 0 ? result.data[0].credential_data : {};
          }
          
          return {};
        } catch (error) {
          console.error('Erro ao buscar credenciais:', error);
          return {};
        }
      },
      helpers: {
        request: async (options: any) => {
          console.log('📋 helpers.request chamado com:', options);
          // Aqui você faria requisições HTTP reais
          return { data: 'mock response' };
        },
      },
    };

    console.log('✅ Contexto de execução criado');

    // Bind do contexto ao node
    const boundExecute = nodeInstance.execute.bind(executionContext);
    console.log('🚀 Executando node...');
    
    try {
      const result = await boundExecute(items);
      console.log('✅ Node executado com sucesso. Resultado:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro na execução do node:', error);
      throw error;
    }
  }

  /**
   * Valida os parâmetros de um node
   */
  static validateNodeParameters(nodeType: string, parameters: { [key: string]: any }): {
    isValid: boolean;
    errors: string[];
  } {
    const definition = this.getNodeDefinition(nodeType);
    if (!definition) {
      return { isValid: false, errors: [`Node type '${nodeType}' not found`] };
    }

    const errors: string[] = [];

    // Validar parâmetros obrigatórios
    for (const property of definition.properties) {
      if (property.required && (parameters[property.name] === undefined || parameters[property.name] === '')) {
        errors.push(`Parameter '${property.displayName}' is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obtém as propriedades visíveis de um node baseado nos parâmetros atuais
   */
  static getVisibleProperties(nodeType: string, parameters: { [key: string]: any }) {
    const definition = this.getNodeDefinition(nodeType);
    if (!definition) {
      return [];
    }

    return definition.properties.filter(property => {
      // Verificar displayOptions.show
      if (property.displayOptions?.show) {
        for (const [key, values] of Object.entries(property.displayOptions.show)) {
          const currentValue = parameters[key];
          if (!values.includes(currentValue)) {
            return false;
          }
        }
      }

      // Verificar displayOptions.hide
      if (property.displayOptions?.hide) {
        for (const [key, values] of Object.entries(property.displayOptions.hide)) {
          const currentValue = parameters[key];
          if (values.includes(currentValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Obtém informações sobre credenciais necessárias para um node
   */
  static getNodeCredentials(nodeType: string) {
    const definition = this.getNodeDefinition(nodeType);
    if (!definition || !definition.credentials) {
      return [];
    }

    return definition.credentials.map(cred => {
      const credentialType = getCredentialType(cred.name);
      return {
        name: cred.name,
        required: cred.required,
        definition: credentialType ? new credentialType() : null,
      };
    });
  }

  /**
   * Gera configuração padrão para um node
   */
  static getDefaultNodeConfiguration(nodeType: string) {
    const definition = this.getNodeDefinition(nodeType);
    if (!definition) {
      return {};
    }

    const defaultConfig: { [key: string]: any } = {};

    for (const property of definition.properties) {
      defaultConfig[property.name] = property.default;
    }

    return defaultConfig;
  }

  /**
   * Converte node para formato de workflow
   */
  static nodeToWorkflowFormat(nodeType: string, id: string, position: { x: number; y: number }, parameters: { [key: string]: any }) {
    const definition = this.getNodeDefinition(nodeType);
    if (!definition) {
      return null;
    }

    return {
      id,
      type: nodeType,
      position,
      data: {
        label: definition.displayName,
        nodeType: nodeType,
        parameters,
        ...definition.defaults,
      },
    };
  }

  /**
   * Obtém estatísticas dos nodes disponíveis
   */
  static getNodeStatistics() {
    const stats = {
      totalNodes: availableNodes.length,
      byGroup: {} as { [key: string]: number },
      withCredentials: 0,
    };

    // Contar por grupo
    for (const node of availableNodes) {
      stats.byGroup[node.group] = (stats.byGroup[node.group] || 0) + 1;
    }

    // Contar nodes com credenciais
    for (const node of availableNodes) {
      const definition = this.getNodeDefinition(node.type);
      if (definition?.credentials && definition.credentials.length > 0) {
        stats.withCredentials++;
      }
    }

    return stats;
  }
} 