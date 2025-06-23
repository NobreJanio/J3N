import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DashboardModel, ExecutionMetricsModel, DailyStatsModel } from '../models/Analytics';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// ========================================
// ROTAS PARA DASHBOARD
// ========================================

/**
 * GET /api/analytics/dashboard
 * Obter dados do dashboard para o usuário
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const dashboardData = await DashboardModel.getDashboardData(userId);
    
    return res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/analytics/performance
 * Obter métricas de performance
 */
router.get('/performance', [
  authenticateToken,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Dias deve ser entre 1 e 365'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 7;
    
    const performanceData = await DashboardModel.getPerformanceMetrics(userId, days);
    
    return res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Erro ao buscar métricas de performance:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/analytics/workflow/:workflowId
 * Obter analytics específicos de um workflow
 */
router.get('/workflow/:workflowId', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Dias deve ser entre 1 e 365'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const days = parseInt(req.query.days as string) || 30;
    
    const analytics = await DashboardModel.getWorkflowAnalytics(workflowId, days);
    
    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erro ao buscar analytics do workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA MÉTRICAS DE EXECUÇÃO
// ========================================

/**
 * POST /api/analytics/metrics
 * Criar nova métrica de execução
 */
router.post('/metrics', [
  authenticateToken,
  body('execution_id').notEmpty().withMessage('ID da execução é obrigatório'),
  body('workflow_id').isInt().withMessage('ID do workflow deve ser um número'),
  body('execution_time_ms').isInt({ min: 0 }).withMessage('Tempo de execução deve ser um número positivo'),
  body('nodes_executed').optional().isInt({ min: 0 }).withMessage('Nós executados deve ser um número positivo'),
  body('nodes_failed').optional().isInt({ min: 0 }).withMessage('Nós falhados deve ser um número positivo'),
  body('memory_usage_mb').optional().isNumeric().withMessage('Uso de memória deve ser um número'),
  body('cpu_usage_percent').optional().isNumeric().withMessage('Uso de CPU deve ser um número'),
  body('api_calls_count').optional().isInt({ min: 0 }).withMessage('Contagem de chamadas API deve ser um número positivo'),
  body('data_processed_bytes').optional().isInt({ min: 0 }).withMessage('Dados processados deve ser um número positivo'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const metricsData = {
      ...req.body,
      user_id: userId
    };
    
    const metrics = await ExecutionMetricsModel.create(metricsData);
    
    // Atualizar estatísticas diárias
    await DailyStatsModel.updateStats(new Date(), userId);
    
    return res.status(201).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erro ao criar métricas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/analytics/metrics/execution/:executionId
 * Obter métricas de uma execução específica
 */
router.get('/metrics/execution/:executionId', [
  authenticateToken,
  param('executionId').notEmpty().withMessage('ID da execução é obrigatório'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const executionId = req.params.executionId;
    const metrics = await ExecutionMetricsModel.findByExecutionId(executionId);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: 'Métricas não encontradas'
      });
    }
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/analytics/metrics/workflow/:workflowId
 * Obter métricas de um workflow específico
 */
router.get('/metrics/workflow/:workflowId', [
  authenticateToken,
  param('workflowId').isInt().withMessage('ID do workflow deve ser um número'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const limit = parseInt(req.query.limit as string) || 50;
    
    const metrics = await ExecutionMetricsModel.findByWorkflowId(workflowId, limit);
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/analytics/metrics/user
 * Obter métricas do usuário
 */
router.get('/metrics/user', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limite deve ser entre 1 e 200'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const metrics = await ExecutionMetricsModel.findByUserId(userId, limit);
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA ESTATÍSTICAS DIÁRIAS
// ========================================

/**
 * GET /api/analytics/stats/daily
 * Obter estatísticas diárias do usuário
 */
router.get('/stats/daily', [
  authenticateToken,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Dias deve ser entre 1 e 365'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    
    const stats = await DailyStatsModel.findByUserId(userId, days);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas diárias:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/analytics/stats/overall
 * Obter estatísticas gerais do usuário
 */
router.get('/stats/overall', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await DailyStatsModel.getOverallStats(userId);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas gerais:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/analytics/stats/update
 * Atualizar estatísticas diárias manualmente
 */
router.post('/stats/update', [
  authenticateToken,
  body('date').optional().isISO8601().withMessage('Data deve estar no formato ISO 8601'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    
    await DailyStatsModel.updateStats(date, userId);
    
    return res.json({
      success: true,
      message: 'Estatísticas atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA RELATÓRIOS
// ========================================

/**
 * GET /api/analytics/reports/summary
 * Obter relatório resumido
 */
router.get('/reports/summary', [
  authenticateToken,
  query('start_date').optional().isISO8601().withMessage('Data inicial deve estar no formato ISO 8601'),
  query('end_date').optional().isISO8601().withMessage('Data final deve estar no formato ISO 8601'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();
    
    // Buscar dados para o relatório
    const [dashboardData, performanceData, overallStats] = await Promise.all([
      DashboardModel.getDashboardData(userId),
      DashboardModel.getPerformanceMetrics(userId, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))),
      DailyStatsModel.getOverallStats(userId)
    ]);
    
    const report = {
      period: {
        start_date: startDate,
        end_date: endDate
      },
      summary: {
        total_executions: dashboardData.totalExecutions,
        successful_executions: dashboardData.successfulExecutions,
        failed_executions: dashboardData.failedExecutions,
        success_rate: dashboardData.totalExecutions > 0 ? (dashboardData.successfulExecutions / dashboardData.totalExecutions * 100).toFixed(2) : 0,
        avg_execution_time: dashboardData.avgExecutionTime
      },
      performance: performanceData,
      overall_stats: overallStats,
      top_workflows: dashboardData.topWorkflows,
      recent_executions: dashboardData.recentExecutions.slice(0, 5)
    };
    
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;