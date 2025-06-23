#!/bin/bash

echo "🔧 Configurando arquivos de ambiente..."

# Backend .env
echo "📁 Criando backend/.env..."
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowbuilder_db
DB_USER=flowbuilder_user
DB_PASSWORD=flowbuilder_password
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@flowbuilder.com
ADMIN_PASSWORD=admin123
EOF

# Frontend .env
echo "📁 Criando frontend/.env..."
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3001
EOF

echo "✅ Arquivos de ambiente criados com sucesso!"
echo ""
echo "🔐 Credenciais padrão do admin:"
echo "   Email: admin@flowbuilder.com"
echo "   Senha: admin123"
echo ""
echo "🚀 Para iniciar o projeto:"
echo "   1. docker-compose up -d"
echo "   2. cd backend && npm run dev"
echo "   3. cd frontend && npm run dev (em outro terminal)" 