import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class HttpRequest implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    icon: 'fa:at',
    group: ['input'],
    version: 1,
    description: 'Makes an HTTP request and returns the response data',
    defaults: {
      name: 'HTTP Request',
      color: '#2196F3',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
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
        default: 'GET',
        description: 'The request method to use',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        placeholder: 'https://httpbin.org/get',
        description: 'The URL to make the request to',
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
          {
            name: 'OAuth2',
            value: 'oauth2',
          },
        ],
        default: 'none',
      },
      {
        displayName: 'Username',
        name: 'username',
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
        name: 'password',
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
        displayName: 'Send Body',
        name: 'sendBody',
        type: 'boolean',
        displayOptions: {
          show: {
            method: ['PATCH', 'POST', 'PUT'],
          },
        },
        default: false,
        description: 'Whether to send a body with the request',
      },
      {
        displayName: 'Body Content Type',
        name: 'contentType',
        type: 'options',
        displayOptions: {
          show: {
            sendBody: [true],
          },
        },
        options: [
          {
            name: 'JSON',
            value: 'json',
          },
          {
            name: 'Form-Data Multipart',
            value: 'multipart-form-data',
          },
          {
            name: 'Form Encoded',
            value: 'form-urlencoded',
          },
          {
            name: 'Raw/Custom',
            value: 'raw',
          },
        ],
        default: 'json',
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        displayOptions: {
          show: {
            sendBody: [true],
            contentType: ['raw'],
          },
        },
        default: '',
        placeholder: 'Raw body content',
        description: 'Raw body to send',
      },
      {
        displayName: 'JSON Body',
        name: 'jsonBody',
        type: 'string',
        typeOptions: {
          rows: 5,
        },
        displayOptions: {
          show: {
            sendBody: [true],
            contentType: ['json'],
          },
        },
        default: '{}',
        description: 'JSON body to send',
      },
      {
        displayName: 'Headers',
        name: 'headers',
        placeholder: 'Add Header',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Header',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Name of the header',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'Value of the header',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Query Parameters',
        name: 'queryParameters',
        placeholder: 'Add Parameter',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Parameter',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Name of the parameter',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'Value of the parameter',
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const returnData: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const method = this.getNodeParameter('method', i) as string;
      const url = this.getNodeParameter('url', i) as string;
      const authentication = this.getNodeParameter('authentication', i) as string;
      const sendBody = this.getNodeParameter('sendBody', i, false) as boolean;
      const headers = this.getNodeParameter('headers', i, {}) as any;
      const queryParameters = this.getNodeParameter('queryParameters', i, {}) as any;

      // Construir headers
      const requestHeaders: { [key: string]: string } = {};
      
      if (headers.parameter) {
        for (const header of headers.parameter) {
          if (header.name && header.value) {
            requestHeaders[header.name] = header.value;
          }
        }
      }

      // Construir query parameters
      const queryParams = new URLSearchParams();
      if (queryParameters.parameter) {
        for (const param of queryParameters.parameter) {
          if (param.name && param.value) {
            queryParams.append(param.name, param.value);
          }
        }
      }

      // Construir URL final
      const finalUrl = queryParams.toString() 
        ? `${url}?${queryParams.toString()}` 
        : url;

      // Simular requisição HTTP
      let responseData: any = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
        },
        data: {
          method: method,
          url: finalUrl,
          headers: requestHeaders,
          timestamp: new Date().toISOString(),
        },
      };

      // Adicionar body se necessário
      if (sendBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const contentType = this.getNodeParameter('contentType', i) as string;
        
        if (contentType === 'json') {
          const jsonBody = this.getNodeParameter('jsonBody', i, '{}') as string;
          try {
            responseData.data.body = JSON.parse(jsonBody);
          } catch (error) {
            responseData.data.body = jsonBody;
          }
        } else if (contentType === 'raw') {
          const body = this.getNodeParameter('body', i, '') as string;
          responseData.data.body = body;
        }
      }

      // Simular autenticação
      if (authentication === 'basicAuth') {
        const username = this.getNodeParameter('username', i) as string;
        const password = this.getNodeParameter('password', i) as string;
        responseData.data.auth = { username, password: '***' };
      }

      returnData.push({
        json: responseData,
        pairedItem: { item: i },
      });
    }

    return returnData;
  }
} 