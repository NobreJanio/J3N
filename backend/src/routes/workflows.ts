import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// GET /api/workflows - Listar todos os workflows do usuário
router.get('/', WorkflowController.getWorkflows);

// GET /api/workflows/:id - Buscar workflow específico
router.get('/:id', WorkflowController.getWorkflow);

// POST /api/workflows - Criar novo workflow
router.post('/', WorkflowController.createWorkflow);

// PUT /api/workflows/:id - Atualizar workflow
router.put('/:id', WorkflowController.updateWorkflow);

// DELETE /api/workflows/:id - Deletar workflow
router.delete('/:id', WorkflowController.deleteWorkflow);

// PATCH /api/workflows/:id/toggle - Alternar status ativo/inativo
router.patch('/:id/toggle', WorkflowController.toggleWorkflowActive);

// POST /api/workflows/:id/duplicate - Duplicar workflow
router.post('/:id/duplicate', WorkflowController.duplicateWorkflow);

export default router; 