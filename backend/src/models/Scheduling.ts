import { pool } from '../config/database';
import { Workflow } from './Workflow';

// ========================================
// INTERFACES PARA AGENDAMENTO
// ========================================

export interface WorkflowSchedule {
  id: number;
  workflow_id: number;
  user_id: number;
  name: string;
  description?: string;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  next_execution: Date;
  last_execution?: Date;
  execution_count: number;
  max_executions?: number;
  start_date?: Date;
  end_date?: Date;
  retry_count: number;
  retry_delay_minutes: number;
  timeout_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduleExecution {
  id: number;
  schedule_id: number;
  execution_id?: string;
  scheduled_at: Date;
  executed_at?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'timeout';
  error_message?: string;
  retry_attempt: number;
  created_at: Date;
}

export interface CreateScheduleData {
  workflow_id: number;
  user_id: number;
  name: string;
  description?: string;
  cron_expression: string;
  timezone?: string;
  is_active?: boolean;
  max_executions?: number;
  start_date?: Date;
  end_date?: Date;
  retry_count?: number;
  retry_delay_minutes?: number;
  timeout_minutes?: number;
}

export interface UpdateScheduleData {
  name?: string;
  description?: string;
  cron_expression?: string;
  timezone?: string;
  is_active?: boolean;
  max_executions?: number;
  start_date?: Date;
  end_date?: Date;
  retry_count?: number;
  retry_delay_minutes?: number;
  timeout_minutes?: number;
}

// ========================================
// MODELO PARA AGENDAMENTOS DE WORKFLOW
// ========================================

export class WorkflowScheduleModel {
  static async create(data: CreateScheduleData): Promise<WorkflowSchedule> {
    const query = `
      INSERT INTO workflow_schedules (
        workflow_id, user_id, name, description, cron_expression, timezone,
        is_active, max_executions, start_date, end_date, retry_count,
        retry_delay_minutes, timeout_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      data.workflow_id,
      data.user_id,
      data.name,
      data.description || null,
      data.cron_expression,
      data.timezone || 'UTC',
      data.is_active !== false,
      data.max_executions || null,
      data.start_date || null,
      data.end_date || null,
      data.retry_count || 3,
      data.retry_delay_minutes || 5,
      data.timeout_minutes || 60
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: number): Promise<WorkflowSchedule | null> {
    const query = 'SELECT * FROM workflow_schedules WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<WorkflowSchedule[]> {
    const query = `
      SELECT ws.*, w.name as workflow_name
      FROM workflow_schedules ws
      JOIN workflows w ON ws.workflow_id = w.id
      WHERE ws.user_id = $1
      ORDER BY ws.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findByWorkflowId(workflowId: number): Promise<WorkflowSchedule[]> {
    const query = `
      SELECT * FROM workflow_schedules 
      WHERE workflow_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [workflowId]);
    return result.rows;
  }

  static async findActiveSchedules(): Promise<WorkflowSchedule[]> {
    const query = `
      SELECT * FROM workflow_schedules 
      WHERE is_active = true 
      AND (end_date IS NULL OR end_date > NOW())
      AND (max_executions IS NULL OR execution_count < max_executions)
      ORDER BY next_execution ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findDueSchedules(): Promise<WorkflowSchedule[]> {
    const query = `
      SELECT * FROM workflow_schedules 
      WHERE is_active = true 
      AND next_execution <= NOW()
      AND (end_date IS NULL OR end_date > NOW())
      AND (max_executions IS NULL OR execution_count < max_executions)
      ORDER BY next_execution ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id: number, data: UpdateScheduleData): Promise<WorkflowSchedule | null> {
    const fields: string[] = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE workflow_schedules 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    values.push(id);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async updateNextExecution(id: number, nextExecution: Date): Promise<void> {
    const query = `
      UPDATE workflow_schedules 
      SET next_execution = $1, last_execution = NOW(), execution_count = execution_count + 1
      WHERE id = $2
    `;
    await pool.query(query, [nextExecution, id]);
  }

  static async toggleActive(id: number, isActive: boolean): Promise<WorkflowSchedule | null> {
    const query = `
      UPDATE workflow_schedules 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM workflow_schedules WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getScheduleStats(scheduleId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
        COUNT(*) FILTER (WHERE status = 'timeout') as timeout_executions,
        AVG(EXTRACT(EPOCH FROM (executed_at - scheduled_at))) as avg_delay_seconds
      FROM schedule_executions
      WHERE schedule_id = $1
    `;
    const result = await pool.query(query, [scheduleId]);
    return result.rows[0];
  }
}

// ========================================
// MODELO PARA EXECUÇÕES AGENDADAS
// ========================================

export class ScheduleExecutionModel {
  static async create(scheduleId: number, scheduledAt: Date): Promise<ScheduleExecution> {
    const query = `
      INSERT INTO schedule_executions (schedule_id, scheduled_at, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `;
    const result = await pool.query(query, [scheduleId, scheduledAt]);
    return result.rows[0];
  }

  static async findById(id: number): Promise<ScheduleExecution | null> {
    const query = 'SELECT * FROM schedule_executions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByScheduleId(scheduleId: number, limit: number = 50): Promise<ScheduleExecution[]> {
    const query = `
      SELECT * FROM schedule_executions 
      WHERE schedule_id = $1 
      ORDER BY scheduled_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [scheduleId, limit]);
    return result.rows;
  }

  static async findPendingExecutions(): Promise<ScheduleExecution[]> {
    const query = `
      SELECT se.*, ws.timeout_minutes
      FROM schedule_executions se
      JOIN workflow_schedules ws ON se.schedule_id = ws.id
      WHERE se.status = 'pending' 
      AND se.scheduled_at <= NOW()
      ORDER BY se.scheduled_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findTimedOutExecutions(): Promise<ScheduleExecution[]> {
    const query = `
      SELECT se.*, ws.timeout_minutes
      FROM schedule_executions se
      JOIN workflow_schedules ws ON se.schedule_id = ws.id
      WHERE se.status = 'running'
      AND se.executed_at + INTERVAL '1 minute' * ws.timeout_minutes < NOW()
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStatus(
    id: number, 
    status: ScheduleExecution['status'], 
    executionId?: string, 
    errorMessage?: string
  ): Promise<ScheduleExecution | null> {
    let query: string;
    let values: any[];

    if (status === 'running') {
      query = `
        UPDATE schedule_executions 
        SET status = $1, execution_id = $2, executed_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      values = [status, executionId, id];
    } else {
      query = `
        UPDATE schedule_executions 
        SET status = $1, error_message = $2
        WHERE id = $3
        RETURNING *
      `;
      values = [status, errorMessage || null, id];
    }

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async incrementRetry(id: number): Promise<ScheduleExecution | null> {
    const query = `
      UPDATE schedule_executions 
      SET retry_attempt = retry_attempt + 1
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getExecutionHistory(scheduleId: number, days: number = 30): Promise<any[]> {
    const query = `
      SELECT 
        DATE(scheduled_at) as date,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'timeout') as timeout,
        AVG(EXTRACT(EPOCH FROM (executed_at - scheduled_at))) as avg_delay_seconds
      FROM schedule_executions
      WHERE schedule_id = $1
      AND scheduled_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(scheduled_at)
      ORDER BY date DESC
    `;
    const result = await pool.query(query, [scheduleId]);
    return result.rows;
  }
}

// ========================================
// UTILITÁRIOS PARA CRON
// ========================================

export class CronUtils {
  /**
   * Valida uma expressão cron
   */
  static validateCronExpression(expression: string): boolean {
    // Regex básica para validar cron (5 ou 6 campos)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/[0-6])( (\*|([0-9]{4})|\*\/([0-9]{4})))?$/;
    
    const parts = expression.trim().split(/\s+/);
    return parts.length >= 5 && parts.length <= 6;
  }

  /**
   * Calcula a próxima execução baseada na expressão cron
   * Nota: Esta é uma implementação simplificada. Em produção, use uma biblioteca como 'node-cron' ou 'cron-parser'
   */
  static getNextExecution(cronExpression: string, timezone: string = 'UTC'): Date {
    // Implementação simplificada - em produção usar biblioteca especializada
    const now = new Date();
    
    // Para demonstração, adiciona 1 hora à data atual
    // Em produção, usar biblioteca como 'cron-parser'
    const nextExecution = new Date(now.getTime() + 60 * 60 * 1000);
    
    return nextExecution;
  }

  /**
   * Converte expressões cron comuns para formato legível
   */
  static describeCronExpression(expression: string): string {
    const commonExpressions: { [key: string]: string } = {
      '0 * * * *': 'A cada hora',
      '0 0 * * *': 'Diariamente à meia-noite',
      '0 9 * * *': 'Diariamente às 9:00',
      '0 0 * * 0': 'Semanalmente aos domingos',
      '0 0 1 * *': 'Mensalmente no dia 1',
      '*/5 * * * *': 'A cada 5 minutos',
      '*/15 * * * *': 'A cada 15 minutos',
      '*/30 * * * *': 'A cada 30 minutos',
      '0 */2 * * *': 'A cada 2 horas',
      '0 0 */2 * *': 'A cada 2 dias',
      '0 9-17 * * 1-5': 'Horário comercial (9h-17h, seg-sex)'
    };

    return commonExpressions[expression] || `Expressão personalizada: ${expression}`;
  }

  /**
   * Gera expressões cron comuns
   */
  static getCommonExpressions(): Array<{ expression: string; description: string }> {
    return [
      { expression: '*/5 * * * *', description: 'A cada 5 minutos' },
      { expression: '*/15 * * * *', description: 'A cada 15 minutos' },
      { expression: '*/30 * * * *', description: 'A cada 30 minutos' },
      { expression: '0 * * * *', description: 'A cada hora' },
      { expression: '0 */2 * * *', description: 'A cada 2 horas' },
      { expression: '0 9 * * *', description: 'Diariamente às 9:00' },
      { expression: '0 0 * * *', description: 'Diariamente à meia-noite' },
      { expression: '0 0 * * 1', description: 'Semanalmente às segundas' },
      { expression: '0 0 1 * *', description: 'Mensalmente no dia 1' },
      { expression: '0 9-17 * * 1-5', description: 'Horário comercial' }
    ];
  }
}