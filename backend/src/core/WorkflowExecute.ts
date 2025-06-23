import { WorkflowModel } from '../models/Workflow';
import { CredentialModel } from '../models/Credential';
import { ExecutionModel } from '../models/Execution';
import { NodeService } from '../services/NodeService';
import { EventEmitter } from 'events';

export interface IExecutionData {
  id: string;
  data: any;
  source?: {
    main?: any[][];
  };
}

export interface INodeExecutionData {
  json: any;
  binary?: any;
  pairedItem?: {
    item: number;
    input?: number;
  };
}

export interface IExecuteData {
  data: INodeExecutionData[];
  node: IWorkflowNode;
  source: {
    main: INodeExecutionData[][];
  };
}

export interface IWorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: { [key: string]: any };
  credentials?: { [key: string]: string };
}

export interface IWorkflowConnection {
  node: string;
  type: string;
  index: number;
}

export interface IWorkflowConnections {
  [key: string]: {
    main?: IWorkflowConnection[][];
  };
}

export interface IWorkflow {
  id: number;
  name: string;
  nodes: IWorkflowNode[];
  connections: IWorkflowConnections;
  active: boolean;
  settings?: { [key: string]: any };
}

export interface IExecutionContext {
  getNodeParameter(parameterName: string, itemIndex: number, defaultValue?: any): any;
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData[];
  getCredentials(type: string): Promise<any>;
  getWorkflowStaticData(type: string): any;
  helpers: {
    request(options: any): Promise<any>;
    httpRequest(options: any): Promise<any>;
  };
}

export class WorkflowExecute extends EventEmitter {
  private workflow: IWorkflow;
  private executionId: string;
  private userId: number;
  private mode: 'manual' | 'webhook' | 'cron' | 'trigger';
  private runData: { [key: string]: INodeExecutionData[][] } = {};
  private executionData: any = {};

  constructor(workflow: IWorkflow, executionId: string, userId: number, mode: 'manual' | 'webhook' | 'cron' | 'trigger' = 'manual') {
    super();
    this.workflow = workflow;
    this.executionId = executionId;
    this.userId = userId;
    this.mode = mode;
  }

  /**
   * Executa o workflow completo
   */
  async run(inputData?: INodeExecutionData[]): Promise<any> {
    try {
      this.emit('start', { executionId: this.executionId });

      // Salvar execução no banco
      await ExecutionModel.create({
        workflow_id: this.workflow.id,
        status: 'running',
        execution_data: {
          mode: this.mode,
          startedAt: new Date().toISOString(),
          inputData: inputData || []
        }
      });

      // Encontrar nodes de trigger
      const triggerNodes = this.findTriggerNodes();
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger node found in workflow');
      }

      // Executar a partir dos triggers
      for (const triggerNode of triggerNodes) {
        await this.executeNode(triggerNode, inputData || [{ json: {} }]);
      }

      // Atualizar status da execução
      await ExecutionModel.updateStatus(this.executionId, 'completed', {
        completedAt: new Date().toISOString(),
        runData: this.runData
      });

      this.emit('end', { 
        executionId: this.executionId, 
        success: true,
        data: this.runData 
      });

      return this.runData;

    } catch (error) {
      // Atualizar status da execução como erro
      await ExecutionModel.updateStatus(this.executionId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date().toISOString()
      });

      this.emit('error', { 
        executionId: this.executionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      throw error;
    }
  }

  /**
   * Executa um node específico
   */
  private async executeNode(node: IWorkflowNode, inputData: INodeExecutionData[]): Promise<INodeExecutionData[]> {
    try {
      this.emit('nodeStart', { nodeId: node.id, nodeName: node.name });

      // Criar contexto de execução
      const executionContext = this.createExecutionContext(node, inputData);

      // Executar o node usando o NodeService
      const nodeResult = await NodeService.executeNode(
        node.type,
        inputData,
        node.parameters,
        executionContext
      );

      // Armazenar resultado
      if (!this.runData[node.id]) {
        this.runData[node.id] = [];
      }
      this.runData[node.id].push(nodeResult);

      this.emit('nodeEnd', { 
        nodeId: node.id, 
        nodeName: node.name, 
        data: nodeResult 
      });

      // Executar nodes conectados
      await this.executeConnectedNodes(node, nodeResult);

      return nodeResult;

    } catch (error) {
      this.emit('nodeError', { 
        nodeId: node.id, 
        nodeName: node.name, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Executa nodes conectados ao node atual
   */
  private async executeConnectedNodes(sourceNode: IWorkflowNode, outputData: INodeExecutionData[]): Promise<void> {
    const connections = this.workflow.connections[sourceNode.id];
    
    if (!connections || !connections.main) {
      return;
    }

    // Para cada saída do node
    for (let outputIndex = 0; outputIndex < connections.main.length; outputIndex++) {
      const outputConnections = connections.main[outputIndex];
      
      if (!outputConnections) continue;

      // Para cada conexão dessa saída
      for (const connection of outputConnections) {
        const targetNode = this.workflow.nodes.find(n => n.id === connection.node);
        
        if (!targetNode) {
          console.warn(`Target node ${connection.node} not found`);
          continue;
        }

        // Verificar se todos os inputs necessários estão prontos
        if (await this.areAllInputsReady(targetNode)) {
          const inputData = this.getInputDataForNode(targetNode);
          await this.executeNode(targetNode, inputData);
        }
      }
    }
  }

  /**
   * Verifica se todos os inputs de um node estão prontos
   */
  private async areAllInputsReady(node: IWorkflowNode): Promise<boolean> {
    // Para simplificar, assumimos que está pronto se há dados
    // Em uma implementação completa, verificaríamos todas as conexões de entrada
    return true;
  }

  /**
   * Obtém dados de entrada para um node
   */
  private getInputDataForNode(node: IWorkflowNode): INodeExecutionData[] {
    console.log(`🔧 Getting input data for node: ${node.name} (${node.id})`);
    
    // Encontrar todas as conexões que chegam neste node
    const inputData: INodeExecutionData[] = [];
    
    for (const [sourceNodeId, connections] of Object.entries(this.workflow.connections)) {
      if (connections.main) {
        for (const outputConnections of connections.main) {
          for (const connection of outputConnections) {
            if (connection.node === node.id) {
              console.log(`🔧 Found connection from ${sourceNodeId} to ${node.id}`);
              // Adicionar dados do node de origem
              const sourceData = this.runData[sourceNodeId];
              console.log(`🔧 Source data from ${sourceNodeId}:`, sourceData);
              if (sourceData && sourceData.length > 0) {
                const latestData = sourceData[sourceData.length - 1];
                console.log(`🔧 Adding data from ${sourceNodeId}:`, latestData);
                inputData.push(...latestData);
              }
            }
          }
        }
      }
    }

    const finalInputData = inputData.length > 0 ? inputData : [{ json: {} }];
    console.log(`🔧 Final input data for ${node.name}:`, finalInputData);
    return finalInputData;
  }

  /**
   * Encontra nodes de trigger no workflow
   */
  private findTriggerNodes(): IWorkflowNode[] {
    return this.workflow.nodes.filter(node => {
      try {
        const nodeDefinition = NodeService.getNodeDefinition(node.type);
        return nodeDefinition && nodeDefinition.group.includes('trigger');
      } catch {
        return false;
      }
    });
  }

  /**
   * Cria contexto de execução para um node
   */
  private createExecutionContext(node: IWorkflowNode, inputData: INodeExecutionData[]): IExecutionContext {
    return {
      getNodeParameter: (parameterName: string, itemIndex: number, defaultValue?: any) => {
        return node.parameters[parameterName] !== undefined 
          ? node.parameters[parameterName] 
          : defaultValue;
      },

      getInputData: (inputIndex: number = 0, inputName: string = 'main') => {
        return inputData;
      },

      getCredentials: async (type: string) => {
        try {
          const credentials = await CredentialModel.findByUserIdAndType(this.userId, type);
          return credentials.length > 0 ? credentials[0].credential_data : {};
        } catch (error) {
          console.error('Error loading credentials:', error);
          return {};
        }
      },

      getWorkflowStaticData: (type: string) => {
        return this.executionData[type] || {};
      },

      helpers: {
        request: async (options: any) => {
          // Implementar requisições HTTP
          return { data: 'mock response' };
        },

        httpRequest: async (options: any) => {
          // Implementar requisições HTTP
          return { data: 'mock response' };
        }
      }
    };
  }



  /**
   * Para a execução do workflow
   */
  async stop(): Promise<void> {
    await ExecutionModel.updateStatus(this.executionId, 'cancelled', {
      cancelledAt: new Date().toISOString()
    });

    this.emit('stop', { executionId: this.executionId });
  }
} 