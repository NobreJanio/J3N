import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar todos os usuários
router.get('/', userController.getAllUsers);

// Criar novo usuário
router.post('/', userController.createUser);

// Atualizar usuário
router.put('/:id', userController.updateUser);

// Excluir usuário
router.delete('/:id', userController.deleteUser);

export default router; 