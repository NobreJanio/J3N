import pool from '../config/database';
import crypto from 'crypto';

// Chave de criptografia - em produção deve vir de variável de ambiente
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const ALGORITHM = 'aes-256-cbc';

export interface Credential {
  id: number;
  name: string;
  type: string;
  user_id: number;
  credential_data: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCredentialData {
  name: string;
  type: string;
  user_id: number;
  credential_data: any;
  is_active?: boolean;
}

export interface UpdateCredentialData {
  name?: string;
  credential_data?: any;
  is_active?: boolean;
}

export class CredentialModel {
  // Criptografar dados sensíveis
  private static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erro na criptografia:', error);
      throw new Error('Falha ao criptografar dados');
    }
  }

  // Descriptografar dados sensíveis
  private static decrypt(encryptedText: string): string {
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedData = textParts.join(':');
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Erro na descriptografia:', error);
      throw new Error('Falha ao descriptografar dados');
    }
  }

  static async findById(id: number): Promise<Credential | null> {
    const query = 'SELECT * FROM credentials WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows[0]) {
      const credential = result.rows[0];
      // Descriptografar dados antes de retornar
      try {
        const decryptedData = this.decrypt(credential.credential_data);
        credential.credential_data = JSON.parse(decryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar credencial:', error);
        credential.credential_data = {};
      }
      return credential;
    }
    
    return null;
  }

  static async findByUserId(userId: number): Promise<Credential[]> {
    const query = `
      SELECT id, name, type, user_id, is_active, created_at, updated_at 
      FROM credentials 
      WHERE user_id = $1 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findByUserIdAndType(userId: number, type: string): Promise<Credential[]> {
    const query = `
      SELECT * FROM credentials 
      WHERE user_id = $1 AND type = $2 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [userId, type]);
    
    return result.rows.map(credential => {
      try {
        const decryptedData = this.decrypt(credential.credential_data);
        credential.credential_data = JSON.parse(decryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar credencial:', error);
        credential.credential_data = {};
      }
      return credential;
    });
  }

  static async findByName(userId: number, name: string): Promise<Credential | null> {
    const query = 'SELECT * FROM credentials WHERE user_id = $1 AND name = $2';
    const result = await pool.query(query, [userId, name]);
    
    if (result.rows[0]) {
      const credential = result.rows[0];
      try {
        const decryptedData = this.decrypt(credential.credential_data);
        credential.credential_data = JSON.parse(decryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar credencial:', error);
        credential.credential_data = {};
      }
      return credential;
    }
    
    return null;
  }

  static async create(data: CreateCredentialData): Promise<Credential> {
    // Serializar dados (criptografia desabilitada temporariamente)
    const credentialDataString = JSON.stringify(data.credential_data);
    
    const query = `
      INSERT INTO credentials (name, type, user_id, credential_data, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, type, user_id, is_active, created_at, updated_at
    `;
    
    const values = [
      data.name,
      data.type,
      data.user_id,
      credentialDataString,
      data.is_active ?? true
    ];
    
    const result = await pool.query(query, values);
    const credential = result.rows[0];
    credential.credential_data = data.credential_data; // Retornar dados não criptografados
    return credential;
  }

  static async update(id: number, data: UpdateCredentialData): Promise<Credential | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.credential_data !== undefined) {
      const encryptedData = this.encrypt(JSON.stringify(data.credential_data));
      fields.push(`credential_data = $${paramCount}`);
      values.push(encryptedData);
      paramCount++;
    }

    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(data.is_active);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE credentials 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows[0]) {
      const credential = result.rows[0];
      try {
        const decryptedData = this.decrypt(credential.credential_data);
        credential.credential_data = JSON.parse(decryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar credencial:', error);
        credential.credential_data = {};
      }
      return credential;
    }
    
    return null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'UPDATE credentials SET is_active = false WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const query = 'DELETE FROM credentials WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async testCredential(id: number): Promise<{ success: boolean; message: string }> {
    const credential = await this.findById(id);
    
    if (!credential) {
      return { success: false, message: 'Credencial não encontrada' };
    }

    // Aqui você implementaria testes específicos para cada tipo de credencial
    switch (credential.type) {
      // Slack removido - case 'slackApi' removido
      default:
        return { success: true, message: 'Teste não implementado para este tipo de credencial' };
    }
  }

  // Método testSlackCredential removido - Slack removido

  static async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM credentials WHERE is_active = true';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async getCredentialTypes(): Promise<string[]> {
    const query = 'SELECT DISTINCT type FROM credentials WHERE is_active = true ORDER BY type';
    const result = await pool.query(query);
    return result.rows.map(row => row.type);
  }
} 