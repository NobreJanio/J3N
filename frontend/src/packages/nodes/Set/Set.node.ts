import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class Set implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Set',
    name: 'set',
    icon: 'fa:pen',
    group: ['transform'],
    version: 1,
    description: 'Sets values on items and optionally remove other values',
    defaults: {
      name: 'Set',
      color: '#0000FF',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Keep Only Set',
        name: 'keepOnlySet',
        type: 'boolean',
        default: true,
        description: 'Whether to keep only the values set on this node and remove all others',
      },
      {
        displayName: 'Values to Set',
        name: 'values',
        placeholder: 'Add Value',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        description: 'The value to set',
        default: {},
        options: [
          {
            name: 'boolean',
            displayName: 'Boolean',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                description: 'Name of the property to write data to',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'boolean',
                default: false,
                description: 'The boolean value to write in the property',
              },
            ],
          },
          {
            name: 'number',
            displayName: 'Number',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                description: 'Name of the property to write data to',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'number',
                default: 0,
                description: 'The number value to write in the property',
              },
            ],
          },
          {
            name: 'string',
            displayName: 'String',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                description: 'Name of the property to write data to',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'The string value to write in the property',
              },
            ],
          },
          {
            name: 'object',
            displayName: 'Object',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                description: 'Name of the property to write data to',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                typeOptions: {
                  rows: 4,
                },
                default: '{}',
                placeholder: '{"key": "value"}',
                description: 'The object value as JSON string to write in the property',
              },
            ],
          },
          {
            name: 'array',
            displayName: 'Array',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                description: 'Name of the property to write data to',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                typeOptions: {
                  rows: 4,
                },
                default: '[]',
                placeholder: '["item1", "item2", "item3"]',
                description: 'The array value as JSON string to write in the property',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'fixedCollection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            name: 'dotNotation',
            displayName: 'Dot Notation',
            values: [
              {
                displayName: 'Dot Notation',
                name: 'dotNotation',
                type: 'boolean',
                default: true,
                description: 'Whether to use dot-notation to set deep object properties',
              },
            ],
          },
          {
            name: 'ignoreConversionErrors',
            displayName: 'Ignore Conversion Errors',
            values: [
              {
                displayName: 'Ignore Conversion Errors',
                name: 'ignoreConversionErrors',
                type: 'boolean',
                default: false,
                description: 'Whether to ignore errors when converting values',
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
      const keepOnlySet = this.getNodeParameter('keepOnlySet', i) as boolean;
      const values = this.getNodeParameter('values', i, {}) as any;
      const options = this.getNodeParameter('options', i, {}) as any;

      let newItem: any = {};

      // Se keepOnlySet for false, começar com o item original
      if (!keepOnlySet) {
        newItem = { ...items[i].json };
      }

      // Processar valores booleanos
      if (values.boolean) {
        for (const boolValue of values.boolean) {
          if (boolValue.name) {
            this.setProperty(newItem, boolValue.name, boolValue.value, options);
          }
        }
      }

      // Processar valores numéricos
      if (values.number) {
        for (const numValue of values.number) {
          if (numValue.name) {
            this.setProperty(newItem, numValue.name, numValue.value, options);
          }
        }
      }

      // Processar valores string
      if (values.string) {
        for (const strValue of values.string) {
          if (strValue.name) {
            this.setProperty(newItem, strValue.name, strValue.value, options);
          }
        }
      }

      // Processar valores object (JSON)
      if (values.object) {
        for (const objValue of values.object) {
          if (objValue.name) {
            try {
              const parsedObject = JSON.parse(objValue.value);
              this.setProperty(newItem, objValue.name, parsedObject, options);
            } catch (error) {
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Invalid JSON for object property "${objValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              // Se ignorar erros, definir como string
              this.setProperty(newItem, objValue.name, objValue.value, options);
            }
          }
        }
      }

      // Processar valores array (JSON)
      if (values.array) {
        for (const arrValue of values.array) {
          if (arrValue.name) {
            try {
              const parsedArray = JSON.parse(arrValue.value);
              if (!Array.isArray(parsedArray)) {
                throw new Error('Value is not a valid array');
              }
              this.setProperty(newItem, arrValue.name, parsedArray, options);
            } catch (error) {
              if (!options.ignoreConversionErrors?.ignoreConversionErrors) {
                throw new Error(`Invalid JSON array for property "${arrValue.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              // Se ignorar erros, definir como string
              this.setProperty(newItem, arrValue.name, arrValue.value, options);
            }
          }
        }
      }

      returnData.push({
        json: newItem,
        pairedItem: { item: i },
      });
    }

    return returnData;
  }

  private setProperty(obj: any, path: string, value: any, options: any) {
    const useDotNotation = options.dotNotation?.dotNotation !== false;
    
    if (useDotNotation && path.includes('.')) {
      // Usar dot notation para propriedades aninhadas
      const keys = path.split('.');
      let current = obj;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
    } else {
      // Definir propriedade diretamente
      obj[path] = value;
    }
  }
} 