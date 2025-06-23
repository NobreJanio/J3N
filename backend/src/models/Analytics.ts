import pool from '../config/database';

// ========================================
// INTERFACES PARA ANALYTICS
// ========================================

export interface ExecutionMetrics {
  id: number;
  execution_id: string;
  workflow_id: number;
  user_id: number;
  execution_time_ms: number;
  nodes_executed: number;
  nodes_failed: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  api_calls_count: number;
  data_processed_bytes: number;
  created_at: Date;
}

export interface DailyStats {
  id: number;
  date: Date;
  user_id: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time_ms: number;
  total_api_calls: number;
  total_data_processed_bytes: number;
  created_at: Date;
}

export interface CreateExecutionMetricsData {
  execution_id: string;
  workflow_id: number;
  user_id: number;
  execution_time_ms: number;
  nodes_executed?: number;
  nodes_failed?: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  api_calls_count?: number;
  data_processed_bytes?: number;
}

export interface DashboardData {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  totalApiCalls: number;
  recentExecutions: any[];
  topWorkflows: any[];
  performanceChart: any[];
}

// ========================================
// MODELO PARA MÉTRICAS DE EXECUÇÃO
// ========================================

export class ExecutionMetricsModel {
  static async create(data: CreateExecutionMetricsData): Promise<ExecutionMetrics> {
    const query = `
      INSERT INTO execution_metrics (
        execution_id, workflow_id, user_id, execution_time_ms,
        nodes_executed, nodes_failed, memory_usage_mb, cpu_usage_percent,
        api_calls_count, data_processed_bytes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      data.execution_id,
      data.workflow_id,
      data.user_id,
      data.execution_time_ms,
      data.nodes_executed || 0,
      data.nodes_failed || 0,
      data.memory_usage_mb || 0,
      data.cpu_usage_percent || 0,
      data.api_calls_count || 0,
      data.data_processed_bytes || 0
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByExecutionId(executionId: string): Promise<ExecutionMetrics | null> {
    const query = 'SELECT * FROM execution_metrics WHERE execution_id = $1';
    const result = await pool.query(query, [executionId]);
    return result.rows[0] || null;
  }

  static async findByWorkflowId(workflowId: number, limit: number = 50): Promise<ExecutionMetrics[]> {
    const query = `
      SELECT * FROM execution_metrics 
      WHERE workflow_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [workflowId, limit]);
    return result.rows;
  }

  static async findByUserId(userId: number, limit: number = 100): Promise<ExecutionMetrics[]> {
    const query = `
      SELECT * FROM execution_metrics 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }
}

// ========================================
// MODELO PARA ESTATÍSTICAS DIÁRIAS
// ========================================

export class DailyStatsModel {
  static async findByUserId(userId: number, days: number = 30): Promise<DailyStats[]> {
    const query = `
      SELECT * FROM daily_stats 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async updateStats(date: Date, userId: number): Promise<void> {
    const query = 'SELECT update_daily_stats($1, $2)';
    await pool.query(query, [date, userId]);
  }

  static async getOverallStats(userId: number): Promise<any> {
    const query = `
      SELECT 
        SUM(total_executions) as total_executions,
        SUM(successful_executions) as successful_executions,
        SUM(failed_executions) as failed_executions,
        AVG(avg_execution_time_ms) as avg_execution_time,
        SUM(total_api_calls) as total_api_calls,
        SUM(total_data_processed_bytes) as total_data_processed
      FROM daily_stats 
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

// ========================================
// MODELO PARA DASHBOARD
// ========================================

export class DashboardModel {
  static async getDashboardData(userId: number): Promise<DashboardData> {
    // Estatísticas gerais
    const statsQuery = `
      SELECT 
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) as avg_execution_time
      FROM workflow_executions we
      JOIN workflows w ON we.workflow_id = w.id
      WHERE w.user_id = $1
      AND we.started_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    // Execuções recentes
    const recentQuery = `
      SELECT 
        we.id,
        we.status,
        we.started_at,
        we.completed_at,
        w.name as workflow_name,
        em.execution_time_ms,
        em.nodes_executed
      FROM workflow_executions we
      JOIN workflows w ON we.workflow_id = w.id
      LEFT JOIN execution_metrics em ON we.id = em.execution_id
      WHERE w.user_id = $1
      ORDER BY we.started_at DESC
      LIMIT 10
    `;
    
    // Top workflows por execuções
    const topWorkflowsQuery = `
      SELECT 
        w.id,
        w.name,
        COUNT(we.id) as execution_count,
        COUNT(*) FILTER (WHERE we.status = 'completed') as success_count,
        AVG(em.execution_time_ms) as avg_time
      FROM workflows w
      LEFT JOIN workflow_executions we ON w.id = we.workflow_id
      LEFT JOIN execution_metrics em ON we.id = em.execution_id
      WHERE w.user_id = $1
      AND we.started_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY w.id, w.name
      ORDER BY execution_count DESC
      LIMIT 5
    `;
    
    // Dados para gráfico de performance (últimos 7 dias)
    const performanceQuery = `
      SELECT 
        DATE(we.started_at) as date,
        COUNT(*) as executions,
        COUNT(*) FILTER (WHERE we.status = 'completed') as successful,
        AVG(em.execution_time_ms) as avg_time
      FROM workflow_executions we
      JOIN workflows w ON we.workflow_id = w.id
      LEFT JOIN execution_metrics em ON we.id = em.execution_id
      WHERE w.user_id = $1
      AND we.started_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(we.started_at)
      ORDER BY date
    `;
    
    const [statsResult, recentResult, topWorkflowsResult, performanceResult] = await Promise.all([
      pool.query(statsQuery, [userId]),
      pool.query(recentQuery, [userId]),
      pool.query(topWorkflowsQuery, [userId]),
      pool.query(performanceQuery, [userId])
    ]);
    
    const stats = statsResult.rows[0];
    
    return {
      totalExecutions: parseInt(stats.total_executions) || 0,
      successfulExecutions: parseInt(stats.successful_executions) || 0,
      failedExecutions: parseInt(stats.failed_executions) || 0,
      avgExecutionTime: parseFloat(stats.avg_execution_time) || 0,
      totalApiCalls: 0, // Será calculado das métricas
      recentExecutions: recentResult.rows,
      topWorkflows: topWorkflowsResult.rows,
      performanceChart: performanceResult.rows
    };
  }

  static async getPerformanceMetrics(userId: number, days: number = 7): Promise<any[]> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        AVG(execution_time_ms) as avg_execution_time,
        AVG(memory_usage_mb) as avg_memory_usage,
        AVG(cpu_usage_percent) as avg_cpu_usage,
        SUM(api_calls_count) as total_api_calls,
        COUNT(*) as total_executions
      FROM execution_metrics
      WHERE user_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getWorkflowAnalytics(workflowId: number, days: number = 30): Promise<any> {
    const query = `
      SELECT 
        COUNT(we.id) as total_executions,
        COUNT(*) FILTER (WHERE we.status = 'completed') as successful_executions,
        COUNT(*) FILTER (WHERE we.status = 'failed') as failed_executions,
        AVG(em.execution_time_ms) as avg_execution_time,
        MIN(em.execution_time_ms) as min_execution_time,
        MAX(em.execution_time_ms) as max_execution_time,
        AVG(em.nodes_executed) as avg_nodes_executed,
        SUM(em.api_calls_count) as total_api_calls,
        SUM(em.data_processed_bytes) as total_data_processed
      FROM workflow_executions we
      LEFT JOIN execution_metrics em ON we.id = em.execution_id
      WHERE we.workflow_id = $1
      AND we.started_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    const result = await pool.query(query, [workflowId]);
    return result.rows[0];
  }
}