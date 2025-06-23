import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role = 'user' } = req.body;

      // Validações
      if (!name || !email || !password) {
        res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
        return;
      }

      // Verificar se o email já existe
      const existingUser = await this.userService.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'Email já está em uso' });
        return;
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const newUser = await this.userService.createUser({
        name,
        email,
        password: hashedPassword,
        role
      });

      // Remover senha da resposta
      const { password_hash: _, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      const updatedUser = await this.userService.updateUser(parseInt(id), {
        name,
        email,
        role
      });

      if (!updatedUser) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      // Remover senha da resposta
      const { password_hash: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      // Não permitir que o usuário delete a si mesmo
      if (req.user?.id === userId) {
        res.status(400).json({ message: 'Você não pode excluir sua própria conta' });
        return;
      }

      const deleted = await this.userService.deleteUser(userId);
      
      if (!deleted) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
} 