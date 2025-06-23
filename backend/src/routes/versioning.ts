import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { WorkflowVersionModel, VersionComparisonModel, VersioningUtils } from '../models/Versioning';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import { pool } from '../config/database';

const router = express.Router();

// ========================================
// ROTAS PARA VERSÕES DE WORKFLOW
// ========================================

/**
 * GET /api/versioning/workflows/:workflowId/versions
 * Listar versões de um workflow
 */
router.get('/workflows/:workflowId/versions', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  query('branch').optional().isString().withMessage('Branch deve ser uma string'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const branch = req.query.branch as string;
    
    const versions = await WorkflowVersionModel.findByWorkflowId(workflowId, limit);
    
    return res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Erro ao buscar versões:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/versioning/versions/:id
 * Obter versão específica
 */
router.get('/versions/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const versionId = parseInt(req.params.id);
    const version = await WorkflowVersionModel.findById(versionId);
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Erro ao buscar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/workflows/:workflowId/versions
 * Criar nova versão do workflow
 */
router.post('/workflows/:workflowId/versions', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  body('workflow_data').isObject().withMessage('Dados do workflow são obrigatórios'),
  body('version_number').optional().isString().withMessage('Número da versão deve ser uma string'),
  body('description').optional().isString().withMessage('Descrição deve ser uma string'),
  body('changelog').optional().isString().withMessage('Changelog deve ser uma string'),
  body('branch').optional().isString().withMessage('Branch deve ser uma string'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  body('is_major_change').optional().isBoolean().withMessage('Is major change deve ser um boolean'),
  body('is_breaking_change').optional().isBoolean().withMessage('Is breaking change deve ser um boolean'),
  body('auto_publish').optional().isBoolean().withMessage('Auto publish deve ser um boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const userId = req.user!.id;
    
    // Gerar número da versão se não fornecido
    let versionNumber = req.body.version_number;
    if (!versionNumber) {
      const allVersions = await WorkflowVersionModel.findByWorkflowId(workflowId);
      const lastVersion = allVersions.find(v => v.tags?.includes(`branch-${req.body.branch}`)) || allVersions[0];
      versionNumber = VersioningUtils.incrementVersion(
        lastVersion?.version_number || '0.0.0',
        req.body.is_major_change ? 'major' : req.body.is_breaking_change ? 'minor' : 'patch'
      );
    }
    
    // Validar número da versão
    if (!VersioningUtils.validateVersionNumber(versionNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Número da versão inválido'
      });
    }
    
    // Gerar tags automáticas se não fornecidas
    let tags = req.body.tags || [];
    if (tags.length === 0) {
      if (req.body.is_breaking_change) tags.push('breaking-change');
      if (req.body.is_major_change) tags.push('major');
      if (req.body.workflow_data) tags.push('workflow-update');
    }
    
    const versionData = {
      workflow_id: workflowId,
      user_id: userId,
      created_by: userId,
      version_number: versionNumber,
      workflow_data: req.body.workflow_data,
      description: req.body.description,
      changelog: req.body.changelog,
      branch: req.body.branch || 'main',
      tags,
      is_major_change: req.body.is_major_change || false,
      is_breaking_change: req.body.is_breaking_change || false,
      is_published: req.body.auto_publish || false,
      is_current: false // Será definido após criação se auto_publish for true
    };
    
    const version = await WorkflowVersionModel.create(versionData);
    
    // Publicar automaticamente se solicitado
    if (req.body.auto_publish) {
      const publishQuery = `
        UPDATE workflow_versions 
        SET is_published = true, updated_at = NOW() 
        WHERE id = $1
      `;
      await pool.query(publishQuery, [version.id]);
      version.is_published = true;
    }
    
    return res.status(201).json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Erro ao criar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/versioning/versions/:id
 * Atualizar versão
 */
router.put('/versions/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('description').optional().isString().withMessage('Descrição deve ser uma string'),
  body('changelog').optional().isString().withMessage('Changelog deve ser uma string'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const versionId = parseInt(req.params.id);
    
    // Verificar se versão existe
    const existingVersion = await WorkflowVersionModel.findById(versionId);
    if (!existingVersion) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada'
      });
    }
    
    // Não permitir edição de versões publicadas (apenas metadados)
    if (existingVersion.is_published && req.body.workflow_data) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível alterar dados de versões publicadas'
      });
    }
    
    const version = await WorkflowVersionModel.update(versionId, req.body);
    
    return res.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Erro ao atualizar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/versioning/versions/:id
 * Deletar versão
 */
router.delete('/versions/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const versionId = parseInt(req.params.id);
    
    // Verificar se versão existe
    const existingVersion = await WorkflowVersionModel.findById(versionId);
    if (!existingVersion) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada'
      });
    }
    
    // Não permitir deletar versão atual ou publicada
    if (existingVersion.is_current) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar a versão atual'
      });
    }
    
    if (existingVersion.is_published) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar versões publicadas'
      });
    }
    
    const deleted = await WorkflowVersionModel.delete(versionId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada'
      });
    }
    
    return res.json({
      success: true,
      message: 'Versão deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/versions/:id/publish
 * Publicar versão
 */
router.post('/versions/:id/publish', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const versionId = parseInt(req.params.id);
    
    // Publicar versão
    const publishQuery = `
      UPDATE workflow_versions 
      SET is_published = true, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(publishQuery, [versionId]);
    const version = result.rows[0];
    
    if (version) {
      version.workflow_data = JSON.parse(version.workflow_data);
      version.change_summary = JSON.parse(version.change_summary);
      version.breaking_changes = JSON.parse(version.breaking_changes);
      version.tags = JSON.parse(version.tags);
    }
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Erro ao publicar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/versions/:id/unpublish
 * Despublicar versão
 */
router.post('/versions/:id/unpublish', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const versionId = parseInt(req.params.id);
    
    // Despublicar versão
    const updateQuery = `
      UPDATE workflow_versions 
      SET is_published = false, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [versionId]);
    const version = result.rows[0];
    
    if (version) {
      version.workflow_data = JSON.parse(version.workflow_data);
      version.change_summary = JSON.parse(version.change_summary);
      version.breaking_changes = JSON.parse(version.breaking_changes);
      version.tags = JSON.parse(version.tags);
    }
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Erro ao despublicar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/workflows/:workflowId/rollback/:versionId
 * Fazer rollback para uma versão específica
 */
router.post('/workflows/:workflowId/rollback/:versionId', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  param('versionId').isInt().withMessage('ID da versão deve ser um número'),
  body('create_backup').optional().isBoolean().withMessage('Create backup deve ser um boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const versionId = parseInt(req.params.versionId);
    const createBackup = req.body.create_backup !== false; // Default true
    
    const result = await WorkflowVersionModel.rollbackToVersion(workflowId, versionId, req.user!.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada ou rollback não foi possível'
      });
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao fazer rollback:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA COMPARAÇÃO DE VERSÕES
// ========================================

/**
 * POST /api/versioning/compare
 * Comparar duas versões
 */
router.post('/compare', [
  authenticateToken,
  body('version1_id').isInt().withMessage('ID da versão 1 deve ser um número'),
  body('version2_id').isInt().withMessage('ID da versão 2 deve ser um número'),
  body('comparison_type').optional().isIn(['full', 'summary', 'nodes_only', 'edges_only']).withMessage('Tipo de comparação inválido'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const version1Id = parseInt(req.body.version1_id);
    const version2Id = parseInt(req.body.version2_id);
    const comparisonType = req.body.comparison_type || 'full';
    
    // Buscar versões
    const [version1, version2] = await Promise.all([
      WorkflowVersionModel.findById(version1Id),
      WorkflowVersionModel.findById(version2Id)
    ]);
    
    if (!version1 || !version2) {
      return res.status(404).json({
        success: false,
        message: 'Uma ou ambas as versões não foram encontradas'
      });
    }
    
    // Verificar se as versões pertencem ao mesmo workflow
    if (version1.workflow_id !== version2.workflow_id) {
      return res.status(400).json({
        success: false,
        message: 'As versões devem pertencer ao mesmo workflow'
      });
    }
    
    // Criar comparação
    const comparison = await VersionComparisonModel.create(
      version1.workflow_id,
      version1Id,
      version2Id,
      req.user!.id
    );
    
    return res.status(201).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Erro ao comparar versões:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/versioning/comparisons/:id
 * Obter comparação específica
 */
router.get('/comparisons/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const comparisonId = parseInt(req.params.id);
    const comparison = await VersionComparisonModel.findById(comparisonId);
    
    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Comparação não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Erro ao buscar comparação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/versioning/workflows/:workflowId/comparisons
 * Listar comparações de um workflow
 */
router.get('/workflows/:workflowId/comparisons', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const comparisons = await VersionComparisonModel.findByWorkflowId(workflowId, limit);
    
    return res.json({
      success: true,
      data: comparisons
    });
  } catch (error) {
    console.error('Erro ao buscar comparações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA BRANCHES
// ========================================

/**
 * GET /api/versioning/workflows/:workflowId/branches
 * Listar branches de um workflow
 */
router.get('/workflows/:workflowId/branches', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const versions = await WorkflowVersionModel.findByWorkflowId(workflowId, 1000);
    const branches = versions.reduce((acc: any[], version: any) => {
      const existingBranch = acc.find((b: any) => b.name === (version.branch || 'main'));
      if (!existingBranch) {
        acc.push({
          name: version.branch || 'main',
          version_count: 1,
          latest_version: version.version_number
        });
      } else {
        existingBranch.version_count++;
      }
      return acc;
    }, []);
    
    return res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('Erro ao buscar branches:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/workflows/:workflowId/branches
 * Criar nova branch
 */
router.post('/workflows/:workflowId/branches', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  body('name').notEmpty().withMessage('Nome da branch é obrigatório'),
  body('source_version_id').optional().isInt().withMessage('ID da versão fonte deve ser um número'),
  body('description').optional().isString().withMessage('Descrição deve ser uma string'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const userId = req.user!.id;
    
    // Verificar se branch já existe
    const versions = await WorkflowVersionModel.findByWorkflowId(workflowId, 1000);
    const existingBranches = versions.reduce((acc: any[], version: any) => {
      const branchName = version.branch || 'main';
      if (!acc.find((b: any) => b.name === branchName)) {
        acc.push({ name: branchName });
      }
      return acc;
    }, []);
    if (existingBranches.some((b: any) => b.name === req.body.name)) {
      return res.status(400).json({
        success: false,
        message: 'Branch já existe'
      });
    }
    
    // Buscar versão fonte (ou usar a atual)
    let sourceVersion;
    if (req.body.source_version_id) {
      sourceVersion = await WorkflowVersionModel.findById(req.body.source_version_id);
    } else {
      const versions = await WorkflowVersionModel.findByWorkflowId(workflowId);
      sourceVersion = versions.find(v => v.is_current);
    }
    
    if (!sourceVersion) {
      return res.status(404).json({
        success: false,
        message: 'Versão fonte não encontrada'
      });
    }
    
    // Criar primeira versão da nova branch
    const versionData = {
      workflow_id: workflowId,
      user_id: userId,
      created_by: userId,
      version_number: '1.0.0',
      workflow_data: sourceVersion.workflow_data,
      description: req.body.description || `Branch criada a partir da versão ${sourceVersion.version_number}`,
      changelog: `Criação da branch ${req.body.name}`,
      branch: req.body.name,
      tags: ['branch-creation'],
      is_major_change: false,
      is_breaking_change: false,
      is_published: false,
      is_current: false
    };
    
    const version = await WorkflowVersionModel.create(versionData);
    
    return res.status(201).json({
      success: true,
      data: {
        branch: req.body.name,
        initial_version: version
      }
    });
  } catch (error) {
    console.error('Erro ao criar branch:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/workflows/:workflowId/merge
 * Fazer merge de branches
 */
router.post('/workflows/:workflowId/merge', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  body('source_branch').notEmpty().withMessage('Branch fonte é obrigatória'),
  body('target_branch').notEmpty().withMessage('Branch destino é obrigatória'),
  body('merge_strategy').optional().isIn(['auto', 'manual', 'theirs', 'ours']).withMessage('Estratégia de merge inválida'),
  body('description').optional().isString().withMessage('Descrição deve ser uma string'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const userId = req.user!.id;
    const sourceBranch = req.body.source_branch;
    const targetBranch = req.body.target_branch;
    const mergeStrategy = req.body.merge_strategy || 'auto';
    
    // Buscar últimas versões de cada branch
    const allVersions = await WorkflowVersionModel.findByWorkflowId(workflowId);
    const sourceVersion = allVersions.find(v => v.tags?.includes(`branch-${sourceBranch}`)) || allVersions[0];
    const targetVersion = allVersions.find(v => v.tags?.includes(`branch-${targetBranch}`)) || allVersions[0];
    
    if (!sourceVersion || !targetVersion) {
      return res.status(404).json({
        success: false,
        message: 'Uma ou ambas as branches não foram encontradas'
      });
    }
    
    // Verificar compatibilidade
    const compatibility = VersioningUtils.calculateCompatibility(
      sourceVersion.version_number,
      targetVersion.version_number
    );
    
    // Simular merge (implementação simplificada)
    let mergedData;
    switch (mergeStrategy) {
      case 'theirs':
        mergedData = sourceVersion.workflow_data;
        break;
      case 'ours':
        mergedData = targetVersion.workflow_data;
        break;
      default:
        // Para 'auto' e 'manual', usar dados da fonte por simplicidade
        mergedData = sourceVersion.workflow_data;
    }
    
    // Criar nova versão com merge
    const newVersionNumber = VersioningUtils.incrementVersion(targetVersion.version_number, 'minor');
    
    const mergeVersionData = {
      workflow_id: workflowId,
      user_id: userId,
      created_by: userId,
      version_number: newVersionNumber,
      workflow_data: mergedData,
      description: req.body.description || `Merge da branch ${sourceBranch} para ${targetBranch}`,
      changelog: `Merge: ${sourceBranch} → ${targetBranch} (${mergeStrategy})`,
      branch: targetBranch,
      tags: ['merge', `from-${sourceBranch}`, `strategy-${mergeStrategy}`],
      is_major_change: !compatibility.compatible,
      is_breaking_change: !compatibility.compatible,
      is_published: false,
      is_current: false
    };
    
    const mergeVersion = await WorkflowVersionModel.create(mergeVersionData);
    
    return res.status(201).json({
      success: true,
      data: {
        merge_version: mergeVersion,
        compatibility,
        merge_strategy: mergeStrategy,
        source_version: sourceVersion.version_number,
        target_version: targetVersion.version_number
      }
    });
  } catch (error) {
    console.error('Erro ao fazer merge:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA UTILITÁRIOS
// ========================================

/**
 * POST /api/versioning/validate-version
 * Validar número de versão
 */
router.post('/validate-version', [
  authenticateToken,
  body('version_number').notEmpty().withMessage('Número da versão é obrigatório'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const versionNumber = req.body.version_number;
    const isValid = VersioningUtils.validateVersionNumber(versionNumber);
    
    return res.json({
      success: true,
      data: {
        valid: isValid,
        version_number: versionNumber
      }
    });
  } catch (error) {
    console.error('Erro ao validar versão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/versioning/check-compatibility
 * Verificar compatibilidade entre versões
 */
router.post('/check-compatibility', [
  authenticateToken,
  body('version1').notEmpty().withMessage('Versão 1 é obrigatória'),
  body('version2').notEmpty().withMessage('Versão 2 é obrigatória'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const version1 = req.body.version1;
    const version2 = req.body.version2;
    
    const compatibility = VersioningUtils.calculateCompatibility(version1, version2);
    
    return res.json({
      success: true,
      data: compatibility
    });
  } catch (error) {
    console.error('Erro ao verificar compatibilidade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/versioning/workflows/:workflowId/stats
 * Obter estatísticas de versionamento
 */
router.get('/workflows/:workflowId/stats', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    
    const [versions, comparisons] = await Promise.all([
      WorkflowVersionModel.findByWorkflowId(workflowId, 1000), // Buscar todas
      VersionComparisonModel.findByWorkflowId(workflowId, 1000)
    ]);
    
    // Get unique branches from versions
    const branches = versions.reduce((acc: any[], version: any) => {
      const existingBranch = acc.find((b: any) => b.name === (version.branch || 'main'));
      if (!existingBranch) {
        acc.push({
          name: version.branch || 'main',
          version_count: 1,
          latest_version: version.version_number
        });
      } else {
        existingBranch.version_count++;
      }
      return acc;
    }, []);
    
    const stats = {
      total_versions: versions.length,
      published_versions: versions.filter((v: any) => v.is_published).length,
      total_branches: branches.length,
      total_comparisons: comparisons.length,
      latest_version: versions[0]?.version_number || '0.0.0',
      major_changes: versions.filter((v: any) => v.is_major_change).length,
      breaking_changes: versions.filter((v: any) => v.is_breaking_change).length,
      branches: branches.map((b: any) => ({
        name: b.name,
        version_count: b.version_count,
        latest_version: b.latest_version
      }))
    };
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;