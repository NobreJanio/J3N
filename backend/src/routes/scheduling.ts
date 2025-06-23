import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { WorkflowScheduleModel, ScheduleExecutionModel, CronUtils } from '../models/Scheduling';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import cron from 'node-cron';

const router = express.Router();

// Mapa para armazenar tarefas cron ativas
const activeCronJobs = new Map<number, cron.ScheduledTask>();

// ========================================
// ROTAS PARA AGENDAMENTOS
// ========================================

/**
 * GET /api/scheduling/schedules
 * Listar agendamentos do usuário
 */
router.get('/schedules', [
  authenticateToken,
  query('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const schedules = await WorkflowScheduleModel.findByUserId(userId);
    
    return res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/scheduling/schedules/:id
 * Obter agendamento específico
 */
router.get('/schedules/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const schedule = await WorkflowScheduleModel.findById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/scheduling/schedules
 * Criar novo agendamento
 */
router.post('/schedules', [
  authenticateToken,
  body('workflow_id').isInt().withMessage('ID do workflow deve ser um número'),
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('cron_expression').notEmpty().withMessage('Expressão cron é obrigatória'),
  body('timezone').optional().isString().withMessage('Timezone deve ser uma string'),
  body('enabled').optional().isBoolean().withMessage('Enabled deve ser um boolean'),
  body('max_executions').optional().isInt({ min: 1 }).withMessage('Máximo de execuções deve ser um número positivo'),
  body('retry_on_failure').optional().isBoolean().withMessage('Retry on failure deve ser um boolean'),
  body('max_retries').optional().isInt({ min: 0, max: 10 }).withMessage('Máximo de tentativas deve ser entre 0 e 10'),
  body('retry_delay_minutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Delay de retry deve ser entre 1 e 1440 minutos'),
  body('execution_timeout_minutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Timeout deve ser entre 1 e 1440 minutos'),
  body('input_data').optional().isObject().withMessage('Dados de entrada devem ser um objeto'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    
    // Validar expressão cron
    if (!CronUtils.validateCronExpression(req.body.cron_expression)) {
      return res.status(400).json({
        success: false,
        message: 'Expressão cron inválida'
      });
    }
    
    const scheduleData = {
      ...req.body,
      user_id: userId,
      enabled: req.body.enabled !== false // Default true
    };
    
    const schedule = await WorkflowScheduleModel.create(scheduleData);
    
    // Iniciar cron job se habilitado
    if (schedule.is_active) {
      await startCronJob(schedule);
    }
    
    return res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/scheduling/schedules/:id
 * Atualizar agendamento
 */
router.put('/schedules/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('cron_expression').optional().notEmpty().withMessage('Expressão cron não pode estar vazia'),
  body('timezone').optional().isString().withMessage('Timezone deve ser uma string'),
  body('enabled').optional().isBoolean().withMessage('Enabled deve ser um boolean'),
  body('max_executions').optional().isInt({ min: 1 }).withMessage('Máximo de execuções deve ser um número positivo'),
  body('retry_on_failure').optional().isBoolean().withMessage('Retry on failure deve ser um boolean'),
  body('max_retries').optional().isInt({ min: 0, max: 10 }).withMessage('Máximo de tentativas deve ser entre 0 e 10'),
  body('retry_delay_minutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Delay de retry deve ser entre 1 e 1440 minutos'),
  body('execution_timeout_minutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Timeout deve ser entre 1 e 1440 minutos'),
  body('input_data').optional().isObject().withMessage('Dados de entrada devem ser um objeto'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    // Verificar se agendamento existe
    const existingSchedule = await WorkflowScheduleModel.findById(scheduleId);
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }
    
    // Validar expressão cron se fornecida
    if (req.body.cron_expression && !CronUtils.validateCronExpression(req.body.cron_expression)) {
      return res.status(400).json({
        success: false,
        message: 'Expressão cron inválida'
      });
    }
    
    const schedule = await WorkflowScheduleModel.update(scheduleId, req.body);
    
    // Reiniciar cron job se necessário
    if (activeCronJobs.has(scheduleId)) {
      stopCronJob(scheduleId);
    }
    
    if (schedule && schedule.is_active) {
      await startCronJob(schedule);
    }
    
    return res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/scheduling/schedules/:id
 * Deletar agendamento
 */
router.delete('/schedules/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    // Parar cron job se ativo
    if (activeCronJobs.has(scheduleId)) {
      stopCronJob(scheduleId);
    }
    
    const deleted = await WorkflowScheduleModel.delete(scheduleId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }
    
    return res.json({
      success: true,
      message: 'Agendamento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/scheduling/schedules/:id/toggle
 * Habilitar/desabilitar agendamento
 */
router.post('/schedules/:id/toggle', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    const schedule = await WorkflowScheduleModel.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }
    
    const updatedSchedule = await WorkflowScheduleModel.update(scheduleId, {
      is_active: !schedule.is_active
    });
    
    // Gerenciar cron job
    if (updatedSchedule?.is_active) {
      await startCronJob(updatedSchedule);
    } else {
      stopCronJob(scheduleId);
    }
    
    return res.json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Erro ao alternar agendamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA EXECUÇÕES DE AGENDAMENTO
// ========================================

/**
 * GET /api/scheduling/executions
 * Listar execuções de agendamento
 */
router.get('/executions', [
  authenticateToken,
  query('schedule_id').optional().isInt().withMessage('ID do agendamento deve ser um número'),
  query('status').optional().isIn(['pending', 'running', 'completed', 'failed', 'cancelled']).withMessage('Status inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const scheduleId = req.query.schedule_id ? parseInt(req.query.schedule_id as string) : undefined;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: 'schedule_id é obrigatório'
      });
    }
    
    const executions = await ScheduleExecutionModel.findByScheduleId(scheduleId, limit);
    
    return res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    console.error('Erro ao buscar execuções:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/scheduling/executions/:id
 * Obter execução específica
 */
router.get('/executions/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const executionId = parseInt(req.params.id);
    const execution = await ScheduleExecutionModel.findById(executionId);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execução não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Erro ao buscar execução:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/scheduling/executions/:id/cancel
 * Cancelar execução
 */
router.post('/executions/:id/cancel', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const executionId = parseInt(req.params.id);
    
    const execution = await ScheduleExecutionModel.updateStatus(executionId, 'failed', 'Cancelado pelo usuário');
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execução não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Erro ao cancelar execução:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA UTILITÁRIOS CRON
// ========================================

/**
 * POST /api/scheduling/cron/validate
 * Validar expressão cron
 */
router.post('/cron/validate', [
  authenticateToken,
  body('expression').notEmpty().withMessage('Expressão cron é obrigatória'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const expression = req.body.expression;
    const isValid = CronUtils.validateCronExpression(expression);
    
    let description = null;
    let nextRuns = [];
    
    if (isValid) {
      description = CronUtils.describeCronExpression(expression);
      // Implementação simplificada para próximas execuções
      nextRuns = [];
      for (let i = 0; i < 5; i++) {
        const nextExecution = new Date(Date.now() + (i + 1) * 60 * 60 * 1000);
        nextRuns.push(nextExecution.toISOString());
      }
    }
    
    return res.json({
      success: true,
      data: {
        valid: isValid,
        description,
        next_runs: nextRuns
      }
    });
  } catch (error) {
    console.error('Erro ao validar cron:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/scheduling/cron/presets
 * Obter presets de expressões cron
 */
router.get('/cron/presets', authenticateToken, async (req: any, res: any) => {
  try {
    const presets = [
      { name: 'A cada minuto', expression: '* * * * *', description: 'Executa a cada minuto' },
      { name: 'A cada 5 minutos', expression: '*/5 * * * *', description: 'Executa a cada 5 minutos' },
      { name: 'A cada 15 minutos', expression: '*/15 * * * *', description: 'Executa a cada 15 minutos' },
      { name: 'A cada 30 minutos', expression: '*/30 * * * *', description: 'Executa a cada 30 minutos' },
      { name: 'A cada hora', expression: '0 * * * *', description: 'Executa no início de cada hora' },
      { name: 'A cada 2 horas', expression: '0 */2 * * *', description: 'Executa a cada 2 horas' },
      { name: 'A cada 6 horas', expression: '0 */6 * * *', description: 'Executa a cada 6 horas' },
      { name: 'A cada 12 horas', expression: '0 */12 * * *', description: 'Executa a cada 12 horas' },
      { name: 'Diariamente às 00:00', expression: '0 0 * * *', description: 'Executa todos os dias à meia-noite' },
      { name: 'Diariamente às 09:00', expression: '0 9 * * *', description: 'Executa todos os dias às 9h' },
      { name: 'Diariamente às 18:00', expression: '0 18 * * *', description: 'Executa todos os dias às 18h' },
      { name: 'Semanalmente (Segunda)', expression: '0 0 * * 1', description: 'Executa toda segunda-feira à meia-noite' },
      { name: 'Semanalmente (Sexta)', expression: '0 0 * * 5', description: 'Executa toda sexta-feira à meia-noite' },
      { name: 'Mensalmente (dia 1)', expression: '0 0 1 * *', description: 'Executa no primeiro dia de cada mês' },
      { name: 'Mensalmente (último dia)', expression: '0 0 L * *', description: 'Executa no último dia de cada mês' }
    ];
    
    return res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error('Erro ao buscar presets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Iniciar cron job para um agendamento
 */
async function startCronJob(schedule: any) {
  try {
    const task = cron.schedule(schedule.cron_expression, async () => {
      console.log(`Executando agendamento ${schedule.id}: ${schedule.name}`);
      
      // Criar execução
      const execution = await ScheduleExecutionModel.create(
        schedule.id,
        new Date()
      );
      
      // Aqui você integraria com o sistema de execução de workflows
      // Por enquanto, apenas simulamos
      setTimeout(async () => {
        await ScheduleExecutionModel.updateStatus(
          execution.id,
          'completed',
          'Execução simulada concluída'
        );
      }, 1000);
      
    }, {
      scheduled: false,
      timezone: schedule.timezone || 'America/Sao_Paulo'
    });
    
    task.start();
    activeCronJobs.set(schedule.id, task);
    
    console.log(`Cron job iniciado para agendamento ${schedule.id}`);
  } catch (error) {
    console.error(`Erro ao iniciar cron job para agendamento ${schedule.id}:`, error);
  }
}

/**
 * Parar cron job de um agendamento
 */
function stopCronJob(scheduleId: number) {
  const task = activeCronJobs.get(scheduleId);
  if (task) {
    task.stop();
    activeCronJobs.delete(scheduleId);
    console.log(`Cron job parado para agendamento ${scheduleId}`);
  }
}

/**
 * Inicializar todos os cron jobs ativos
 */
export async function initializeScheduler() {
  try {
    console.log('Inicializando scheduler...');
    const activeSchedules = await WorkflowScheduleModel.findActiveSchedules();
    
    for (const schedule of activeSchedules) {
      await startCronJob(schedule);
    }
    
    console.log(`${activeSchedules.length} agendamentos inicializados`);
  } catch (error) {
    console.error('Erro ao inicializar scheduler:', error);
  }
}

/**
 * Parar todos os cron jobs
 */
export function stopAllScheduler() {
  console.log('Parando todos os cron jobs...');
  for (const [scheduleId, task] of activeCronJobs) {
    task.stop();
  }
  activeCronJobs.clear();
  console.log('Todos os cron jobs foram parados');
}

export default router;