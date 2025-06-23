import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'Configuração JWT não encontrada'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Busca o usuário no banco para garantir que ainda existe
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
      return;
    }

    // Adiciona os dados do usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user', // Valor padrão
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }

    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const generateToken = (userId: number): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não configurado');
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: '7d' }
  );
};