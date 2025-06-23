import { pool } from '../config/database';
import { WorkflowData } from './Workflow';

// ========================================
// INTERFACES PARA TEMPLATES
// ========================================

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time_minutes: number;
  workflow_data: WorkflowData;
  preview_image?: string;
  author_id?: number;
  author_name?: string;
  is_public: boolean;
  is_featured: boolean;
  is_verified: boolean;
  usage_count: number;
  rating_average: number;
  rating_count: number;
  required_integrations: string[];
  required_credentials: string[];
  variables: TemplateVariable[];
  instructions?: string;
  changelog?: TemplateChangelog[];
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  label: string;
  description?: string;
  default_value?: any;
  required: boolean;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface TemplateChangelog {
  version: string;
  date: Date;
  changes: string[];
  breaking_changes?: string[];
}

export interface TemplateRating {
  id: number;
  template_id: number;
  user_id: number;
  rating: number;
  review?: string;
  is_helpful: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateData {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  difficulty_level?: WorkflowTemplate['difficulty_level'];
  estimated_time_minutes?: number;
  workflow_data: WorkflowData;
  preview_image?: string;
  author_id?: number;
  is_public?: boolean;
  required_integrations?: string[];
  required_credentials?: string[];
  variables?: TemplateVariable[];
  instructions?: string;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  difficulty_level?: WorkflowTemplate['difficulty_level'];
  estimated_time_minutes?: number;
  workflow_data?: WorkflowData;
  preview_image?: string;
  is_public?: boolean;
  required_integrations?: string[];
  required_credentials?: string[];
  variables?: TemplateVariable[];
  instructions?: string;
}

export interface TemplateSearchFilters {
  category?: string;
  tags?: string[];
  difficulty_level?: WorkflowTemplate['difficulty_level'];
  required_integrations?: string[];
  is_featured?: boolean;
  is_verified?: boolean;
  min_rating?: number;
  author_id?: number;
  search_term?: string;
}

export interface TemplateUsageData {
  template_id: number;
  user_id: number;
  workflow_id: number;
  variables_used: Record<string, any>;
  created_at: Date;
}

// ========================================
// MODELO PARA TEMPLATES DE WORKFLOW
// ========================================

export class WorkflowTemplateModel {
  static async create(data: CreateTemplateData): Promise<WorkflowTemplate> {
    const query = `
      INSERT INTO workflow_templates (
        name, description, category, tags, difficulty_level, estimated_time_minutes,
        workflow_data, preview_image, author_id, is_public, required_integrations,
        required_credentials, variables, instructions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.description,
      data.category,
      JSON.stringify(data.tags || []),
      data.difficulty_level || 'beginner',
      data.estimated_time_minutes || 30,
      JSON.stringify(data.workflow_data),
      data.preview_image || null,
      data.author_id || null,
      data.is_public !== false,
      JSON.stringify(data.required_integrations || []),
      JSON.stringify(data.required_credentials || []),
      JSON.stringify(data.variables || []),
      data.instructions || null
    ];
    
    const result = await pool.query(query, values);
    const template = result.rows[0];
    
    // Parse JSON fields
    template.tags = JSON.parse(template.tags);
    template.workflow_data = JSON.parse(template.workflow_data);
    template.required_integrations = JSON.parse(template.required_integrations);
    template.required_credentials = JSON.parse(template.required_credentials);
    template.variables = JSON.parse(template.variables);
    template.changelog = JSON.parse(template.changelog || '[]');
    
    return template;
  }

  static async findById(id: number): Promise<WorkflowTemplate | null> {
    const query = `
      SELECT wt.*, u.name as author_name
      FROM workflow_templates wt
      LEFT JOIN users u ON wt.author_id = u.id
      WHERE wt.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const template = result.rows[0];
    template.tags = JSON.parse(template.tags);
    template.workflow_data = JSON.parse(template.workflow_data);
    template.required_integrations = JSON.parse(template.required_integrations);
    template.required_credentials = JSON.parse(template.required_credentials);
    template.variables = JSON.parse(template.variables);
    template.changelog = JSON.parse(template.changelog || '[]');
    
    return template;
  }

  static async findAll(filters: TemplateSearchFilters = {}, limit: number = 50, offset: number = 0): Promise<{
    templates: WorkflowTemplate[];
    total: number;
  }> {
    let whereConditions = ['wt.is_public = true'];
    const values = [];
    let paramCount = 1;

    // Aplicar filtros
    if (filters.category) {
      whereConditions.push(`wt.category = $${paramCount}`);
      values.push(filters.category);
      paramCount++;
    }

    if (filters.difficulty_level) {
      whereConditions.push(`wt.difficulty_level = $${paramCount}`);
      values.push(filters.difficulty_level);
      paramCount++;
    }

    if (filters.is_featured) {
      whereConditions.push(`wt.is_featured = $${paramCount}`);
      values.push(filters.is_featured);
      paramCount++;
    }

    if (filters.is_verified) {
      whereConditions.push(`wt.is_verified = $${paramCount}`);
      values.push(filters.is_verified);
      paramCount++;
    }

    if (filters.min_rating) {
      whereConditions.push(`wt.rating_average >= $${paramCount}`);
      values.push(filters.min_rating);
      paramCount++;
    }

    if (filters.author_id) {
      whereConditions.push(`wt.author_id = $${paramCount}`);
      values.push(filters.author_id);
      paramCount++;
    }

    if (filters.search_term) {
      whereConditions.push(`(
        wt.name ILIKE $${paramCount} OR 
        wt.description ILIKE $${paramCount} OR 
        wt.tags::text ILIKE $${paramCount}
      )`);
      values.push(`%${filters.search_term}%`);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(`wt.tags ?| $${paramCount}`);
      values.push(filters.tags);
      paramCount++;
    }

    if (filters.required_integrations && filters.required_integrations.length > 0) {
      whereConditions.push(`wt.required_integrations ?| $${paramCount}`);
      values.push(filters.required_integrations);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM workflow_templates wt
      ${whereClause}
    `;
    
    // Query para buscar templates
    const templatesQuery = `
      SELECT wt.*, u.name as author_name
      FROM workflow_templates wt
      LEFT JOIN users u ON wt.author_id = u.id
      ${whereClause}
      ORDER BY wt.is_featured DESC, wt.rating_average DESC, wt.usage_count DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    values.push(limit, offset);
    
    const [countResult, templatesResult] = await Promise.all([
      pool.query(countQuery, values.slice(0, -2)),
      pool.query(templatesQuery, values)
    ]);
    
    const templates = templatesResult.rows.map(template => {
      template.tags = JSON.parse(template.tags);
      template.workflow_data = JSON.parse(template.workflow_data);
      template.required_integrations = JSON.parse(template.required_integrations);
      template.required_credentials = JSON.parse(template.required_credentials);
      template.variables = JSON.parse(template.variables);
      template.changelog = JSON.parse(template.changelog || '[]');
      return template;
    });
    
    return {
      templates,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async findByAuthor(authorId: number): Promise<WorkflowTemplate[]> {
    const query = `
      SELECT wt.*, u.name as author_name
      FROM workflow_templates wt
      LEFT JOIN users u ON wt.author_id = u.id
      WHERE wt.author_id = $1
      ORDER BY wt.created_at DESC
    `;
    const result = await pool.query(query, [authorId]);
    
    return result.rows.map(template => {
      template.tags = JSON.parse(template.tags);
      template.workflow_data = JSON.parse(template.workflow_data);
      template.required_integrations = JSON.parse(template.required_integrations);
      template.required_credentials = JSON.parse(template.required_credentials);
      template.variables = JSON.parse(template.variables);
      template.changelog = JSON.parse(template.changelog || '[]');
      return template;
    });
  }

  static async findFeatured(limit: number = 10): Promise<WorkflowTemplate[]> {
    const query = `
      SELECT wt.*, u.name as author_name
      FROM workflow_templates wt
      LEFT JOIN users u ON wt.author_id = u.id
      WHERE wt.is_featured = true AND wt.is_public = true
      ORDER BY wt.rating_average DESC, wt.usage_count DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    
    return result.rows.map(template => {
      template.tags = JSON.parse(template.tags);
      template.workflow_data = JSON.parse(template.workflow_data);
      template.required_integrations = JSON.parse(template.required_integrations);
      template.required_credentials = JSON.parse(template.required_credentials);
      template.variables = JSON.parse(template.variables);
      template.changelog = JSON.parse(template.changelog || '[]');
      return template;
    });
  }

  static async findPopular(limit: number = 10): Promise<WorkflowTemplate[]> {
    const query = `
      SELECT wt.*, u.name as author_name
      FROM workflow_templates wt
      LEFT JOIN users u ON wt.author_id = u.id
      WHERE wt.is_public = true
      ORDER BY wt.usage_count DESC, wt.rating_average DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    
    return result.rows.map(template => {
      template.tags = JSON.parse(template.tags);
      template.workflow_data = JSON.parse(template.workflow_data);
      template.required_integrations = JSON.parse(template.required_integrations);
      template.required_credentials = JSON.parse(template.required_credentials);
      template.variables = JSON.parse(template.variables);
      template.changelog = JSON.parse(template.changelog || '[]');
      return template;
    });
  }

  static async update(id: number, data: UpdateTemplateData): Promise<WorkflowTemplate | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (['tags', 'workflow_data', 'required_integrations', 'required_credentials', 'variables'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE workflow_templates 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    values.push(id);
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    
    const template = result.rows[0];
    template.tags = JSON.parse(template.tags);
    template.workflow_data = JSON.parse(template.workflow_data);
    template.required_integrations = JSON.parse(template.required_integrations);
    template.required_credentials = JSON.parse(template.required_credentials);
    template.variables = JSON.parse(template.variables);
    template.changelog = JSON.parse(template.changelog || '[]');
    
    return template;
  }

  static async incrementUsage(id: number): Promise<void> {
    const query = 'UPDATE workflow_templates SET usage_count = usage_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async updateRating(id: number): Promise<void> {
    const query = `
      UPDATE workflow_templates 
      SET 
        rating_average = (
          SELECT COALESCE(AVG(rating), 0) 
          FROM template_ratings 
          WHERE template_id = $1
        ),
        rating_count = (
          SELECT COUNT(*) 
          FROM template_ratings 
          WHERE template_id = $1
        )
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  static async toggleFeatured(id: number, isFeatured: boolean): Promise<WorkflowTemplate | null> {
    const query = `
      UPDATE workflow_templates 
      SET is_featured = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isFeatured, id]);
    return result.rows[0] || null;
  }

  static async toggleVerified(id: number, isVerified: boolean): Promise<WorkflowTemplate | null> {
    const query = `
      UPDATE workflow_templates 
      SET is_verified = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isVerified, id]);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM workflow_templates WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const query = `
      SELECT category, COUNT(*) as count
      FROM workflow_templates
      WHERE is_public = true
      GROUP BY category
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getTags(): Promise<Array<{ tag: string; count: number }>> {
    const query = `
      SELECT tag, COUNT(*) as count
      FROM (
        SELECT jsonb_array_elements_text(tags) as tag
        FROM workflow_templates
        WHERE is_public = true
      ) t
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 50
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

// ========================================
// MODELO PARA AVALIAÇÕES DE TEMPLATE
// ========================================

export class TemplateRatingModel {
  static async create(templateId: number, userId: number, rating: number, review?: string): Promise<TemplateRating> {
    const query = `
      INSERT INTO template_ratings (template_id, user_id, rating, review)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (template_id, user_id)
      DO UPDATE SET rating = $3, review = $4, updated_at = NOW()
      RETURNING *
    `;
    
    const result = await pool.query(query, [templateId, userId, rating, review || null]);
    
    // Atualizar rating médio do template
    await WorkflowTemplateModel.updateRating(templateId);
    
    return result.rows[0];
  }

  static async findByTemplateId(templateId: number, limit: number = 20): Promise<TemplateRating[]> {
    const query = `
      SELECT tr.*, u.name as user_name
      FROM template_ratings tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.template_id = $1
      ORDER BY tr.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [templateId, limit]);
    return result.rows;
  }

  static async findByUserId(userId: number): Promise<TemplateRating[]> {
    const query = `
      SELECT tr.*, wt.name as template_name
      FROM template_ratings tr
      JOIN workflow_templates wt ON tr.template_id = wt.id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findUserRating(templateId: number, userId: number): Promise<TemplateRating | null> {
    const query = `
      SELECT * FROM template_ratings 
      WHERE template_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [templateId, userId]);
    return result.rows[0] || null;
  }

  static async toggleHelpful(id: number, isHelpful: boolean): Promise<TemplateRating | null> {
    const query = `
      UPDATE template_ratings 
      SET is_helpful = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isHelpful, id]);
    return result.rows[0] || null;
  }

  static async delete(templateId: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM template_ratings WHERE template_id = $1 AND user_id = $2';
    const result = await pool.query(query, [templateId, userId]);
    
    if ((result.rowCount || 0) > 0) {
      // Atualizar rating médio do template
      await WorkflowTemplateModel.updateRating(templateId);
      return true;
    }
    
    return false;
  }

  static async getRatingStats(templateId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating = 4) as four_star,
        COUNT(*) FILTER (WHERE rating = 3) as three_star,
        COUNT(*) FILTER (WHERE rating = 2) as two_star,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
      FROM template_ratings
      WHERE template_id = $1
    `;
    const result = await pool.query(query, [templateId]);
    return result.rows[0];
  }
}

// ========================================
// UTILITÁRIOS PARA TEMPLATES
// ========================================

export class TemplateUtils {
  /**
   * Valida dados de template
   */
  static validateTemplateData(data: CreateTemplateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Descrição deve ter pelo menos 10 caracteres');
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push('Categoria é obrigatória');
    }

    if (!data.workflow_data || !data.workflow_data.nodes || data.workflow_data.nodes.length === 0) {
      errors.push('Template deve conter pelo menos um nó');
    }

    if (data.variables) {
      data.variables.forEach((variable, index) => {
        if (!variable.name || !variable.type || !variable.label) {
          errors.push(`Variável ${index + 1}: nome, tipo e label são obrigatórios`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Substitui variáveis no workflow data
   */
  static replaceVariables(workflowData: WorkflowData, variables: Record<string, any>): WorkflowData {
    const dataString = JSON.stringify(workflowData);
    let replacedString = dataString;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      replacedString = replacedString.replace(regex, JSON.stringify(value));
    });

    return JSON.parse(replacedString);
  }

  /**
   * Extrai variáveis do workflow data
   */
  static extractVariables(workflowData: WorkflowData): string[] {
    const dataString = JSON.stringify(workflowData);
    const variableRegex = /{{([^}]+)}}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(dataString)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Gera preview do template
   */
  static generatePreview(workflowData: WorkflowData): string {
    const nodeCount = workflowData.nodes?.length || 0;
    const edgeCount = workflowData.edges?.length || 0;
    const integrations = new Set<string>();

    workflowData.nodes?.forEach(node => {
      if (node.type && node.type !== 'start' && node.type !== 'end') {
        integrations.add(node.type);
      }
    });

    return `Workflow com ${nodeCount} nós, ${edgeCount} conexões e ${integrations.size} integrações`;
  }

  /**
   * Categorias padrão para templates
   */
  static getDefaultCategories(): string[] {
    return [
      'Automação de Marketing',
      'Integração de Dados',
      'Notificações',
      'E-commerce',
      'Produtividade',
      'Análise de Dados',
      'Comunicação',
      'Backup e Sincronização',
      'Monitoramento',
      'Relatórios',
      'CRM',
      'Recursos Humanos',
      'Financeiro',
      'Desenvolvimento',
      'Outros'
    ];
  }

  /**
   * Tags sugeridas para templates
   */
  static getSuggestedTags(): string[] {
    return [
      'automação',
      'integração',
      'notificação',
      'email',
      'slack',
      'discord',
      'telegram',
      'whatsapp',
      'google-sheets',
      'notion',
      'airtable',
      'mysql',
      'mongodb',
      'webhook',
      'api',
      'cron',
      'agendamento',
      'relatório',
      'backup',
      'monitoramento',
      'crm',
      'marketing',
      'vendas',
      'suporte',
      'produtividade',
      'análise',
      'dashboard'
    ];
  }
}