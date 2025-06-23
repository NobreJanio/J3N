import { Pool } from 'pg';
import pool from '../config/database';

interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}

export class UserService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
    const query = `
      SELECT id, name, email, role, created_at as "createdAt", last_login as "lastLogin"
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query);
    return result.rows;
  }

  async getUserById(id: number): Promise<User | null> {
    const query = `
      SELECT id, name, email, password_hash, role, created_at as "createdAt", last_login as "lastLogin"
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, name, email, password_hash, role, created_at as "createdAt", last_login as "lastLogin"
      FROM users 
      WHERE email = $1
    `;
    
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, password_hash, role, created_at as "createdAt", last_login as "lastLogin"
    `;
    
    const result = await this.db.query(query, [
      userData.name,
      userData.email,
      userData.password,
      userData.role
    ]);
    
    return result.rows[0];
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(userData.name);
      paramCount++;
    }

    if (userData.email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(userData.email);
      paramCount++;
    }

    if (userData.role !== undefined) {
      fields.push(`role = $${paramCount}`);
      values.push(userData.role);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, name, email, password_hash, role, created_at as "createdAt", last_login as "lastLogin"
    `;
    
    values.push(id);
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async updateLastLogin(id: number): Promise<void> {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    await this.db.query(query, [id]);
  }
} 