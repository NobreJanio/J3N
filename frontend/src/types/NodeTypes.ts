// Tipos base para nodes
export interface INodeType {
  description: INodeTypeDescription;
  execute(this: any, items: any[]): Promise<any[]>;
}

export interface INodeTypeDescription {
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

export interface INodeCredential {
  name: string;
  required: boolean;
}

export interface INodeProperties {
  displayName: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'multiOptions' | 'color' | 'fixedCollection';
  typeOptions?: {
    rows?: number;
    password?: boolean;
    multipleValues?: boolean;
  };
  options?: INodePropertyOptions[] | INodePropertyCollection[];
  displayOptions?: {
    show?: { [key: string]: (string | boolean)[] };
    hide?: { [key: string]: (string | boolean)[] };
  };
  default: any;
  placeholder?: string;
  description?: string;
  required?: boolean;
  noDataExpression?: boolean;
  values?: INodeProperties[];
}

export interface INodePropertyCollection {
  name: string;
  displayName: string;
  values: INodeProperties[];
}

export interface INodePropertyOptions {
  name: string;
  value: string;
  description?: string;
  action?: string;
}

// Tipos para credenciais
export interface ICredentialType {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: ICredentialProperty[];
  authenticate?: {
    type: 'generic' | 'oauth2';
    properties: {
      headers?: { [key: string]: string };
      body?: { [key: string]: any };
      qs?: { [key: string]: any };
    };
  };
  test?: {
    request: {
      baseURL: string;
      url: string;
      method?: string;
    };
  };
}

export interface ICredentialProperty {
  displayName: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'options';
  typeOptions?: {
    password?: boolean;
  };
  default: any;
  required?: boolean;
  description?: string;
  options?: INodePropertyOptions[];
}

// Tipos para execução
export interface IExecuteData {
  json: { [key: string]: any };
  binary?: { [key: string]: any };
  pairedItem?: { item: number };
}

export interface INodeExecutionData {
  data: IExecuteData[];
  source?: {
    main?: ISourceData[][];
  };
}

export interface ISourceData {
  previousNode: string;
  previousNodeOutput?: number;
  previousNodeRun?: number;
}

// Tipos para parâmetros
export interface INodeParameterValue {
  [key: string]: any;
}

// Tipos para contexto de execução
export interface IExecuteFunctions {
  getNodeParameter(parameterName: string, itemIndex: number): any;
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData[];
  getCredentials(type: string): Promise<ICredentialProperty[]>;
  helpers: {
    request(options: any): Promise<any>;
  };
} 