import { authService } from './authService';

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
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  is_active?: boolean;
  workflow_data: WorkflowData;
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  is_active?: boolean;
  workflow_data?: WorkflowData;
}

class WorkflowService {
  private baseURL = 'http://localhost:3001/api/workflows';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authService.getToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Listar todos os workflows do usuário
  async getWorkflows(): Promise<Workflow[]> {
    return this.request<Workflow[]>('');
  }

  // Buscar workflow específico
  async getWorkflow(id: number): Promise<Workflow> {
    return this.request<Workflow>(`/${id}`);
  }

  // Criar novo workflow
  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    return this.request<Workflow>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Atualizar workflow
  async updateWorkflow(id: number, data: UpdateWorkflowData): Promise<Workflow> {
    return this.request<Workflow>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Deletar workflow
  async deleteWorkflow(id: number): Promise<void> {
    await this.request<{ message: string }>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Alternar status ativo/inativo
  async toggleWorkflowActive(id: number): Promise<Workflow> {
    return this.request<Workflow>(`/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  // Duplicar workflow
  async duplicateWorkflow(id: number, name: string): Promise<Workflow> {
    return this.request<Workflow>(`/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Salvar workflow atual (criar ou atualizar)
  async saveCurrentWorkflow(
    workflowId: number | null,
    name: string,
    workflowData: WorkflowData,
    description?: string
  ): Promise<Workflow> {
    if (workflowId) {
      // Atualizar workflow existente
      return this.updateWorkflow(workflowId, {
        name,
        workflow_data: workflowData,
        description,
      });
    } else {
      // Criar novo workflow
      return this.createWorkflow({
        name,
        workflow_data: workflowData,
        description,
        is_active: true,
      });
    }
  }
}

export const workflowService = new WorkflowService(); 