import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { WorkflowTemplateModel, TemplateRatingModel, TemplateUtils, WorkflowTemplate } from '../models/Templates';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import { pool } from '../config/database';

const router = express.Router();

// ========================================
// ROTAS PARA TEMPLATES
// ========================================

/**
 * GET /api/templates
 * Listar templates disponíveis
 */
router.get('/', [
  query('category').optional().isString().withMessage('Categoria deve ser uma string'),
  query('tags').optional().isString().withMessage('Tags devem ser uma string'),
  query('search').optional().isString().withMessage('Busca deve ser uma string'),
  query('sort').optional().isIn(['name', 'created_at', 'usage_count', 'rating']).withMessage('Ordenação inválida'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Ordem deve ser asc ou desc'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const category = req.query.category as string;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const search = req.query.search as string;
    const sort = (req.query.sort as string) || 'created_at';
    const order = (req.query.order as string) || 'desc';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const templates = await WorkflowTemplateModel.findAll({
      category,
      tags,
      search_term: search
    }, limit, offset);
    
    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/my
 * Listar templates do usuário
 */
router.get('/my', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const templates = await WorkflowTemplateModel.findByAuthor(userId);
    
    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erro ao buscar templates do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/featured
 * Listar templates em destaque
 */
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite deve ser entre 1 e 50'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const templates = await WorkflowTemplateModel.findFeatured(limit);
    
    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erro ao buscar templates em destaque:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/popular
 * Listar templates populares
 */
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite deve ser entre 1 e 50'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Dias deve ser entre 1 e 365'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 30;
    
    const templates = await WorkflowTemplateModel.findPopular(limit);
    
    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erro ao buscar templates populares:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/:id
 * Obter template específico
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const template = await WorkflowTemplateModel.findById(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates
 * Criar novo template
 */
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('workflow_data').isObject().withMessage('Dados do workflow são obrigatórios'),
  body('category').notEmpty().withMessage('Categoria é obrigatória'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  body('variables').optional().isArray().withMessage('Variáveis devem ser um array'),
  body('instructions').optional().isString().withMessage('Instruções devem ser uma string'),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Nível de dificuldade inválido'),
  body('estimated_time_minutes').optional().isInt({ min: 1 }).withMessage('Tempo estimado deve ser um número positivo'),
  body('is_public').optional().isBoolean().withMessage('Is public deve ser um boolean'),
  body('is_featured').optional().isBoolean().withMessage('Is featured deve ser um boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    
    // Validar dados do workflow
    if (!req.body.workflow_data || typeof req.body.workflow_data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Dados do workflow inválidos'
      });
    }
    
    // Validar variáveis se fornecidas
    if (req.body.variables) {
      if (!Array.isArray(req.body.variables)) {
        return res.status(400).json({
          success: false,
          message: 'Variáveis devem ser um array'
        });
      }
    }
    
    // Gerar preview
    const preview = TemplateUtils.generatePreview(req.body.workflow_data);
    
    const templateData = {
      ...req.body,
      user_id: userId,
      preview_data: preview,
      is_public: req.body.is_public !== false, // Default true
      is_featured: req.body.is_featured || false,
      usage_count: 0,
      rating: 0,
      rating_count: 0
    };
    
    const template = await WorkflowTemplateModel.create(templateData);
    
    return res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/templates/:id
 * Atualizar template
 */
router.put('/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('description').optional().notEmpty().withMessage('Descrição não pode estar vazia'),
  body('workflow_data').optional().isObject().withMessage('Dados do workflow devem ser um objeto'),
  body('category').optional().notEmpty().withMessage('Categoria não pode estar vazia'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  body('variables').optional().isArray().withMessage('Variáveis devem ser um array'),
  body('instructions').optional().isString().withMessage('Instruções devem ser uma string'),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Nível de dificuldade inválido'),
  body('estimated_time_minutes').optional().isInt({ min: 1 }).withMessage('Tempo estimado deve ser um número positivo'),
  body('is_public').optional().isBoolean().withMessage('Is public deve ser um boolean'),
  body('is_featured').optional().isBoolean().withMessage('Is featured deve ser um boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Verificar se template existe e pertence ao usuário
    const existingTemplate = await WorkflowTemplateModel.findById(templateId);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    if (existingTemplate.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    // Validar dados do workflow se fornecidos
    if (req.body.workflow_data && typeof req.body.workflow_data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Dados do workflow inválidos'
      });
    }
    
    // Validar variáveis se fornecidas
    if (req.body.variables) {
      // Validação simples de variáveis
      const variableValidation = Array.isArray(req.body.variables) ? { valid: true } : { valid: false, message: 'Variables deve ser um array' };
      if (!variableValidation.valid) {
        return res.status(400).json({
          success: false,
          message: variableValidation.message || 'Variáveis inválidas'
        });
      }
    }
    
    // Atualizar preview se workflow_data foi alterado
    const updateData = { ...req.body };
    if (req.body.workflow_data) {
      updateData.preview_data = TemplateUtils.generatePreview(req.body.workflow_data);
    }
    
    const template = await WorkflowTemplateModel.update(templateId, updateData);
    
    return res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/templates/:id
 * Deletar template
 */
router.delete('/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Verificar se template existe e pertence ao usuário
    const existingTemplate = await WorkflowTemplateModel.findById(templateId);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    if (existingTemplate.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const deleted = await WorkflowTemplateModel.delete(templateId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    return res.json({
      success: true,
      message: 'Template deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/:id/use
 * Usar template (incrementar contador de uso)
 */
router.post('/:id/use', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('variables').optional().isObject().withMessage('Variáveis devem ser um objeto'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const variables = req.body.variables || {};
    
    const template = await WorkflowTemplateModel.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    // Incrementar contador de uso
    await WorkflowTemplateModel.incrementUsage(templateId);
    
    // Aplicar variáveis ao workflow
    const workflowData = TemplateUtils.replaceVariables(template.workflow_data, variables);
    
    return res.json({
      success: true,
      data: {
        template_id: templateId,
        workflow_data: workflowData,
        applied_variables: variables
      }
    });
  } catch (error) {
    console.error('Erro ao usar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/:id/clone
 * Clonar template
 */
router.post('/:id/clone', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('description').optional().notEmpty().withMessage('Descrição não pode estar vazia'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const originalTemplate = await WorkflowTemplateModel.findById(templateId);
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    // Criar clone
    const cloneData = {
      name: req.body.name || `${originalTemplate.name} (Cópia)`,
      description: req.body.description || originalTemplate.description,
      category: originalTemplate.category,
      workflow_data: originalTemplate.workflow_data,
      tags: originalTemplate.tags,
      difficulty_level: originalTemplate.difficulty_level,
      estimated_time_minutes: originalTemplate.estimated_time_minutes,
      preview_image: originalTemplate.preview_image,
      author_id: userId,
      is_public: originalTemplate.is_public,
      required_integrations: originalTemplate.required_integrations,
      required_credentials: originalTemplate.required_credentials,
      variables: originalTemplate.variables,
      instructions: originalTemplate.instructions
    };
    
    const clonedTemplate = await WorkflowTemplateModel.create(cloneData);
    
    return res.status(201).json({
      success: true,
      data: clonedTemplate
    });
  } catch (error) {
    console.error('Erro ao clonar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA AVALIAÇÕES
// ========================================

/**
 * GET /api/templates/:id/ratings
 * Listar avaliações do template
 */
router.get('/:id/ratings', [
  param('id').isInt().withMessage('ID deve ser um número'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const ratings = await TemplateRatingModel.findByTemplateId(templateId, limit);
    
    return res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/:id/ratings
 * Criar avaliação do template
 */
router.post('/:id/ratings', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Avaliação deve ser entre 1 e 5'),
  body('comment').optional().isString().withMessage('Comentário deve ser uma string'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Verificar se template existe
    const template = await WorkflowTemplateModel.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }
    
    // Verificar se usuário já avaliou
    const existingRating = await TemplateRatingModel.findUserRating(templateId, userId);
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Você já avaliou este template'
      });
    }
    
    const ratingData = {
      template_id: templateId,
      user_id: userId,
      rating: req.body.rating,
      comment: req.body.comment
    };
    
    const rating = await TemplateRatingModel.create(
      ratingData.template_id,
      ratingData.user_id,
      ratingData.rating,
      ratingData.comment
    );
    
    // Atualizar rating médio do template
    await WorkflowTemplateModel.updateRating(templateId);
    
    return res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/templates/:id/ratings/:ratingId
 * Atualizar avaliação
 */
router.put('/:id/ratings/:ratingId', [
  authenticateToken,
  param('id').isInt().withMessage('ID do template deve ser um número'),
  param('ratingId').isInt().withMessage('ID da avaliação deve ser um número'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Avaliação deve ser entre 1 e 5'),
  body('comment').optional().isString().withMessage('Comentário deve ser uma string'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const ratingId = parseInt(req.params.ratingId);
    const userId = req.user!.id;
    
    // Verificar se avaliação existe e pertence ao usuário
    const existingQuery = 'SELECT * FROM template_ratings WHERE id = $1 AND user_id = $2 AND template_id = $3';
    const existingResult = await pool.query(existingQuery, [ratingId, userId, templateId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Avaliação não encontrada'
      });
    }
    
    // Atualizar avaliação usando create (que faz upsert)
    const rating = await TemplateRatingModel.create(
      templateId, 
      userId, 
      req.body.rating || existingResult.rows[0].rating,
      req.body.comment || existingResult.rows[0].review
    );
    
    // Atualizar rating médio do template
    await WorkflowTemplateModel.updateRating(templateId);
    
    return res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/templates/:id/ratings/:ratingId
 * Deletar avaliação
 */
router.delete('/:id/ratings/:ratingId', [
  authenticateToken,
  param('id').isInt().withMessage('ID do template deve ser um número'),
  param('ratingId').isInt().withMessage('ID da avaliação deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const templateId = parseInt(req.params.id);
    const ratingId = parseInt(req.params.ratingId);
    const userId = req.user!.id;
    
    // Verificar se avaliação existe e pertence ao usuário
    const existingQuery = 'SELECT * FROM template_ratings WHERE id = $1 AND user_id = $2 AND template_id = $3';
    const existingResult = await pool.query(existingQuery, [ratingId, userId, templateId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Avaliação não encontrada'
      });
    }
    
    const deleted = await TemplateRatingModel.delete(ratingId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Avaliação não encontrada'
      });
    }
    
    // Atualizar rating médio do template
    await WorkflowTemplateModel.updateRating(templateId);
    
    return res.json({
      success: true,
      message: 'Avaliação deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA CATEGORIAS E UTILITÁRIOS
// ========================================

/**
 * GET /api/templates/categories
 * Listar categorias disponíveis
 */
router.get('/categories', async (req: any, res: any) => {
  try {
    const categories = TemplateUtils.getDefaultCategories();
    
    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/tags/suggestions
 * Obter sugestões de tags
 */
router.get('/tags/suggestions', [
  query('category').optional().isString().withMessage('Categoria deve ser uma string'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const category = req.query.category as string;
    const suggestions = TemplateUtils.getSuggestedTags();
    
    return res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Erro ao buscar sugestões de tags:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/validate
 * Validar dados do template
 */
router.post('/validate', [
  authenticateToken,
  body('workflow_data').isObject().withMessage('Dados do workflow são obrigatórios'),
  body('variables').optional().isArray().withMessage('Variáveis devem ser um array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    // Validação básica dos dados do workflow
    const workflowValidation = { valid: true, errors: [] as string[] };
    if (!req.body.workflow_data || typeof req.body.workflow_data !== 'object') {
      workflowValidation.valid = false;
      workflowValidation.errors.push('workflow_data is required and must be an object');
    }
    
    // Validação básica das variáveis
    let variableValidation = { valid: true, errors: [] as string[] };
    if (req.body.variables && !Array.isArray(req.body.variables)) {
      variableValidation.valid = false;
      variableValidation.errors.push('variables must be an array');
    }
    
    const isValid = workflowValidation.valid && variableValidation.valid;
    const errors = [...workflowValidation.errors, ...variableValidation.errors];
    
    return res.json({
      success: true,
      data: {
        valid: isValid,
        errors,
        workflow_validation: workflowValidation,
        variable_validation: variableValidation
      }
    });
  } catch (error) {
    console.error('Erro ao validar template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/preview
 * Gerar preview do template
 */
router.post('/preview', [
  authenticateToken,
  body('workflow_data').isObject().withMessage('Dados do workflow são obrigatórios'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const preview = TemplateUtils.generatePreview(req.body.workflow_data);
    
    return res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Erro ao gerar preview:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;