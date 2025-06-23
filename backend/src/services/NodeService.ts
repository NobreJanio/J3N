import { INodeExecutionData, IExecutionContext } from '../core/WorkflowExecute';
import axios from 'axios';
import { IntegrationNodes } from './IntegrationNodes';

// Re-export interfaces for use in other modules
export { INodeExecutionData, IExecutionContext };

// Importar definições de nodes do frontend (adaptadas)
// Interfaces imported from '../core/WorkflowExecute'

interface INodeType {
  description: INodeTypeDescription;
  execute(this: IExecutionContext, items: INodeExecutionData[]): Promise<INodeExecutionData[]>;
}

interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon?: string;
  group: string[];
  version: number;
  subtitle?: string;
  description: string;
  defaults: {
    name: string;
    color?: string;
  };
  inputs: string[];
  outputs: string[];
  credentials?: INodeCredential[];
  properties: INodeProperties[];
}

interface INodeCredential {
  name: string;
  required: boolean;
}

interface INodeProperties {
  displayName: string;
  name: string;
  type: string;
  default: any;
  required?: boolean;
  description?: string;
  options?: any[];
  typeOptions?: any;
  displayOptions?: any;
}

// Definições básicas dos nodes (simplificadas para o backend)
const nodeDefinitions: { [key: string]: INodeTypeDescription } = {
  start: {
    displayName: 'Start',
    name: 'start',
    group: ['trigger'],
    version: 1,
    description: 'Start the workflow execution',
    defaults: { name: 'Start' },
    inputs: [],
    outputs: ['main'],
    properties: []
  },
  webhook: {
    displayName: 'Webhook',
    name: 'webhook',
    group: ['trigger'],
    version: 1,
    description: 'Receives HTTP requests',
    defaults: { name: 'Webhook' },
    inputs: [],
    outputs: ['main'],
    properties: []
  },
  manualTrigger: {
    displayName: 'Manual Trigger',
    name: 'manualTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Manually trigger workflow',
    defaults: { name: 'Manual Trigger' },
    inputs: [],
    outputs: ['main'],
    properties: []
  },
  httpRequest: {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    group: ['input'],
    version: 1,
    description: 'Make HTTP requests',
    defaults: { name: 'HTTP Request' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  // ========== INTEGRAÇÕES DE COMUNICAÇÃO ==========
  slack: {
    displayName: 'Slack',
    name: 'slack',
    group: ['communication'],
    version: 1,
    description: 'Send messages and interact with Slack',
    defaults: { name: 'Slack', color: '#4A154B' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'slackApi', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'sendMessage',
        options: [
          { name: 'Send Message', value: 'sendMessage' },
          { name: 'Get Channels', value: 'getChannels' }
        ]
      },
      {
        displayName: 'Channel',
        name: 'channel',
        type: 'string',
        default: '#general',
        displayOptions: { show: { action: ['sendMessage'] } }
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendMessage'] } }
      }
    ]
  },
  discord: {
    displayName: 'Discord',
    name: 'discord',
    group: ['communication'],
    version: 1,
    description: 'Send messages and interact with Discord',
    defaults: { name: 'Discord', color: '#5865F2' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'discordWebhook', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'sendMessage',
        options: [
          { name: 'Send Message', value: 'sendMessage' },
          { name: 'Get Guild Info', value: 'getGuildInfo' }
        ]
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendMessage'] } }
      }
    ]
  },
  telegram: {
    displayName: 'Telegram',
    name: 'telegram',
    group: ['communication'],
    version: 1,
    description: 'Send messages via Telegram Bot',
    defaults: { name: 'Telegram', color: '#0088CC' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'telegramBot', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'sendMessage',
        options: [
          { name: 'Send Message', value: 'sendMessage' },
          { name: 'Get Updates', value: 'getUpdates' }
        ]
      },
      {
        displayName: 'Chat ID',
        name: 'chatId',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendMessage'] } }
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendMessage'] } }
      }
    ]
  },
  whatsapp: {
    displayName: 'WhatsApp',
    name: 'whatsapp',
    group: ['communication'],
    version: 1,
    description: 'Send messages via WhatsApp Business API',
    defaults: { name: 'WhatsApp', color: '#25D366' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'whatsappBusiness', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'sendMessage',
        options: [
          { name: 'Send Message', value: 'sendMessage' },
          { name: 'Send Template', value: 'sendTemplate' }
        ]
      },
      {
        displayName: 'Phone Number',
        name: 'to',
        type: 'string',
        default: '',
        description: 'Phone number with country code (e.g., 5511999999999)'
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendMessage'] } }
      }
    ]
  },
  // ========== INTEGRAÇÕES DE BANCO DE DADOS ==========
  mysql: {
    displayName: 'MySQL',
    name: 'mysql',
    group: ['database'],
    version: 1,
    description: 'Execute queries on MySQL database',
    defaults: { name: 'MySQL', color: '#4479A1' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'mysql', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'select',
        options: [
          { name: 'Select', value: 'select' },
          { name: 'Insert', value: 'insert' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' }
        ]
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        default: 'SELECT * FROM table_name LIMIT 10',
        displayOptions: { show: { action: ['select', 'update', 'delete'] } }
      }
    ]
  },
  mongodb: {
    displayName: 'MongoDB',
    name: 'mongodb',
    group: ['database'],
    version: 1,
    description: 'Execute operations on MongoDB',
    defaults: { name: 'MongoDB', color: '#47A248' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'mongodb', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'find',
        options: [
          { name: 'Find', value: 'find' },
          { name: 'Insert One', value: 'insertOne' },
          { name: 'Update One', value: 'updateOne' },
          { name: 'Delete One', value: 'deleteOne' }
        ]
      },
      {
        displayName: 'Collection',
        name: 'collection',
        type: 'string',
        default: 'collection_name'
      }
    ]
  },
  // ========== INTEGRAÇÕES DE APIS POPULARES ==========
  googleSheets: {
    displayName: 'Google Sheets',
    name: 'googleSheets',
    group: ['productivity'],
    version: 1,
    description: 'Read and write data to Google Sheets',
    defaults: { name: 'Google Sheets', color: '#0F9D58' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'googleSheetsApi', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'read',
        options: [
          { name: 'Read', value: 'read' },
          { name: 'Write', value: 'write' },
          { name: 'Append', value: 'append' }
        ]
      },
      {
        displayName: 'Spreadsheet ID',
        name: 'spreadsheetId',
        type: 'string',
        default: ''
      },
      {
        displayName: 'Range',
        name: 'range',
        type: 'string',
        default: 'A1:Z100'
      }
    ]
  },
  notion: {
    displayName: 'Notion',
    name: 'notion',
    group: ['productivity'],
    version: 1,
    description: 'Create and manage Notion pages and databases',
    defaults: { name: 'Notion', color: '#000000' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'notionApi', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'queryDatabase',
        options: [
          { name: 'Query Database', value: 'queryDatabase' },
          { name: 'Create Page', value: 'createPage' },
          { name: 'Update Page', value: 'updatePage' }
        ]
      },
      {
        displayName: 'Database ID',
        name: 'databaseId',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['queryDatabase', 'createPage'] } }
      }
    ]
  },
  airtable: {
    displayName: 'Airtable',
    name: 'airtable',
    group: ['productivity'],
    version: 1,
    description: 'Manage Airtable records',
    defaults: { name: 'Airtable', color: '#18BFFF' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'airtableApi', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'list',
        options: [
          { name: 'List Records', value: 'list' },
          { name: 'Create Record', value: 'create' },
          { name: 'Update Record', value: 'update' }
        ]
      },
      {
        displayName: 'Base ID',
        name: 'baseId',
        type: 'string',
        default: ''
      },
      {
        displayName: 'Table ID',
        name: 'tableId',
        type: 'string',
        default: ''
      }
    ]
  },
  // ========== INTEGRAÇÕES DE EMAIL ==========
  gmail: {
    displayName: 'Gmail',
    name: 'gmail',
    group: ['email'],
    version: 1,
    description: 'Send and manage Gmail emails',
    defaults: { name: 'Gmail', color: '#EA4335' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'gmailOAuth2', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'sendEmail',
        options: [
          { name: 'Send Email', value: 'sendEmail' },
          { name: 'List Emails', value: 'listEmails' }
        ]
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendEmail'] } }
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendEmail'] } }
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendEmail'] } }
      }
    ]
  },
  outlook: {
    displayName: 'Outlook',
    name: 'outlook',
    group: ['email'],
    version: 1,
    description: 'Send and manage Outlook emails',
    defaults: { name: 'Outlook', color: '#0078D4' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'microsoftOAuth2', required: true }],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        default: 'sendEmail',
        options: [
          { name: 'Send Email', value: 'sendEmail' },
          { name: 'List Emails', value: 'listEmails' }
        ]
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendEmail'] } }
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendEmail'] } }
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        default: '',
        displayOptions: { show: { action: ['sendEmail'] } }
      }
    ]
  },
  set: {
    displayName: 'Set',
    name: 'set',
    group: ['transform'],
    version: 1,
    description: 'Set data values',
    defaults: { name: 'Set' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  if: {
    displayName: 'IF',
    name: 'if',
    group: ['logic'],
    version: 1,
    description: 'Conditional logic',
    defaults: { name: 'IF' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    properties: []
  },
  filter: {
    displayName: 'Filter',
    name: 'filter',
    group: ['transform'],
    version: 1,
    description: 'Filter items based on conditions',
    defaults: { name: 'Filter' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  dateTime: {
    displayName: 'Date & Time',
    name: 'dateTime',
    group: ['transform'],
    version: 1,
    description: 'Work with date and time values',
    defaults: { name: 'Date & Time' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  splitOut: {
    displayName: 'Split Out',
    name: 'splitOut',
    group: ['transform'],
    version: 1,
    description: 'Split arrays into individual items',
    defaults: { name: 'Split Out' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  removeDuplicates: {
    displayName: 'Remove Duplicates',
    name: 'removeDuplicates',
    group: ['transform'],
    version: 1,
    description: 'Remove duplicate items based on specified fields',
    defaults: { name: 'Remove Duplicates' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  switch: {
    displayName: 'Switch',
    name: 'switch',
    group: ['logic'],
    version: 1,
    description: 'Route data to different outputs based on conditions',
    defaults: { name: 'Switch' },
    inputs: ['main'],
    outputs: ['main', 'main', 'main', 'main'],
    properties: []
  },
  wait: {
    displayName: 'Wait',
    name: 'wait',
    group: ['logic'],
    version: 1,
    description: 'Pause workflow execution for a specified amount of time',
    defaults: { name: 'Wait' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  }
};

// Implementações básicas dos nodes
const nodeImplementations: { [key: string]: (context: IExecutionContext, items: INodeExecutionData[], parameters: any) => Promise<INodeExecutionData[]> } = {
  start: async (context, items, parameters) => {
    const message = parameters.message || 'Workflow started';
    const includeTimestamp = parameters.includeTimestamp !== false;
    
    const result: any = {
      trigger: 'start',
      message
    };
    
    if (includeTimestamp) {
      result.timestamp = new Date().toISOString();
    }
    
    return [{
      json: result
    }];
  },

  webhook: async (context, items, parameters) => {
    return [{
      json: {
        trigger: 'webhook',
        method: parameters.method || 'POST',
        path: parameters.path || '/',
        timestamp: new Date().toISOString(),
        data: items.length > 0 ? items[0].json : {}
      }
    }];
  },

  manualTrigger: async (context, items, parameters) => {
    const initialData = parameters.initialData ? JSON.parse(parameters.initialData) : {};
    return [{
      json: {
        trigger: 'manual',
        mode: parameters.mode || 'once',
        timestamp: new Date().toISOString(),
        ...initialData
      }
    }];
  },

  httpRequest: async (context, items, parameters) => {
    console.log('🌐 HTTP Request node executing with parameters:', parameters);
    const url = parameters.url || '';
    const method = (parameters.method || 'GET').toUpperCase();
    const sendBody = parameters.sendBody || false;
    const contentType = parameters.contentType || 'json';
    const authentication = parameters.authentication || 'none';
    
    if (!url) {
      throw new Error('URL is required for HTTP Request');
    }

    try {
      // Configurar headers
      const headers: { [key: string]: string } = {
        'User-Agent': 'FlowBuilder/1.0'
      };

      // Adicionar headers customizados
      if (parameters.sendHeaders && parameters.headers) {
        for (const header of parameters.headers) {
          if (header.name && header.value) {
            headers[header.name] = header.value;
          }
        }
      }

      // Configurar autenticação
      let auth: any = undefined;
      if (authentication === 'basicAuth') {
        const username = parameters.username || '';
        const password = parameters.password || '';
        if (username && password) {
          auth = { username, password };
        }
      } else if (authentication === 'headerAuth') {
        const headerName = parameters.headerName || 'Authorization';
        const headerValue = parameters.headerValue || '';
        if (headerValue) {
          headers[headerName] = headerValue;
        }
      }

      // Configurar query parameters
      const params: { [key: string]: string } = {};
      if (parameters.sendQueryParams && parameters.queryParameters) {
        for (const param of parameters.queryParameters) {
          if (param.name && param.value) {
            params[param.name] = param.value;
          }
        }
      }

      // Configurar body para métodos que suportam
      let data: any = undefined;
      if (sendBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (contentType === 'json') {
          const jsonBody = parameters.jsonBody || '{}';
          try {
            data = JSON.parse(jsonBody);
            headers['Content-Type'] = 'application/json';
          } catch (error) {
            throw new Error('Invalid JSON in request body');
          }
        } else if (contentType === 'raw') {
          data = parameters.body || '';
          headers['Content-Type'] = 'text/plain';
        } else if (contentType === 'form-urlencoded') {
          // Implementar form-urlencoded se necessário
          data = parameters.formData || {};
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }

      // Fazer a requisição HTTP
      const axiosConfig: any = {
        method: method.toLowerCase(),
        url,
        headers,
        params,
        timeout: 30000, // 30 segundos
        validateStatus: () => true // Aceitar todos os status codes
      };

      if (auth) {
        axiosConfig.auth = auth;
      }

      if (data !== undefined) {
        axiosConfig.data = data;
      }

      console.log(`🌐 Making HTTP ${method} request to: ${url}`);
      const response = await axios(axiosConfig);

      // Retornar dados da resposta - body como dados principais
      const responseData = response.data;
      
      // Se o body é um objeto, retornar diretamente com metadados
      if (typeof responseData === 'object' && responseData !== null) {
        return [{
          json: {
            ...responseData,
            // Metadados da requisição (prefixados com _ para não conflitar)
            _statusCode: response.status,
            _statusMessage: response.statusText,
            _headers: response.headers,
            _request: {
              method,
              url,
              headers: axiosConfig.headers,
              params,
              body: data
            },
            _timestamp: new Date().toISOString()
          }
        }];
      } else {
        // Se o body não é um objeto, encapsular em um campo 'data'
        return [{
          json: {
            data: responseData,
            _statusCode: response.status,
            _statusMessage: response.statusText,
            _headers: response.headers,
            _request: {
              method,
              url,
              headers: axiosConfig.headers,
              params,
              body: data
            },
            _timestamp: new Date().toISOString()
          }
        }];
      }

         } catch (error: any) {
       console.error(`❌ HTTP Request failed:`, error.message);
       
       // Retornar erro estruturado
       return [{
         json: {
           error: true,
           statusCode: error.response?.status || 0,
           statusMessage: error.response?.statusText || 'Request Failed',
           message: error.message,
           headers: error.response?.headers || {},
           body: error.response?.data || null,
           request: {
             method,
             url
           },
           timestamp: new Date().toISOString()
         }
       }];
     }
  },

  // ========== INTEGRAÇÕES DE COMUNICAÇÃO ==========
  slack: async (context, items, parameters) => {
    return await IntegrationNodes.executeSlackNode(items, parameters);
  },

  discord: async (context, items, parameters) => {
    return await IntegrationNodes.executeDiscordNode(items, parameters);
  },

  telegram: async (context, items, parameters) => {
    return await IntegrationNodes.executeTelegramNode(items, parameters);
  },

  whatsapp: async (context, items, parameters) => {
    return await IntegrationNodes.executeWhatsAppNode(items, parameters);
  },

  // ========== INTEGRAÇÕES DE BANCO DE DADOS ==========
  mysql: async (context, items, parameters) => {
    return await IntegrationNodes.executeMySQLNode(items, parameters);
  },

  mongodb: async (context, items, parameters) => {
    return await IntegrationNodes.executeMongoDBNode(items, parameters);
  },

  // ========== INTEGRAÇÕES DE APIS POPULARES ==========
  googleSheets: async (context, items, parameters) => {
    return await IntegrationNodes.executeGoogleSheetsNode(items, parameters);
  },

  notion: async (context, items, parameters) => {
    return await IntegrationNodes.executeNotionNode(items, parameters);
  },

  airtable: async (context, items, parameters) => {
    return await IntegrationNodes.executeAirtableNode(items, parameters);
  },

  // ========== INTEGRAÇÕES DE EMAIL ==========
  gmail: async (context, items, parameters) => {
    return await IntegrationNodes.executeGmailNode(items, parameters);
  },

  outlook: async (context, items, parameters) => {
    return await IntegrationNodes.executeOutlookNode(items, parameters);
  },

  set: async (context, items, parameters) => {
    const keepOnlySet = parameters.keepOnlySet !== undefined ? parameters.keepOnlySet : true;
    const values = parameters.values || {};
    const options = parameters.options || {};

    console.log('🔧 Set node executing with parameters:', { keepOnlySet, values, options });
    console.log('🔧 Set node input items:', items);

    // Função para processar expressões {{ $json.property }}
    const processExpression = (expression: string, itemData: any): any => {
      console.log('🔧 Processing expression:', expression, 'with data keys:', Object.keys(itemData || {}));
      
      if (typeof expression !== 'string') {
        console.log('🔧 Expression is not string, returning as-is:', expression);
        return expression;
      }

      // Detectar expressões {{ $json.property }}
      const expressionRegex = /\{\{\s*\$json\.([^}]+)\s*\}\}/g;
      let result = expression;
      let match;

      while ((match = expressionRegex.exec(expression)) !== null) {
        const propertyPath = match[1];
        const value = getNestedProperty(itemData, propertyPath);
        console.log(`🔧 Found expression match: ${match[0]}, property: ${propertyPath}, value:`, value);
        result = result.replace(match[0], value !== undefined ? value : '');
      }

      // Se a string inteira era uma expressão, retornar o valor processado
      if (expression.match(/^\{\{\s*\$json\.[^}]+\s*\}\}$/)) {
        const propertyPath = expression.match(/\{\{\s*\$json\.([^}]+)\s*\}\}/)?.[1];
        if (propertyPath) {
          const value = getNestedProperty(itemData, propertyPath);
          console.log(`🔧 Full expression match: ${expression}, property: ${propertyPath}, value:`, value);
          return value;
        }
      }

      console.log('🔧 Final processed result:', result);
      return result;
    };

    // Função para acessar propriedades aninhadas
    const getNestedProperty = (obj: any, path: string): any => {
      if (!path || !obj) return obj;
      
      if (!path.includes('.')) {
        return obj[path];
      }

      const keys = path.split('.');
      let current = obj;
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        if (current && typeof current === 'object' && current !== null) {
          if (key in current) {
            current = current[key];
          } else {
            return undefined;
          }
        } else {
          return undefined;
        }
      }
      
      return current;
    };

    // Função para definir propriedades aninhadas
    const setNestedProperty = (obj: any, path: string, value: any, useDotNotation: boolean = true): void => {
      if (!useDotNotation || !path.includes('.')) {
        obj[path] = value;
        return;
      }

      const keys = path.split('.');
      const lastKey = keys.pop()!;
      let current = obj;

      for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
          current[key] = {};
        }
        current = current[key];
      }

      current[lastKey] = value;
    };

    const useDotNotation = options.dotNotation !== false;

    const result = items.map(item => {
      const newItem: any = keepOnlySet ? {} : { ...item.json };

      // Processar valores string
      if (values.string && Array.isArray(values.string)) {
        for (const strValue of values.string) {
          if (strValue.name && strValue.value !== undefined) {
            try {
              const processedValue = processExpression(strValue.value, item.json);
              setNestedProperty(newItem, strValue.name, processedValue, useDotNotation);
            } catch (error) {
              console.error(`Error processing string value "${strValue.name}":`, error);
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Error processing string value "${strValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              setNestedProperty(newItem, strValue.name, strValue.value, useDotNotation);
            }
          }
        }
              }

      // Processar valores number
      if (values.number && Array.isArray(values.number)) {
        for (const numValue of values.number) {
          if (numValue.name && numValue.value !== undefined) {
            try {
              const processedValue = processExpression(numValue.value, item.json);
              const numberValue = Number(processedValue);
              
              if (isNaN(numberValue)) {
                throw new Error('Value is not a valid number');
              }
              
              setNestedProperty(newItem, numValue.name, numberValue, useDotNotation);
            } catch (error) {
              console.error(`Error processing number value "${numValue.name}":`, error);
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Error processing number value "${numValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              setNestedProperty(newItem, numValue.name, numValue.value, useDotNotation);
            }
          }
        }
      }

      // Processar valores boolean
      if (values.boolean && Array.isArray(values.boolean)) {
        for (const boolValue of values.boolean) {
          if (boolValue.name && boolValue.value !== undefined) {
            try {
              const processedValue = processExpression(boolValue.value, item.json);
              let booleanValue: boolean;
              
              if (typeof processedValue === 'boolean') {
                booleanValue = processedValue;
              } else if (typeof processedValue === 'string') {
                const lowerValue = processedValue.toLowerCase();
                booleanValue = lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
              } else {
                booleanValue = Boolean(processedValue);
              }
              
              setNestedProperty(newItem, boolValue.name, booleanValue, useDotNotation);
            } catch (error) {
              console.error(`Error processing boolean value "${boolValue.name}":`, error);
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Error processing boolean value "${boolValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              setNestedProperty(newItem, boolValue.name, boolValue.value, useDotNotation);
            }
          }
        }
      }

      // Processar valores object (JSON)
      if (values.object && Array.isArray(values.object)) {
        for (const objValue of values.object) {
          if (objValue.name && objValue.value !== undefined) {
            try {
              const processedValue = processExpression(objValue.value, item.json);
              let parsedObject;
              
              if (typeof processedValue === 'string') {
                parsedObject = JSON.parse(processedValue);
              } else {
                parsedObject = processedValue;
              }
              
              setNestedProperty(newItem, objValue.name, parsedObject, useDotNotation);
            } catch (error) {
              console.error(`Error processing object value "${objValue.name}":`, error);
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Error processing object value "${objValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              // Se falhar, definir como string
              const processedValue = processExpression(objValue.value, item.json);
              setNestedProperty(newItem, objValue.name, processedValue, useDotNotation);
            }
          }
        }
      }
      
      // Processar valores array (JSON)
      if (values.array && Array.isArray(values.array)) {
        for (const arrValue of values.array) {
          if (arrValue.name && arrValue.value !== undefined) {
            try {
              const processedValue = processExpression(arrValue.value, item.json);
              let parsedArray;
              
              if (typeof processedValue === 'string') {
                parsedArray = JSON.parse(processedValue);
              } else {
                parsedArray = processedValue;
              }
              
              if (!Array.isArray(parsedArray)) {
                throw new Error('Value is not a valid array');
              }
              
              setNestedProperty(newItem, arrValue.name, parsedArray, useDotNotation);
            } catch (error) {
              console.error(`Error processing array value "${arrValue.name}":`, error);
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Error processing array value "${arrValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              // Se ignorar erros, definir como string
              const processedValue = processExpression(arrValue.value, item.json);
              setNestedProperty(newItem, arrValue.name, processedValue, useDotNotation);
            }
          }
        }
      }
      
      return {
        json: newItem
      };
    });
    
    console.log('🔧 Set node final result:', result);
    return result;
  },

  if: async (context, items, parameters) => {
    const conditions = parameters.conditions || [];
    const combineOperation = parameters.combineOperation || 'ALL';
    
    // Lógica simplificada de condições
    const result = items.filter(item => {
      // Simular avaliação de condições
      return Math.random() > 0.5; // 50% chance para demonstração
    });
    
    return result;
  },

  filter: async (context, items, parameters) => {
    console.log('🔧 Filter node executing with parameters:', parameters);
    console.log('🔧 Filter node input items:', items);
    
    const conditions = parameters.conditions || {};
    const combineOperation = parameters.combineOperation || 'all';
    
    // Se não há condições definidas, retornar todos os itens
    if (!conditions || Object.keys(conditions).length === 0) {
      console.log('🔧 Filter node: No conditions defined, returning all items');
      return items;
    }
    
    // Implementação básica de filtro
    const result = items.filter(item => {
      console.log('🔧 Filter node: Evaluating item:', item.json);
      
      // Por enquanto, implementação simplificada que retorna todos os itens
      // Em uma implementação completa, aqui seria avaliada cada condição
      const shouldInclude = true; // Placeholder - implementar lógica real aqui
      
      console.log('🔧 Filter node: Item included:', shouldInclude);
      return shouldInclude;
    });
    
    console.log('🔧 Filter node final result:', result);
    return result;
  },

  dateTime: async (context, items, parameters) => {
    const action = parameters.action || 'getCurrentDateTime';
    const outputField = parameters.outputField || 'dateTime';
    
    return items.map(item => {
      let result: any = {};
      
      switch (action) {
        case 'getCurrentDateTime':
          const now = new Date();
          result = {
            iso: now.toISOString(),
            timestamp: now.getTime(),
            dateOnly: now.toISOString().split('T')[0],
            timeOnly: now.toTimeString().split(' ')[0],
          };
          break;
        default:
          result = { action, timestamp: new Date().toISOString() };
      }
      
      return {
        json: {
          ...item.json,
          [outputField]: result,
        }
      };
    });
  },

  splitOut: async (context, items, parameters) => {
    const fieldToSplit = parameters.fieldToSplit || '';
    const includeOriginalData = parameters.includeOriginalData !== false;
    const destinationField = parameters.destinationField || 'item';
    
    const result: INodeExecutionData[] = [];
    
    for (const item of items) {
      const arrayValue = item.json[fieldToSplit];
      
      if (Array.isArray(arrayValue)) {
        for (let i = 0; i < arrayValue.length; i++) {
          const newItem: any = {};
          
          if (includeOriginalData) {
            Object.assign(newItem, item.json);
          }
          
          newItem[destinationField] = arrayValue[i];
          newItem._splitIndex = i;
          newItem._splitTotal = arrayValue.length;
          
          result.push({ json: newItem });
        }
      } else {
        // Se não é array, retornar como item único
        const newItem: any = {};
        
        if (includeOriginalData) {
          Object.assign(newItem, item.json);
        }
        
        newItem[destinationField] = arrayValue;
        result.push({ json: newItem });
      }
    }
    
    return result;
  },

  removeDuplicates: async (context, items, parameters) => {
    const compareFields = parameters.compareFields || '';
    const keep = parameters.keep || 'first';
    const caseSensitive = parameters.caseSensitive !== false;
    
    const seen = new Set<string>();
    const result: INodeExecutionData[] = [];
    
    for (const item of items) {
      // Gerar chave para comparação (implementação simplificada)
      const key = JSON.stringify(item.json);
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    
    return result;
  },

  switch: async (context, items, parameters) => {
    const mode = parameters.mode || 'rules';
    const dataProperty = parameters.dataProperty || '';
    const rules = parameters.rules || {};
    const fallbackOutput = parameters.fallbackOutput || 0;
    
    // Implementação simplificada - retornar todos os itens
    // Em uma implementação real, isso rotearia para diferentes saídas
    return items;
  },

  wait: async (context, items, parameters) => {
    const waitTime = parameters.waitTime || 1;
    const timeUnit = parameters.timeUnit || 'seconds';
    const resumeOn = parameters.resumeOn || 'timer';
    
    let waitTimeMs = waitTime * 1000;
    
    switch (timeUnit) {
      case 'minutes':
        waitTimeMs = waitTime * 60 * 1000;
        break;
      case 'hours':
        waitTimeMs = waitTime * 60 * 60 * 1000;
        break;
    }
    
    if (resumeOn === 'timer') {
      // Aguardar o tempo especificado
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
    }
    
    return items.map(item => ({
      json: {
        ...item.json,
        _waitInfo: {
          waitTime,
          timeUnit,
          resumeOn,
          startTime: new Date().toISOString(),
        },
      }
    }));
  }
};

export class NodeService {
  /**
   * Obtém definição de um node
   */
  static getNodeDefinition(nodeType: string): INodeTypeDescription | null {
    return nodeDefinitions[nodeType] || null;
  }

  /**
   * Executa um node
   */
  static async executeNode(
    nodeType: string,
    items: INodeExecutionData[],
    parameters: any = {},
    context?: IExecutionContext
  ): Promise<INodeExecutionData[]> {
    const implementation = nodeImplementations[nodeType];
    
    if (!implementation) {
      throw new Error(`Node type '${nodeType}' not implemented`);
    }

    // Criar contexto padrão se não fornecido
    const executionContext = context || {
      getNodeParameter: (paramName: string, itemIndex: number, defaultValue?: any) => {
        return parameters[paramName] !== undefined ? parameters[paramName] : defaultValue;
      },
      getInputData: () => items,
      getCredentials: async () => ({}),
      getWorkflowStaticData: () => ({}),
      helpers: {
        request: async () => ({ data: 'mock' }),
        httpRequest: async () => ({ data: 'mock' })
      }
    };

    try {
      return await implementation(executionContext, items, parameters);
    } catch (error) {
      console.error(`Error executing node ${nodeType}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos os tipos de nodes disponíveis
   */
  static getAvailableNodeTypes(): string[] {
    return Object.keys(nodeDefinitions);
  }

  /**
   * Obtém nodes por grupo
   */
  static getNodesByGroup(group: string): INodeTypeDescription[] {
    return Object.values(nodeDefinitions).filter(def => 
      def.group.includes(group)
    );
  }

  /**
   * Valida se um node type existe
   */
  static isValidNodeType(nodeType: string): boolean {
    return nodeType in nodeDefinitions;
  }

  /**
   * Obtém credenciais necessárias para um node
   */
  static getNodeCredentials(nodeType: string): INodeCredential[] {
    const definition = this.getNodeDefinition(nodeType);
    return definition?.credentials || [];
  }
}