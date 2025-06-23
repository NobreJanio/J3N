import { Request, Response } from 'express';
import { NodeService } from '../services/NodeService';



interface NodeExecutionRequest {
  nodeType: string;
  parameters: { [key: string]: any };
  inputData?: any[];
}

export class NodeController {
  /**
   * Executa um node individual
   */
  static async executeNode(req: Request, res: Response): Promise<void> {
    try {
      const { nodeType, parameters, inputData = [] } = req.body as NodeExecutionRequest;
      
      if (!nodeType) {
        res.status(400).json({
          success: false,
          error: 'Node type is required'
        });
        return;
      }

      // Executar node usando NodeService
      console.log(`🔧 Executing node: ${nodeType} with parameters:`, parameters);
      const result = await NodeService.executeNode(nodeType, inputData, parameters);
      console.log(`✅ Node execution result:`, result);
      
      res.json({
        success: true,
        data: result[0]?.json || result, // Pegar o primeiro item do array ou o resultado direto
        nodeType,
        executedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao executar node:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor ao executar node'
      });
    }
  }



  /**
   * Lista todos os tipos de nodes disponíveis
   */
  static async getAvailableNodes(req: Request, res: Response) {
    try {
      // Obter nodes disponíveis do NodeService
      const nodeTypes = NodeService.getAvailableNodeTypes();
      const availableNodes = nodeTypes.map(nodeType => {
        const definition = NodeService.getNodeDefinition(nodeType);
        return {
          type: nodeType,
          displayName: definition?.displayName || nodeType,
          description: definition?.description || '',
          group: definition?.group[0] || 'other',
          icon: definition?.icon || 'default',
        };
      });

      res.json({
        success: true,
        data: availableNodes
      });
    } catch (error) {
      console.error('Erro ao buscar nodes disponíveis:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém a definição de um node específico
   */
  static async getNodeDefinition(req: Request, res: Response): Promise<void> {
    try {
      const { nodeType } = req.params;
      
      if (!nodeType) {
        res.status(400).json({
          success: false,
          error: 'Node type is required'
        });
        return;
      }

      // Obter definição do node usando NodeService
      const definition = NodeService.getNodeDefinition(nodeType);
      
      if (!definition) {
        res.status(404).json({
          success: false,
          error: 'Node type not found'
        });
        return;
      }

      res.json({
        success: true,
        data: definition
      });
    } catch (error) {
      console.error('Erro ao buscar definição do node:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

 