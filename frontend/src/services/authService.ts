const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Recupera o token do localStorage na inicialização
    this.token = localStorage.getItem('auth_token');
  }

  // Login do usuário
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no login');
      }

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Logout do usuário
  async logout(): Promise<void> {
    try {
      // Chama o endpoint de logout (opcional, já que JWT é stateless)
      if (this.token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Remove o token independentemente do resultado da API
      this.removeToken();
    }
  }

  // Verificar se o token é válido
  async verifyToken(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (!response.ok || !data.success) {
        this.removeToken();
        return null;
      }

      return data.data?.user || null;
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      this.removeToken();
      return null;
    }
  }

  // Obter dados do usuário atual
  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return data.data?.user || null;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  }

  // Definir token
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Remover token
  removeToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Obter token atual
  getToken(): string | null {
    return this.token;
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Obter headers de autorização
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Fazer requisição autenticada
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Se receber 401, remove o token e redireciona para login
    if (response.status === 401) {
      this.removeToken();
      window.location.href = '/login';
    }

    return response;
  }
}

// Exporta uma instância singleton
export const authService = new AuthService();
export default authService; 