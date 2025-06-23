import express from 'express';
import { executionController } from '../controllers/executionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Rotas específicas primeiro (antes das rotas com parâmetros dinâmicos)
// GET /api/executions/stats - Estatísticas de execução
router.get('/stats', executionController.getExecutionStats);

// GET /api/executions/running - Execuções em andamento
router.get('/running', executionController.getRunningExecutions);

// POST /api/executions/workflows/:workflowId/run - Executar workflow
router.post('/workflows/:workflowId/run', executionController.executeWorkflow);

// GET /api/executions/workflows/:workflowId - Listar execuções de um workflow
router.get('/workflows/:workflowId', executionController.getWorkflowExecutions);

// GET /api/executions/workflow/:workflowId - Rota alternativa para listar execuções
router.get('/workflow/:workflowId', executionController.getWorkflowExecutions);

// Rotas com parâmetros dinâmicos por último
// GET /api/executions/:executionId - Obter detalhes de uma execução
router.get('/:executionId', executionController.getExecution);

// POST /api/executions/:executionId/stop - Parar execução
router.post('/:executionId/stop', executionController.stopExecution);

// DELETE /api/executions/:executionId - Excluir execução
router.delete('/:executionId', executionController.deleteExecution);

export default router; 