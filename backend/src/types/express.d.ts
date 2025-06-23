import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
        created_at: Date;
        updated_at: Date;
      };
      pagination?: {
        limit: number;
        offset: number;
      };
    }
  }
}

export {};