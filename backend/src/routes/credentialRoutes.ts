import express from 'express';
import { CredentialModel } from '../models/Credential';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/credentials - Listar credenciais do usuário
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const credentials = await CredentialModel.findByUserId(userId);
    
    return res.json({
      success: true,
      data: credentials
    });
  } catch (error) {
    console.error('Erro ao buscar credenciais:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/credentials/types - Listar tipos de credenciais disponíveis
router.get('/types', async (req, res) => {
  try {
    // Retornar tipos de credenciais baseados nos nodes modulares
    const availableTypes = [
      {
        type: 'apiKey',
        displayName: 'API Key',
        description: 'Credencial genérica com API Key',
        fields: [
          {
            name: 'apiKey',
            displayName: 'API Key',
            type: 'password',
            required: true,
            description: 'Sua chave de API'
          }
        ]
      },
          // Slack removido
      {
        type: 'httpBasicAuth',
        displayName: 'HTTP Basic Auth',
        description: 'Autenticação básica HTTP com usuário e senha',
        fields: [
          {
            name: 'username',
            displayName: 'Username',
            type: 'string',
            required: true,
            description: 'Nome de usuário'
          },
          {
            name: 'password',
            displayName: 'Password',
            type: 'password',
            required: true,
            description: 'Senha'
          }
        ]
      },
      {
        type: 'httpHeaderAuth',
        displayName: 'HTTP Header Auth',
        description: 'Autenticação via cabeçalho HTTP personalizado',
        fields: [
          {
            name: 'headerName',
            displayName: 'Header Name',
            type: 'string',
            required: true,
            description: 'Nome do cabeçalho (ex: Authorization, X-API-Key)'
          },
          {
            name: 'headerValue',
            displayName: 'Header Value',
            type: 'password',
            required: true,
            description: 'Valor do cabeçalho'
          }
        ]
      }
    ];
    
    return res.json({
      success: true,
      data: availableTypes
    });
  } catch (error) {
    console.error('Erro ao buscar tipos de credenciais:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/credentials/:type - Listar credenciais por tipo
router.get('/type/:type', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { type } = req.params;
    
    const credentials = await CredentialModel.findByUserIdAndType(userId, type);
    
    return res.json({
      success: true,
      data: credentials
    });
  } catch (error) {
    console.error('Erro ao buscar credenciais por tipo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/credentials/:id - Obter credencial específica
router.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const credentialId = parseInt(req.params.id);
    
    if (isNaN(credentialId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da credencial inválido'
      });
    }
    
    const credential = await CredentialModel.findById(credentialId);
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credencial não encontrada'
      });
    }
    
    // Verificar se a credencial pertence ao usuário
    if (credential.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    return res.json({
      success: true,
      data: credential
    });
  } catch (error) {
    console.error('Erro ao buscar credencial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/credentials - Criar nova credencial
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, type, credential_data } = req.body;
    
    // Validações básicas
    if (!name || !type || !credential_data) {
      return res.status(400).json({
        success: false,
        message: 'Nome, tipo e dados da credencial são obrigatórios'
      });
    }
    
    // Verificar se já existe uma credencial com o mesmo nome
    const existingCredential = await CredentialModel.findByName(userId, name);
    if (existingCredential) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma credencial com este nome'
      });
    }
    
    const newCredential = await CredentialModel.create({
      name,
      type,
      user_id: userId,
      credential_data
    });
    
    return res.status(201).json({
      success: true,
      data: newCredential,
      message: 'Credencial criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar credencial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/credentials/:id - Atualizar credencial
router.put('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const credentialId = parseInt(req.params.id);
    const { name, credential_data } = req.body;
    
    if (isNaN(credentialId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da credencial inválido'
      });
    }
    
    // Verificar se a credencial existe e pertence ao usuário
    const existingCredential = await CredentialModel.findById(credentialId);
    if (!existingCredential || existingCredential.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Credencial não encontrada'
      });
    }
    
    // Verificar se o novo nome já existe (se foi alterado)
    if (name && name !== existingCredential.name) {
      const nameExists = await CredentialModel.findByName(userId, name);
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma credencial com este nome'
        });
      }
    }
    
    const updatedCredential = await CredentialModel.update(credentialId, {
      name,
      credential_data
    });
    
    return res.json({
      success: true,
      data: updatedCredential,
      message: 'Credencial atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar credencial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/credentials/:id/test - Testar credencial
router.post('/:id/test', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const credentialId = parseInt(req.params.id);
    
    if (isNaN(credentialId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da credencial inválido'
      });
    }
    
    // Verificar se a credencial existe e pertence ao usuário
    const credential = await CredentialModel.findById(credentialId);
    if (!credential || credential.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Credencial não encontrada'
      });
    }
    
    const testResult = await CredentialModel.testCredential(credentialId);
    
    return res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Erro ao testar credencial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/credentials/:id - Deletar credencial (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const credentialId = parseInt(req.params.id);
    
    if (isNaN(credentialId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da credencial inválido'
      });
    }
    
    // Verificar se a credencial existe e pertence ao usuário
    const credential = await CredentialModel.findById(credentialId);
    if (!credential || credential.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Credencial não encontrada'
      });
    }
    
    const deleted = await CredentialModel.delete(credentialId);
    
    if (deleted) {
      return res.json({
        success: true,
        message: 'Credencial deletada com sucesso'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar credencial'
      });
    }
  } catch (error) {
    console.error('Erro ao deletar credencial:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router; 