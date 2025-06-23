-- Adicionar coluna role na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Adicionar coluna last_login na tabela users  
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Atualizar usuários existentes para ter role 'admin' se for o primeiro usuário
UPDATE users SET role = 'admin' WHERE id = 1 AND role = 'user';

-- Criar índice para role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role); 