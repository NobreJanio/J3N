import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/login - Login do usuário
router.post('/login', authController.login);

// POST /api/auth/logout - Logout do usuário
router.post('/logout', authController.logout);

// GET /api/auth/verify - Verificar se o token é válido
router.get('/verify', authenticateToken, authController.verifyToken);

// GET /api/auth/me - Obter dados do usuário atual
router.get('/me', authenticateToken, authController.getCurrentUser);

// POST /api/auth/change-password - Alterar senha do usuário
router.post('/change-password', authenticateToken, authController.changePassword);

export default router; 