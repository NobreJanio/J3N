import pool from '../config/database';

export interface WorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    [key: string]: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  user_id: number;
  workflow_data: WorkflowData;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  is_active?: boolean;
  user_id: number;
  workflow_data: WorkflowData;
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  is_active?: boolean;
  workflow_data?: WorkflowData;
}

export class WorkflowModel {
  static async findById(id: number): Promise<Workflow | null> {
    const query = 'SELECT * FROM workflows WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<Workflow[]> {
    const query = `
      SELECT * FROM workflows 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async create(data: CreateWorkflowData): Promise<Workflow> {
    const query = `
      INSERT INTO workflows (name, description, is_active, user_id, workflow_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.description || null,
      data.is_active ?? true,
      data.user_id,
      JSON.stringify(data.workflow_data)
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id: number, data: UpdateWorkflowData): Promise<Workflow | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(data.description);
      paramCount++;
    }

    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(data.is_active);
      paramCount++;
    }

    if (data.workflow_data !== undefined) {
      fields.push(`workflow_data = $${paramCount}`);
      values.push(JSON.stringify(data.workflow_data));
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE workflows 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM workflows WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async toggleActive(id: number): Promise<Workflow | null> {
    const query = `
      UPDATE workflows 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async duplicate(id: number, newName: string): Promise<Workflow | null> {
    const original = await this.findById(id);
    if (!original) return null;

    const duplicateData: CreateWorkflowData = {
      name: newName,
      description: original.description,
      is_active: false,
      user_id: original.user_id,
      workflow_data: original.workflow_data
    };

    return this.create(duplicateData);
  }

  static async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM workflows';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
} 