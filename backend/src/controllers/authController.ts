import { Request, Response } from 'express';
import { UserModel, LoginData } from '../models/User';
import { generateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

export const authController = {
  // Login do usuário
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginData = req.body;

      // Validação básica
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
        return;
      }

      // Busca o usuário pelo email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
        return;
      }

      // Valida a senha
      const isValidPassword = await UserModel.validatePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
        return;
      }

      // Gera o token JWT
      const token = generateToken(user.id);

      // Retorna os dados do usuário (sem a senha) e o token
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Verificar se o token é válido
  async verifyToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Se chegou até aqui, o token é válido (middleware já validou)
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Logout (invalidar token no frontend)
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Como estamos usando JWT stateless, o logout é feito no frontend
      // removendo o token do localStorage/sessionStorage
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Obter dados do usuário atual
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      // Busca dados completos do usuário
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Alterar senha do usuário
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validações
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias'
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'A nova senha deve ter pelo menos 6 caracteres'
        });
        return;
      }

      // Busca o usuário
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Valida a senha atual
      const isValidPassword = await UserModel.validatePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
        return;
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Atualiza a senha no banco
      await UserModel.updatePassword(req.user.id, hashedNewPassword);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}; 