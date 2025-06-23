import { pool } from '../config/database';
import { WorkflowData } from './Workflow';

// ========================================
// INTERFACES PARA VERSIONAMENTO
// ========================================

export interface WorkflowVersion {
  id: number;
  workflow_id: number;
  version_number: string;
  version_name?: string;
  description?: string;
  workflow_data: WorkflowData;
  created_by: number;
  created_at: Date;
  is_current: boolean;
  is_published: boolean;
  change_summary: string[];
  breaking_changes: string[];
  rollback_data?: any;
  file_size_bytes: number;
  node_count: number;
  edge_count: number;
  tags: string[];
}

export interface VersionComparison {
  id: number;
  workflow_id: number;
  version_from: number;
  version_to: number;
  comparison_data: VersionDiff;
  created_by: number;
  created_at: Date;
}

export interface VersionDiff {
  nodes: {
    added: any[];
    removed: any[];
    modified: Array<{
      id: string;
      changes: Record<string, { old: any; new: any }>;
    }>;
  };
  edges: {
    added: any[];
    removed: any[];
    modified: Array<{
      id: string;
      changes: Record<string, { old: any; new: any }>;
    }>;
  };
  metadata: {
    name?: { old: string; new: string };
    description?: { old: string; new: string };
    tags?: { old: string[]; new: string[] };
  };
  statistics: {
    totalChanges: number;
    nodesChanged: number;
    edgesChanged: number;
    metadataChanged: number;
  };
}

export interface CreateVersionData {
  workflow_id: number;
  version_name?: string;
  description?: string;
  workflow_data: WorkflowData;
  created_by: number;
  change_summary?: string[];
  breaking_changes?: string[];
  tags?: string[];
  is_published?: boolean;
}

export interface VersionBranch {
  id: number;
  workflow_id: number;
  branch_name: string;
  description?: string;
  base_version_id: number;
  created_by: number;
  created_at: Date;
  is_active: boolean;
  merge_target?: string;
}

export interface VersionMerge {
  id: number;
  workflow_id: number;
  source_version_id: number;
  target_version_id: number;
  merged_version_id: number;
  merge_strategy: 'auto' | 'manual' | 'theirs' | 'ours';
  conflicts_resolved: any[];
  merged_by: number;
  merged_at: Date;
}

// ========================================
// MODELO PARA VERSÕES DE WORKFLOW
// ========================================

export class WorkflowVersionModel {
  static async create(data: CreateVersionData): Promise<WorkflowVersion> {
    // Gerar número da versão automaticamente
    const versionNumber = await this.generateVersionNumber(data.workflow_id);
    
    // Calcular estatísticas
    const nodeCount = data.workflow_data.nodes?.length || 0;
    const edgeCount = data.workflow_data.edges?.length || 0;
    const fileSizeBytes = Buffer.byteLength(JSON.stringify(data.workflow_data), 'utf8');
    
    const query = `
      INSERT INTO workflow_versions (
        workflow_id, version_number, version_name, description, workflow_data,
        created_by, change_summary, breaking_changes, file_size_bytes,
        node_count, edge_count, tags, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      data.workflow_id,
      versionNumber,
      data.version_name || null,
      data.description || null,
      JSON.stringify(data.workflow_data),
      data.created_by,
      JSON.stringify(data.change_summary || []),
      JSON.stringify(data.breaking_changes || []),
      fileSizeBytes,
      nodeCount,
      edgeCount,
      JSON.stringify(data.tags || []),
      data.is_published !== false
    ];
    
    const result = await pool.query(query, values);
    const version = result.rows[0];
    
    // Parse JSON fields
    version.workflow_data = JSON.parse(version.workflow_data);
    version.change_summary = JSON.parse(version.change_summary);
    version.breaking_changes = JSON.parse(version.breaking_changes);
    version.tags = JSON.parse(version.tags);
    
    // Se esta é uma versão publicada, atualizar a versão atual
    if (data.is_published !== false) {
      await this.setCurrentVersion(data.workflow_id, version.id);
    }
    
    return version;
  }

  static async findById(id: number): Promise<WorkflowVersion | null> {
    const query = `
      SELECT wv.*, u.name as created_by_name, w.name as workflow_name
      FROM workflow_versions wv
      JOIN users u ON wv.created_by = u.id
      JOIN workflows w ON wv.workflow_id = w.id
      WHERE wv.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const version = result.rows[0];
    version.workflow_data = JSON.parse(version.workflow_data);
    version.change_summary = JSON.parse(version.change_summary);
    version.breaking_changes = JSON.parse(version.breaking_changes);
    version.tags = JSON.parse(version.tags);
    if (version.rollback_data) {
      version.rollback_data = JSON.parse(version.rollback_data);
    }
    
    return version;
  }

  static async findByWorkflowId(workflowId: number, limit: number = 50): Promise<WorkflowVersion[]> {
    const query = `
      SELECT wv.*, u.name as created_by_name
      FROM workflow_versions wv
      JOIN users u ON wv.created_by = u.id
      WHERE wv.workflow_id = $1
      ORDER BY wv.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [workflowId, limit]);
    
    return result.rows.map(version => {
      version.workflow_data = JSON.parse(version.workflow_data);
      version.change_summary = JSON.parse(version.change_summary);
      version.breaking_changes = JSON.parse(version.breaking_changes);
      version.tags = JSON.parse(version.tags);
      if (version.rollback_data) {
        version.rollback_data = JSON.parse(version.rollback_data);
      }
      return version;
    });
  }

  static async findCurrentVersion(workflowId: number): Promise<WorkflowVersion | null> {
    const query = `
      SELECT wv.*, u.name as created_by_name
      FROM workflow_versions wv
      JOIN users u ON wv.created_by = u.id
      WHERE wv.workflow_id = $1 AND wv.is_current = true
    `;
    const result = await pool.query(query, [workflowId]);
    
    if (result.rows.length === 0) return null;
    
    const version = result.rows[0];
    version.workflow_data = JSON.parse(version.workflow_data);
    version.change_summary = JSON.parse(version.change_summary);
    version.breaking_changes = JSON.parse(version.breaking_changes);
    version.tags = JSON.parse(version.tags);
    if (version.rollback_data) {
      version.rollback_data = JSON.parse(version.rollback_data);
    }
    
    return version;
  }

  static async findPublishedVersions(workflowId: number): Promise<WorkflowVersion[]> {
    const query = `
      SELECT wv.*, u.name as created_by_name
      FROM workflow_versions wv
      JOIN users u ON wv.created_by = u.id
      WHERE wv.workflow_id = $1 AND wv.is_published = true
      ORDER BY wv.created_at DESC
    `;
    const result = await pool.query(query, [workflowId]);
    
    return result.rows.map(version => {
      version.workflow_data = JSON.parse(version.workflow_data);
      version.change_summary = JSON.parse(version.change_summary);
      version.breaking_changes = JSON.parse(version.breaking_changes);
      version.tags = JSON.parse(version.tags);
      if (version.rollback_data) {
        version.rollback_data = JSON.parse(version.rollback_data);
      }
      return version;
    });
  }

  static async setCurrentVersion(workflowId: number, versionId: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remover flag is_current de todas as versões
      await client.query(
        'UPDATE workflow_versions SET is_current = false WHERE workflow_id = $1',
        [workflowId]
      );
      
      // Definir nova versão atual
      await client.query(
        'UPDATE workflow_versions SET is_current = true WHERE id = $1',
        [versionId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async rollbackToVersion(workflowId: number, versionId: number, userId: number): Promise<WorkflowVersion> {
    // Buscar a versão para rollback
    const targetVersion = await this.findById(versionId);
    if (!targetVersion) {
      throw new Error('Versão não encontrada');
    }
    
    // Criar nova versão com os dados da versão de rollback
    const rollbackData: CreateVersionData = {
      workflow_id: workflowId,
      version_name: `Rollback para ${targetVersion.version_number}`,
      description: `Rollback automático para versão ${targetVersion.version_number}`,
      workflow_data: targetVersion.workflow_data,
      created_by: userId,
      change_summary: [`Rollback para versão ${targetVersion.version_number}`],
      tags: ['rollback'],
      is_published: true
    };
    
    return await this.create(rollbackData);
  }

  static async update(id: number, data: Partial<CreateVersionData>): Promise<WorkflowVersion | null> {
    const fields: string[] = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'workflow_id' && key !== 'created_by') {
        if (['workflow_data', 'change_summary', 'breaking_changes', 'tags'].includes(key)) {
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
      UPDATE workflow_versions 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    values.push(id);
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    
    const version = result.rows[0];
    version.workflow_data = JSON.parse(version.workflow_data);
    version.change_summary = JSON.parse(version.change_summary);
    version.breaking_changes = JSON.parse(version.breaking_changes);
    version.tags = JSON.parse(version.tags);
    
    return version;
  }

  static async delete(id: number): Promise<boolean> {
    // Verificar se não é a versão atual
    const version = await this.findById(id);
    if (version?.is_current) {
      throw new Error('Não é possível excluir a versão atual');
    }
    
    const query = 'DELETE FROM workflow_versions WHERE id = $1 AND is_current = false';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async generateVersionNumber(workflowId: number): Promise<string> {
    const query = `
      SELECT version_number 
      FROM workflow_versions 
      WHERE workflow_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [workflowId]);
    
    if (result.rows.length === 0) {
      return '1.0.0';
    }
    
    const lastVersion = result.rows[0].version_number;
    const [major, minor, patch] = lastVersion.split('.').map(Number);
    
    // Incrementar patch por padrão
    return `${major}.${minor}.${patch + 1}`;
  }

  static async getVersionStats(workflowId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_versions,
        COUNT(*) FILTER (WHERE is_published = true) as published_versions,
        MAX(created_at) as last_version_date,
        AVG(file_size_bytes) as avg_file_size,
        SUM(file_size_bytes) as total_file_size
      FROM workflow_versions
      WHERE workflow_id = $1
    `;
    const result = await pool.query(query, [workflowId]);
    return result.rows[0];
  }
}

// ========================================
// MODELO PARA COMPARAÇÃO DE VERSÕES
// ========================================

export class VersionComparisonModel {
  static async create(
    workflowId: number,
    versionFromId: number,
    versionToId: number,
    userId: number
  ): Promise<VersionComparison> {
    // Buscar as duas versões
    const [versionFrom, versionTo] = await Promise.all([
      WorkflowVersionModel.findById(versionFromId),
      WorkflowVersionModel.findById(versionToId)
    ]);
    
    if (!versionFrom || !versionTo) {
      throw new Error('Uma ou ambas as versões não foram encontradas');
    }
    
    // Gerar comparação
    const comparisonData = VersioningUtils.compareVersions(versionFrom, versionTo);
    
    const query = `
      INSERT INTO version_comparisons (workflow_id, version_from, version_to, comparison_data, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      workflowId,
      versionFromId,
      versionToId,
      JSON.stringify(comparisonData),
      userId
    ];
    
    const result = await pool.query(query, values);
    const comparison = result.rows[0];
    comparison.comparison_data = JSON.parse(comparison.comparison_data);
    
    return comparison;
  }

  static async findById(id: number): Promise<VersionComparison | null> {
    const query = `
      SELECT vc.*, u.name as created_by_name,
             vf.version_number as version_from_number,
             vt.version_number as version_to_number
      FROM version_comparisons vc
      JOIN users u ON vc.created_by = u.id
      JOIN workflow_versions vf ON vc.version_from = vf.id
      JOIN workflow_versions vt ON vc.version_to = vt.id
      WHERE vc.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const comparison = result.rows[0];
    comparison.comparison_data = JSON.parse(comparison.comparison_data);
    
    return comparison;
  }

  static async findByWorkflowId(workflowId: number, limit: number = 20): Promise<VersionComparison[]> {
    const query = `
      SELECT vc.*, u.name as created_by_name,
             vf.version_number as version_from_number,
             vt.version_number as version_to_number
      FROM version_comparisons vc
      JOIN users u ON vc.created_by = u.id
      JOIN workflow_versions vf ON vc.version_from = vf.id
      JOIN workflow_versions vt ON vc.version_to = vt.id
      WHERE vc.workflow_id = $1
      ORDER BY vc.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [workflowId, limit]);
    
    return result.rows.map(comparison => {
      comparison.comparison_data = JSON.parse(comparison.comparison_data);
      return comparison;
    });
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM version_comparisons WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
}

// ========================================
// UTILITÁRIOS PARA VERSIONAMENTO
// ========================================

export class VersioningUtils {
  /**
   * Compara duas versões de workflow
   */
  static compareVersions(versionFrom: WorkflowVersion, versionTo: WorkflowVersion): VersionDiff {
    const diff: VersionDiff = {
      nodes: { added: [], removed: [], modified: [] },
      edges: { added: [], removed: [], modified: [] },
      metadata: {},
      statistics: { totalChanges: 0, nodesChanged: 0, edgesChanged: 0, metadataChanged: 0 }
    };

    // Comparar nós
    const fromNodes = new Map(versionFrom.workflow_data.nodes?.map(n => [n.id, n]) || []);
    const toNodes = new Map(versionTo.workflow_data.nodes?.map(n => [n.id, n]) || []);

    // Nós adicionados
    toNodes.forEach((node, id) => {
      if (!fromNodes.has(id)) {
        diff.nodes.added.push(node);
      }
    });

    // Nós removidos
    fromNodes.forEach((node, id) => {
      if (!toNodes.has(id)) {
        diff.nodes.removed.push(node);
      }
    });

    // Nós modificados
    fromNodes.forEach((fromNode, id) => {
      const toNode = toNodes.get(id);
      if (toNode) {
        const changes = this.compareObjects(fromNode, toNode);
        if (Object.keys(changes).length > 0) {
          diff.nodes.modified.push({ id, changes });
        }
      }
    });

    // Comparar edges
    const fromEdges = new Map(versionFrom.workflow_data.edges?.map(e => [e.id, e]) || []);
    const toEdges = new Map(versionTo.workflow_data.edges?.map(e => [e.id, e]) || []);

    // Edges adicionadas
    toEdges.forEach((edge, id) => {
      if (!fromEdges.has(id)) {
        diff.edges.added.push(edge);
      }
    });

    // Edges removidas
    fromEdges.forEach((edge, id) => {
      if (!toEdges.has(id)) {
        diff.edges.removed.push(edge);
      }
    });

    // Edges modificadas
    fromEdges.forEach((fromEdge, id) => {
      const toEdge = toEdges.get(id);
      if (toEdge) {
        const changes = this.compareObjects(fromEdge, toEdge);
        if (Object.keys(changes).length > 0) {
          diff.edges.modified.push({ id, changes });
        }
      }
    });

    // Comparar metadados (se disponível no workflow_data)
    // Note: name is not part of workflow_data, skipping this comparison
    // if (versionFrom.workflow_data.name !== versionTo.workflow_data.name) {
    //   diff.metadata.name = {
    //     old: versionFrom.workflow_data.name || '',
    //     new: versionTo.workflow_data.name || ''
    //   };
    // }

    // Note: description is not part of workflow_data, skipping this comparison
    // if (versionFrom.workflow_data.description !== versionTo.workflow_data.description) {
    //   diff.metadata.description = {
    //     old: versionFrom.workflow_data.description || '',
    //     new: versionTo.workflow_data.description || ''
    //   };
    // }

    // Calcular estatísticas
    diff.statistics.nodesChanged = diff.nodes.added.length + diff.nodes.removed.length + diff.nodes.modified.length;
    diff.statistics.edgesChanged = diff.edges.added.length + diff.edges.removed.length + diff.edges.modified.length;
    diff.statistics.metadataChanged = Object.keys(diff.metadata).length;
    diff.statistics.totalChanges = diff.statistics.nodesChanged + diff.statistics.edgesChanged + diff.statistics.metadataChanged;

    return diff;
  }

  /**
   * Compara dois objetos e retorna as diferenças
   */
  private static compareObjects(obj1: any, obj2: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes[key] = { old: val1, new: val2 };
      }
    });

    return changes;
  }

  /**
   * Gera resumo de mudanças automaticamente
   */
  static generateChangeSummary(diff: VersionDiff): string[] {
    const summary: string[] = [];

    if (diff.nodes.added.length > 0) {
      summary.push(`${diff.nodes.added.length} nó(s) adicionado(s)`);
    }

    if (diff.nodes.removed.length > 0) {
      summary.push(`${diff.nodes.removed.length} nó(s) removido(s)`);
    }

    if (diff.nodes.modified.length > 0) {
      summary.push(`${diff.nodes.modified.length} nó(s) modificado(s)`);
    }

    if (diff.edges.added.length > 0) {
      summary.push(`${diff.edges.added.length} conexão(ões) adicionada(s)`);
    }

    if (diff.edges.removed.length > 0) {
      summary.push(`${diff.edges.removed.length} conexão(ões) removida(s)`);
    }

    if (diff.edges.modified.length > 0) {
      summary.push(`${diff.edges.modified.length} conexão(ões) modificada(s)`);
    }

    if (Object.keys(diff.metadata).length > 0) {
      summary.push('Metadados atualizados');
    }

    if (summary.length === 0) {
      summary.push('Nenhuma alteração detectada');
    }

    return summary;
  }

  /**
   * Valida número de versão semântica
   */
  static validateVersionNumber(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Incrementa versão baseado no tipo de mudança
   */
  static incrementVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch'): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Detecta tipo de mudança baseado no diff
   */
  static detectChangeType(diff: VersionDiff): 'major' | 'minor' | 'patch' {
    // Major: nós removidos ou mudanças estruturais significativas
    if (diff.nodes.removed.length > 0 || diff.edges.removed.length > 0) {
      return 'major';
    }

    // Minor: nós adicionados
    if (diff.nodes.added.length > 0 || diff.edges.added.length > 0) {
      return 'minor';
    }

    // Patch: apenas modificações
    return 'patch';
  }

  /**
   * Gera tags automáticas baseado nas mudanças
   */
  static generateAutoTags(diff: VersionDiff): string[] {
    const tags: string[] = [];

    if (diff.nodes.added.length > 0) tags.push('feature');
    if (diff.nodes.removed.length > 0) tags.push('breaking-change');
    if (diff.nodes.modified.length > 0) tags.push('improvement');
    if (diff.edges.added.length > 0 || diff.edges.modified.length > 0) tags.push('workflow-update');
    if (Object.keys(diff.metadata).length > 0) tags.push('metadata-update');

    return tags;
  }

  /**
   * Calcula compatibilidade entre versões
   */
  static calculateCompatibility(versionFrom: string, versionTo: string): {
    compatible: boolean;
    reason?: string;
  } {
    const [fromMajor, fromMinor] = versionFrom.split('.').map(Number);
    const [toMajor, toMinor] = versionTo.split('.').map(Number);

    if (toMajor > fromMajor) {
      return {
        compatible: false,
        reason: 'Versão major incompatível - podem existir mudanças estruturais'
      };
    }

    if (toMajor === fromMajor && toMinor >= fromMinor) {
      return { compatible: true };
    }

    return {
      compatible: false,
      reason: 'Versão anterior - pode ter funcionalidades removidas'
    };
  }
}