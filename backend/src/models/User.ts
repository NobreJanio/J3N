import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create(data: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [data.name, data.email, hashedPassword];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async createAdminUser(email: string, password: string): Promise<User | null> {
    try {
      // Verifica se já existe um usuário com este email
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        console.log('👤 Usuário admin já existe:', email);
        return existingUser;
      }

      // Cria o usuário admin
      const adminUser = await this.create({
        name: 'Administrador',
        email,
        password
      });

      console.log('✅ Usuário admin criado:', email);
      return adminUser;
    } catch (error) {
      console.error('❌ Erro ao criar usuário admin:', error);
      return null;
    }
  }

  static async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async updatePassword(id: number, hashedPassword: string): Promise<void> {
    const query = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
    await pool.query(query, [hashedPassword, id]);
  }
} 