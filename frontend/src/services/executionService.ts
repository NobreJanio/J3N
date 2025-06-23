import { authService } from './authService';

export interface Execution {
  id: string;
  workflow_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  execution_data: any;
  error_message?: string;
}

class ExecutionService {
  private baseURL = 'http://localhost:3001/api/executions';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await authService.authenticatedFetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkflowExecutions(workflowId: number): Promise<Execution[]> {
    const response = await this.request<{ success: boolean; data: Execution[] }>(`/workflow/${workflowId}`);
    return response.data || [];
  }

  async getExecution(executionId: string): Promise<Execution> {
    const response = await this.request<{ success: boolean; data: Execution }>(`/${executionId}`);
    return response.data;
  }

  async executeWorkflow(workflowId: number, inputData?: any): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(`/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({ inputData }),
    });
    return response.data;
  }

  async stopExecution(executionId: string): Promise<void> {
    await this.request(`/${executionId}/stop`, {
      method: 'POST',
    });
  }

  async getExecutionStats(workflowId?: number): Promise<any> {
    const endpoint = workflowId ? `/stats?workflowId=${workflowId}` : '/stats';
    const response = await this.request<{ success: boolean; data: any }>(endpoint);
    return response.data;
  }

  async getRunningExecutions(): Promise<Execution[]> {
    const response = await this.request<{ success: boolean; data: Execution[] }>('/running');
    return response.data;
  }

  async deleteExecution(executionId: string): Promise<void> {
    await this.request(`/${executionId}`, {
      method: 'DELETE'
    });
  }
}

export const executionService = new ExecutionService(); 