import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware para validar requisições usando express-validator
 * Verifica se há erros de validação e retorna uma resposta de erro se houver
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
  }
  
  return next();
};

/**
 * Middleware para validar se o usuário é proprietário do recurso
 * Usado em rotas que requerem verificação de propriedade
 */
export const validateOwnership = (resourceUserIdField: string = 'user_id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    if (resourceUserId && parseInt(resourceUserId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você não tem permissão para acessar este recurso'
      });
    }
    
    return next();
  };
};

/**
 * Middleware para validar se o usuário tem permissão de admin
 * Usado em rotas que requerem privilégios administrativos
 */
export const validateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado: privilégios de administrador necessários'
    });
  }
  
  return next();
};

/**
 * Middleware para validar paginação
 * Garante que os parâmetros de paginação estão dentro de limites aceitáveis
 */
export const validatePagination = (maxLimit: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (limit > maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Limite máximo de ${maxLimit} itens por página`
      });
    }
    
    if (limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Limite deve ser maior que 0'
      });
    }
    
    if (offset < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset deve ser maior ou igual a 0'
      });
    }
    
    // Adicionar valores validados ao request
    req.pagination = {
      limit,
      offset
    };
    
    return next();
  };
};

/**
 * Middleware para validar JSON
 * Verifica se o corpo da requisição é um JSON válido
 */
export const validateJSON = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type deve ser application/json'
      });
    }
  }
  
  return next();
};

/**
 * Middleware para validar IDs numéricos
 * Usado para validar parâmetros de rota que devem ser números
 */
export const validateNumericId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: `${paramName} deve ser um número válido`
      });
    }
    
    return next();
  };
};

/**
 * Middleware para validar datas
 * Verifica se as datas fornecidas são válidas
 */
export const validateDateRange = (startDateField: string = 'start_date', endDateField: string = 'end_date') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startDate = req.query[startDateField] || req.body[startDateField];
    const endDate = req.query[endDateField] || req.body[endDateField];
    
    if (startDate && !isValidDate(startDate as string)) {
      return res.status(400).json({
        success: false,
        message: `${startDateField} deve ser uma data válida (ISO 8601)`
      });
    }
    
    if (endDate && !isValidDate(endDate as string)) {
      return res.status(400).json({
        success: false,
        message: `${endDateField} deve ser uma data válida (ISO 8601)`
      });
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Data de início deve ser anterior à data de fim'
        });
      }
    }
    
    return next();
  };
};

/**
 * Função auxiliar para validar se uma string é uma data válida
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Middleware para sanitizar entrada
 * Remove caracteres potencialmente perigosos
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Função recursiva para sanitizar objetos
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove scripts e tags HTML básicas
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitizar body, query e params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

// Estender interface Request para incluir pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        limit: number;
        offset: number;
      };
    }
  }
}