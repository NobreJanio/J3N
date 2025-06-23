import { Request, Response } from 'express';
import { WorkflowModel, CreateWorkflowData, UpdateWorkflowData } from '../models/Workflow';



export class WorkflowController {
  // Listar todos os workflows do usuário
  static async getWorkflows(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const workflows = await WorkflowModel.findByUserId(userId);
      return res.json(workflows);
    } catch (error) {
      console.error('Erro ao buscar workflows:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar workflow específico
  static async getWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const workflow = await WorkflowModel.findById(parseInt(id));
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      // Verificar se o workflow pertence ao usuário
      if (workflow.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      return res.json(workflow);
    } catch (error) {
      console.error('Erro ao buscar workflow:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar novo workflow
  static async createWorkflow(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { name, description, is_active, workflow_data } = req.body;

      if (!name || !workflow_data) {
        return res.status(400).json({ error: 'Nome e dados do workflow são obrigatórios' });
      }

      const workflowData: CreateWorkflowData = {
        name,
        description,
        is_active: is_active ?? true,
        user_id: userId,
        workflow_data
      };

      const workflow = await WorkflowModel.create(workflowData);
      return res.status(201).json(workflow);
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar workflow
  static async updateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o workflow existe e pertence ao usuário
      const existingWorkflow = await WorkflowModel.findById(parseInt(id));
      if (!existingWorkflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      if (existingWorkflow.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { name, description, is_active, workflow_data } = req.body;

      const updateData: UpdateWorkflowData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (workflow_data !== undefined) updateData.workflow_data = workflow_data;

      const workflow = await WorkflowModel.update(parseInt(id), updateData);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      return res.json(workflow);
    } catch (error) {
      console.error('Erro ao atualizar workflow:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Deletar workflow
  static async deleteWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o workflow existe e pertence ao usuário
      const existingWorkflow = await WorkflowModel.findById(parseInt(id));
      if (!existingWorkflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      if (existingWorkflow.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const deleted = await WorkflowModel.delete(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      return res.json({ message: 'Workflow deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Alternar status ativo/inativo
  static async toggleWorkflowActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o workflow existe e pertence ao usuário
      const existingWorkflow = await WorkflowModel.findById(parseInt(id));
      if (!existingWorkflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      if (existingWorkflow.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const workflow = await WorkflowModel.toggleActive(parseInt(id));
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      return res.json(workflow);
    } catch (error) {
      console.error('Erro ao alternar status do workflow:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Duplicar workflow
  static async duplicateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!name) {
        return res.status(400).json({ error: 'Nome para o workflow duplicado é obrigatório' });
      }

      // Verificar se o workflow existe e pertence ao usuário
      const existingWorkflow = await WorkflowModel.findById(parseInt(id));
      if (!existingWorkflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      if (existingWorkflow.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const duplicatedWorkflow = await WorkflowModel.duplicate(parseInt(id), name);
      
      if (!duplicatedWorkflow) {
        return res.status(500).json({ error: 'Erro ao duplicar workflow' });
      }

      return res.status(201).json(duplicatedWorkflow);
    } catch (error) {
      console.error('Erro ao duplicar workflow:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}