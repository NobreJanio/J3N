import { Router } from 'express';
import { NodeController } from '../controllers/nodeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticateToken);

// Rotas para nodes
router.post('/execute', NodeController.executeNode);
router.get('/available', NodeController.getAvailableNodes);
router.get('/definition/:nodeType', NodeController.getNodeDefinition);

export default router; 