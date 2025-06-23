import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import workflowRoutes from './routes/workflows';
import nodeRoutes from './routes/nodeRoutes';
import credentialRoutes from './routes/credentialRoutes';
import executionRoutes from './routes/executionRoutes';
import userRoutes from './routes/userRoutes';
import analyticsRoutes from './routes/analytics';
import schedulingRoutes from './routes/scheduling';
import webhooksRoutes from './routes/webhooks';
import templatesRoutes from './routes/templates';
import versioningRoutes from './routes/versioning';
import { authenticateToken } from './middleware/auth';
import { UserModel } from './models/User';
import pool from './config/database';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FlowBuilder API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rotas públicas (sem autenticação)
app.use('/api/auth', authRoutes);

// Rotas protegidas (com autenticação)
app.use('/api/workflows', authenticateToken, workflowRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/versioning', versioningRoutes);

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Função para criar usuário admin inicial
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  ADMIN_EMAIL e ADMIN_PASSWORD não configurados no .env');
      console.log('⚠️  Usuário admin não será criado automaticamente');
      return;
    }

    await UserModel.createAdminUser(adminEmail, adminPassword);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  }
}

// Teste de conexão com o banco antes de iniciar o servidor
async function startServer() {
  try {
    // Teste de conexão com o banco
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida');

    // Criar usuário admin se não existir
    await createAdminUser();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor FlowBuilder rodando na porta ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`🌍 CORS configurado para: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      
      if (process.env.ADMIN_EMAIL) {
        console.log(`👤 Admin user: ${process.env.ADMIN_EMAIL}`);
      }
    });
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  }
}

startServer();