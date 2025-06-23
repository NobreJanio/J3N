const fs = require('fs');
const path = require('path');

// Função para corrigir return statements em um arquivo
function fixReturnsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Padrão para encontrar res.json(...) ou res.status(...).json(...) que não são precedidos por 'return'
    // Usando negative lookbehind para não adicionar 'return' se já existir.
    // Procura por um espaço em branco antes (para manter a indentação) e captura o `res.`
    const regex = /(\s+)(?<!return\s)(res\.(status\(\d+\)\.)?json\()/g;
    
    let modifiedContent = content.replace(regex, '$1return $2');

    if (modifiedContent !== originalContent) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      console.log(`Fixed: ${filePath}`);
    } else {
      console.log(`No changes needed for: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Arquivos para corrigir
const filesToFix = [
  'src/routes/analytics.ts',
  'src/routes/scheduling.ts',
  'src/routes/templates.ts',
  'src/routes/versioning.ts',
  'src/routes/webhooks.ts'
];

console.log('Starting return statement fixes...');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixReturnsInFile(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('Return statement fixes completed!');