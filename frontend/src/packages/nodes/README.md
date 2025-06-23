# Estrutura Modular de Nodes

Esta pasta contém a implementação modular dos nodes da aplicação, seguindo o padrão do N8N.

## Estrutura de Pastas

```
packages/nodes/
├── README.md                    # Este arquivo
├── index.ts                     # Registro de todos os nodes
├── HttpRequest/                 # Node de requisições HTTP
│   ├── HttpRequest.node.ts     # Definição principal do node
│   └── HttpRequest.credentials.ts # Credenciais necessárias
├── Webhook/                     # Node de webhook
│   └── Webhook.node.ts         # Definição principal do node
├── Set/                         # Node de transformação de dados
│   └── Set.node.ts             # Definição principal do node
└── If/                          # Node de lógica condicional
    └── If.node.ts              # Definição principal do node
```

## Anatomia de um Node

Cada node segue a estrutura padrão do N8N:

### 1. Arquivo Principal (`*.node.ts`)

```typescript
import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class NomeDoNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Nome Exibido',
    name: 'nomeInterno',
    icon: 'fa:icon-name',
    group: ['categoria'],
    version: 1,
    description: 'Descrição do que o node faz',
    defaults: {
      name: 'Nome Padrão',
      color: '#cor-hex',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [/* credenciais necessárias */],
    properties: [/* propriedades configuráveis */],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    // Lógica de execução do node
  }
}
```

### 2. Arquivo de Credenciais (`*.credentials.ts`)

```typescript
import { ICredentialType } from '../../../types/NodeTypes';

export class NomeCredencial implements ICredentialType {
  name = 'nomeCredencial';
  displayName = 'Nome da Credencial';
  properties = [/* campos da credencial */];
  authenticate = {/* configuração de autenticação */};
  test = {/* teste de conexão */};
}
```

## Propriedades dos Nodes

### Tipos de Propriedades Suportadas

- `string`: Campo de texto
- `number`: Campo numérico
- `boolean`: Checkbox
- `options`: Lista de opções
- `multiOptions`: Múltiplas opções
- `color`: Seletor de cor
- `fixedCollection`: Coleção de campos estruturados

### Opções de Exibição

- `displayOptions.show`: Mostra campo quando condições são atendidas
- `displayOptions.hide`: Esconde campo quando condições são atendidas

### Exemplo de Propriedade Complexa

```typescript
{
  displayName: 'Método HTTP',
  name: 'method',
  type: 'options',
  options: [
    { name: 'GET', value: 'GET' },
    { name: 'POST', value: 'POST' },
  ],
  default: 'GET',
  description: 'Método HTTP a ser usado',
}
```

## Grupos de Nodes

- **trigger**: Nodes que iniciam workflows
- **input**: Nodes de entrada/saída de dados
- **communication**: Nodes de comunicação e mensagens
- **transform**: Nodes de transformação de dados
- **logic**: Nodes de lógica condicional e controle de fluxo

## Nodes Implementados

### 1. Webhook
- **Grupo**: trigger
- **Função**: Inicia workflow quando webhook é chamado
- **Configurações**: Método HTTP, path, autenticação, resposta

### 2. HTTP Request
- **Grupo**: input
- **Função**: Faz requisições HTTP e retorna dados
- **Configurações**: Método, URL, headers, body, autenticação

### 3. Set
- **Grupo**: transform
- **Função**: Define valores em itens de dados
- **Configurações**: Valores a definir, dot notation, manter apenas definidos

### 4. IF
- **Grupo**: logic
- **Função**: Roteia dados baseado em condições
- **Configurações**: Condições, operações de comparação, combinação (ALL/ANY)
- **Saídas**: Duas saídas (true/false)

## Como Adicionar um Novo Node

1. **Criar pasta do node**: `mkdir packages/nodes/MeuNode`

2. **Criar arquivo principal**: `MeuNode.node.ts`
   ```typescript
   import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';
   
   export class MeuNode implements INodeType {
     description: INodeTypeDescription = {
       // configuração do node
     };
     
     async execute(this: any, items: any[]): Promise<any[]> {
       // lógica de execução
     }
   }
   ```

3. **Criar credenciais (se necessário)**: `MeuNode.credentials.ts`

4. **Registrar no índice**: Adicionar em `index.ts`
   ```typescript
   import { MeuNode } from './MeuNode/MeuNode.node';
   
   export const nodeTypes = {
     // ... outros nodes
     meuNode: MeuNode,
   };
   
   export const availableNodes = [
     // ... outros nodes
     {
       type: 'meuNode',
       displayName: 'Meu Node',
       description: 'Descrição do meu node',
       group: 'categoria',
       icon: 'icon-name',
     },
   ];
   ```

## Execução de Nodes

Os nodes recebem um array de itens de dados e devem retornar um array processado:

```typescript
async execute(this: any, items: any[]): Promise<any[]> {
  const returnData: any[] = [];
  
  for (let i = 0; i < items.length; i++) {
    // Obter parâmetros configurados
    const param = this.getNodeParameter('nomeParametro', i);
    
    // Processar dados
    const processedData = processItem(items[i].json, param);
    
    // Adicionar ao resultado
    returnData.push({
      json: processedData,
      pairedItem: { item: i },
    });
  }
  
  return returnData;
}
```

## Tipos TypeScript

Todos os tipos necessários estão definidos em `types/NodeTypes.ts`:

- `INodeType`: Interface principal do node
- `INodeTypeDescription`: Descrição e configuração do node
- `INodeProperties`: Propriedades configuráveis
- `ICredentialType`: Interface para credenciais
- `IExecuteData`: Dados de execução

Esta estrutura modular permite fácil extensão e manutenção dos nodes, seguindo as melhores práticas do N8N. 