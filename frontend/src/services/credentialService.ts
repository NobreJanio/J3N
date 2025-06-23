interface Credential {
  id: number;
  name: string;
  type: string;
  user_id: number;
  credential_data?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CredentialType {
  type: string;
  displayName: string;
  description: string;
  fields: CredentialField[];
}

interface CredentialField {
  name: string;
  displayName: string;
  type: 'string' | 'password' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

interface CreateCredentialData {
  name: string;
  type: string;
  credential_data: any;
}

interface UpdateCredentialData {
  name?: string;
  credential_data?: any;
}

export class CredentialService {
  private static getAuthHeaders() {
    // Verificar todas as possíveis chaves de token
    const possibleKeys = ['auth_token', 'token', 'authToken', 'accessToken'];
    let token: string | null = null;
    
    for (const key of possibleKeys) {
      const storedToken = localStorage.getItem(key);
      if (storedToken) {
        token = storedToken;
        console.log(`CredentialService: Token encontrado na chave '${key}':`, `${token.substring(0, 20)}...`);
        break;
      }
    }
    
    if (!token) {
      console.error('CredentialService: Nenhum token encontrado no localStorage');
      console.error('CredentialService: Chaves verificadas:', possibleKeys.join(', '));
      console.error('CredentialService: Conteúdo do localStorage:', Object.keys(localStorage));
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Buscar todas as credenciais do usuário
   */
  static async getCredentials(): Promise<Credential[]> {
    try {
      console.log('CredentialService: Iniciando busca de credenciais...');
      const headers = this.getAuthHeaders();
      console.log('CredentialService: Headers de autenticação:', headers);
      
      const response = await fetch('/api/credentials', {
        headers
      });

      console.log('CredentialService: Response status:', response.status);
      console.log('CredentialService: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CredentialService: Erro na resposta:', errorText);
        throw new Error(`Erro ao buscar credenciais: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('CredentialService: Resposta do servidor (texto):', responseText);
      
      if (!responseText) {
        throw new Error('Resposta vazia do servidor');
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('CredentialService: Erro ao parsear JSON:', jsonError);
        console.error('CredentialService: Resposta recebida:', responseText);
        throw new Error('Resposta do servidor não é um JSON válido');
      }
      console.log('CredentialService: Resultado da API:', result);
      return result.data;
    } catch (error) {
      console.error('CredentialService: Erro ao buscar credenciais:', error);
      throw error;
    }
  }

  /**
   * Buscar tipos de credenciais disponíveis
   */
  static async getCredentialTypes(): Promise<CredentialType[]> {
    try {
      console.log('CredentialService: Fazendo requisição para /api/credentials/types');
      const headers = this.getAuthHeaders();
      console.log('CredentialService: Headers:', headers);
      
      const response = await fetch('/api/credentials/types', {
        headers
      });

      console.log('CredentialService: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CredentialService: Response error:', errorText);
        throw new Error(`Erro ao buscar tipos de credenciais: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('CredentialService: Response data:', result);
      return result.data;
    } catch (error) {
      console.error('CredentialService: Erro ao buscar tipos de credenciais:', error);
      throw error;
    }
  }

  /**
   * Buscar credenciais por tipo
   */
  static async getCredentialsByType(type: string): Promise<Credential[]> {
    try {
      const response = await fetch(`/api/credentials/type/${type}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar credenciais por tipo');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar credenciais por tipo:', error);
      throw error;
    }
  }

  /**
   * Buscar credencial específica
   */
  static async getCredential(id: number): Promise<Credential> {
    try {
      const response = await fetch(`/api/credentials/${id}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar credencial');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar credencial:', error);
      throw error;
    }
  }

  /**
   * Criar nova credencial
   */
  static async createCredential(data: CreateCredentialData): Promise<Credential> {
    try {
      console.log('CredentialService: Criando credencial:', data);
      const headers = this.getAuthHeaders();
      console.log('CredentialService: Headers para criação:', headers);
      
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      console.log('CredentialService: Response status:', response.status);
      console.log('CredentialService: Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Erro ao criar credencial';
        try {
          const responseText = await response.text();
          console.error('CredentialService: Resposta de erro (texto):', responseText);
          
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              console.error('CredentialService: Resposta não é JSON válido:', jsonError);
              errorMessage = `Erro ${response.status}: ${responseText}`;
            }
          } else {
            errorMessage = `Erro ${response.status}: Resposta vazia do servidor`;
          }
        } catch (textError) {
          console.error('CredentialService: Erro ao ler resposta como texto:', textError);
          errorMessage = `Erro ${response.status}: Não foi possível ler a resposta`;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('CredentialService: Resposta do servidor (texto):', responseText);
      
      if (!responseText) {
        throw new Error('Resposta vazia do servidor');
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('CredentialService: Erro ao parsear JSON:', jsonError);
        console.error('CredentialService: Resposta recebida:', responseText);
        throw new Error('Resposta do servidor não é um JSON válido');
      }
      console.log('CredentialService: Credencial criada com sucesso:', result);
      return result.data;
    } catch (error) {
      console.error('CredentialService: Erro ao criar credencial:', error);
      throw error;
    }
  }

  /**
   * Atualizar credencial
   */
  static async updateCredential(id: number, data: UpdateCredentialData): Promise<Credential> {
    try {
      const response = await fetch(`/api/credentials/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar credencial');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao atualizar credencial:', error);
      throw error;
    }
  }

  /**
   * Testar credencial
   */
  static async testCredential(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/credentials/${id}/test`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao testar credencial');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao testar credencial:', error);
      throw error;
    }
  }

  /**
   * Deletar credencial
   */
  static async deleteCredential(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar credencial');
      }
    } catch (error) {
      console.error('Erro ao deletar credencial:', error);
      throw error;
    }
  }

  /**
   * Validar dados de credencial
   */
  static validateCredentialData(type: string, data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      // Slack removido - case 'slackApi' removido
      
      default:
        // Validação genérica
        if (!data || Object.keys(data).length === 0) {
          errors.push('Dados da credencial são obrigatórios');
        }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Obter campos necessários para um tipo de credencial
   */
  static async getCredentialFields(type: string): Promise<CredentialField[]> {
    const types = await this.getCredentialTypes();
    const credentialType = types.find(t => t.type === type);
    return credentialType?.fields || [];
  }
} 