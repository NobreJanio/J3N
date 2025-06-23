import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class Webhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Webhook',
    name: 'webhook',
    icon: 'file:webhook.svg',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow when a webhook is called',
    defaults: {
      name: 'Webhook',
      color: '#885577',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        options: [
          {
            name: 'DELETE',
            value: 'DELETE',
          },
          {
            name: 'GET',
            value: 'GET',
          },
          {
            name: 'HEAD',
            value: 'HEAD',
          },
          {
            name: 'PATCH',
            value: 'PATCH',
          },
          {
            name: 'POST',
            value: 'POST',
          },
          {
            name: 'PUT',
            value: 'PUT',
          },
        ],
        default: 'POST',
        description: 'The HTTP method to listen for',
      },
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '',
        placeholder: 'webhook-path',
        description: 'The path for the webhook URL',
        required: true,
      },
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          {
            name: 'None',
            value: 'none',
          },
          {
            name: 'Basic Auth',
            value: 'basicAuth',
          },
          {
            name: 'Header Auth',
            value: 'headerAuth',
          },
        ],
        default: 'none',
        description: 'The way to authenticate',
      },
      {
        displayName: 'Username',
        name: 'basicAuthUser',
        type: 'string',
        displayOptions: {
          show: {
            authentication: ['basicAuth'],
          },
        },
        default: '',
        description: 'Username for basic authentication',
      },
      {
        displayName: 'Password',
        name: 'basicAuthPassword',
        type: 'string',
        typeOptions: {
          password: true,
        },
        displayOptions: {
          show: {
            authentication: ['basicAuth'],
          },
        },
        default: '',
        description: 'Password for basic authentication',
      },
      {
        displayName: 'Header Name',
        name: 'headerAuthName',
        type: 'string',
        displayOptions: {
          show: {
            authentication: ['headerAuth'],
          },
        },
        default: '',
        placeholder: 'X-API-Key',
        description: 'Name of the header for authentication',
      },
      {
        displayName: 'Header Value',
        name: 'headerAuthValue',
        type: 'string',
        displayOptions: {
          show: {
            authentication: ['headerAuth'],
          },
        },
        default: '',
        description: 'Value of the header for authentication',
      },
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        options: [
          {
            name: 'On Received',
            value: 'onReceived',
            description: 'Returns response when webhook is received',
          },
          {
            name: 'Last Node',
            value: 'lastNode',
            description: 'Returns response from the last executed node',
          },
        ],
        default: 'onReceived',
        description: 'When to return the response',
      },
      {
        displayName: 'Response Code',
        name: 'responseCode',
        type: 'number',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
          },
        },
        typeOptions: {
          minValue: 100,
          maxValue: 599,
        },
        default: 200,
        description: 'Response code to return',
      },
      {
        displayName: 'Response Data',
        name: 'responseData',
        type: 'string',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
          },
        },
        default: 'success',
        description: 'Response data to return',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'fixedCollection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            name: 'rawBody',
            displayName: 'Raw Body',
            values: [
              {
                displayName: 'Raw Body',
                name: 'rawBody',
                type: 'boolean',
                default: false,
                description: 'Whether to return the raw body instead of the parsed body',
              },
            ],
          },
          {
            name: 'allowedOrigins',
            displayName: 'Allowed Origins (CORS)',
            values: [
              {
                displayName: 'Allowed Origins',
                name: 'allowedOrigins',
                type: 'string',
                default: '*',
                description: 'Allowed origins for CORS. Use * for all origins or specify comma-separated list',
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    // Para webhooks, os dados vêm da requisição HTTP
    // Este é um exemplo de como os dados seriam processados
    const returnData: any[] = [];

    // Simular dados de webhook recebidos
    const webhookData = {
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Webhook-Client/1.0',
        'x-webhook-signature': 'sha256=example',
      },
      body: {
        event: 'webhook.received',
        timestamp: new Date().toISOString(),
        data: {
          id: Math.random().toString(36).substr(2, 9),
          message: 'Webhook triggered successfully',
        },
      },
      query: {},
      params: {
        path: this.getNodeParameter('path', 0),
      },
    };

    const httpMethod = this.getNodeParameter('httpMethod', 0) as string;
    const authentication = this.getNodeParameter('authentication', 0) as string;
    const responseMode = this.getNodeParameter('responseMode', 0) as string;

    // Adicionar informações de autenticação se configurada
    if (authentication === 'basicAuth') {
      const username = this.getNodeParameter('basicAuthUser', 0) as string;
      webhookData.body.auth = { type: 'basic', username };
    } else if (authentication === 'headerAuth') {
      const headerName = this.getNodeParameter('headerAuthName', 0) as string;
      webhookData.body.auth = { type: 'header', headerName };
    }

    // Adicionar informações do método HTTP
    webhookData.body.method = httpMethod;
    webhookData.body.responseMode = responseMode;

    if (responseMode === 'onReceived') {
      const responseCode = this.getNodeParameter('responseCode', 0) as number;
      const responseData = this.getNodeParameter('responseData', 0) as string;
      
      webhookData.body.response = {
        code: responseCode,
        data: responseData,
      };
    }

    returnData.push({
      json: webhookData,
      pairedItem: { item: 0 },
    });

    return returnData;
  }
}