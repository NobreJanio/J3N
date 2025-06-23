import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Execution {
  id: string;
  workflow_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  execution_data: any;
  error_message?: string;
}

export interface CreateExecutionData {
  workflow_id: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_data?: any;
}

export interface UpdateExecutionData {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_data?: any;
  error_message?: string;
}

export class ExecutionModel {
  static async create(data: CreateExecutionData): Promise<Execution> {
    const executionId = uuidv4();
    
    const query = `
      INSERT INTO workflow_executions (id, workflow_id, status, execution_data)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      executionId,
      data.workflow_id,
      data.status || 'pending',
      JSON.stringify(data.execution_data || {})
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<Execution | null> {
    const query = 'SELECT * FROM workflow_executions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByWorkflowId(workflowId: number, limit: number = 50): Promise<Execution[]> {
    const query = `
      SELECT * FROM workflow_executions 
      WHERE workflow_id = $1 
      ORDER BY started_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [workflowId, limit]);
    return result.rows;
  }

  static async updateStatus(id: string, status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled', additionalData?: any): Promise<Execution | null> {
    const fields = ['status = $2'];
    const values = [id, status];
    let paramCount = 3;

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      fields.push(`completed_at = NOW()`);
    }

    if (additionalData) {
      if (additionalData.error) {
        fields.push(`error_message = $${paramCount}`);
        values.push(additionalData.error);
        paramCount++;
      }

      // Merge additional data with existing execution_data
      const currentExecution = await this.findById(id);
      if (currentExecution) {
        const mergedData = {
          ...currentExecution.execution_data,
          ...additionalData
        };
        fields.push(`execution_data = $${paramCount}`);
        values.push(JSON.stringify(mergedData));
        paramCount++;
      }
    }

    const query = `
      UPDATE workflow_executions 
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM workflow_executions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getRunningExecutions(): Promise<Execution[]> {
    const query = `
      SELECT * FROM workflow_executions 
      WHERE status = 'running' 
      ORDER BY started_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getExecutionStats(workflowId?: number): Promise<any> {
    let query = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
      FROM workflow_executions
    `;
    
    const values: any[] = [];
    
    if (workflowId) {
      query += ' WHERE workflow_id = $1';
      values.push(workflowId);
    }
    
    query += ' GROUP BY status';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async cleanupOldExecutions(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM workflow_executions 
      WHERE started_at < NOW() - INTERVAL '${daysOld} days'
      AND status IN ('completed', 'failed', 'cancelled')
    `;
    
    const result = await pool.query(query);
    return result.rowCount || 0;
  }
} 