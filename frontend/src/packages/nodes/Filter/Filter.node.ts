import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class Filter implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Filter',
    name: 'filter',
    icon: 'fa:filter',
    group: ['transform'],
    version: 1,
    description: 'Filter items based on conditions',
    defaults: {
      name: 'Filter',
      color: '#7B68EE',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Conditions',
        name: 'conditions',
        placeholder: 'Add Condition',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        description: 'The conditions to filter by',
        default: {},
        options: [
          {
            name: 'boolean',
            displayName: 'Boolean',
            values: [
              {
                displayName: 'Field',
                name: 'field',
                type: 'string',
                default: '',
                description: 'The field to check (use dot notation for nested fields)',
                placeholder: 'data.name',
              },
              {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                  {
                    name: 'Equal',
                    value: 'equal',
                  },
                  {
                    name: 'Not Equal',
                    value: 'notEqual',
                  },
                  {
                    name: 'Larger',
                    value: 'larger',
                  },
                  {
                    name: 'Larger Equal',
                    value: 'largerEqual',
                  },
                  {
                    name: 'Smaller',
                    value: 'smaller',
                  },
                  {
                    name: 'Smaller Equal',
                    value: 'smallerEqual',
                  },
                  {
                    name: 'Contains',
                    value: 'contains',
                  },
                  {
                    name: 'Not Contains',
                    value: 'notContains',
                  },
                  {
                    name: 'Starts With',
                    value: 'startsWith',
                  },
                  {
                    name: 'Ends With',
                    value: 'endsWith',
                  },
                  {
                    name: 'Regex',
                    value: 'regex',
                  },
                  {
                    name: 'Is Empty',
                    value: 'isEmpty',
                  },
                  {
                    name: 'Is Not Empty',
                    value: 'isNotEmpty',
                  },
                  {
                    name: 'Exists',
                    value: 'exists',
                  },
                  {
                    name: 'Not Exists',
                    value: 'notExists',
                  },
                ],
                default: 'equal',
                description: 'Operation to use for filtering',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                displayOptions: {
                  hide: {
                    operation: ['isEmpty', 'isNotEmpty', 'exists', 'notExists'],
                  },
                },
                default: '',
                description: 'The value to compare with',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Combine',
        name: 'combineOperation',
        type: 'options',
        options: [
          {
            name: 'ALL',
            value: 'all',
            description: 'All conditions must be met',
          },
          {
            name: 'ANY',
            value: 'any',
            description: 'Any condition must be met',
          },
        ],
        default: 'all',
        description: 'How to combine multiple conditions',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const returnData: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const conditions = this.getNodeParameter('conditions', i, {}) as any;
      const combineOperation = this.getNodeParameter('combineOperation', i) as string;

      let conditionResults: boolean[] = [];

      // Avaliar todas as condições
      if (conditions.boolean) {
        for (const condition of conditions.boolean) {
          const field = condition.field;
          const operation = condition.operation;
          const value = condition.value;

          const fieldValue = this.getFieldValue(items[i].json, field);
          const result = this.evaluateCondition(fieldValue, operation, value);
          conditionResults.push(result);
        }
      }

      // Se não há condições, incluir o item
      if (conditionResults.length === 0) {
        returnData.push({
          json: items[i].json,
          pairedItem: { item: i },
        });
        continue;
      }

      // Combinar resultados das condições
      let finalResult = false;
      if (combineOperation === 'all') {
        finalResult = conditionResults.every(result => result === true);
      } else if (combineOperation === 'any') {
        finalResult = conditionResults.some(result => result === true);
      }

      // Incluir item se passou no filtro
      if (finalResult) {
        returnData.push({
          json: items[i].json,
          pairedItem: { item: i },
        });
      }
    }

    return returnData;
  }

  private getFieldValue(obj: any, field: string): any {
    if (!field) return obj;
    
    const keys = field.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  private evaluateCondition(fieldValue: any, operation: string, compareValue: any): boolean {
    const convertedFieldValue = this.convertValue(fieldValue);
    const convertedCompareValue = this.convertValue(compareValue);

    switch (operation) {
      case 'equal':
        return convertedFieldValue === convertedCompareValue;
      case 'notEqual':
        return convertedFieldValue !== convertedCompareValue;
      case 'larger':
        return convertedFieldValue > convertedCompareValue;
      case 'largerEqual':
        return convertedFieldValue >= convertedCompareValue;
      case 'smaller':
        return convertedFieldValue < convertedCompareValue;
      case 'smallerEqual':
        return convertedFieldValue <= convertedCompareValue;
      case 'contains':
        return String(convertedFieldValue).toLowerCase().includes(String(convertedCompareValue).toLowerCase());
      case 'notContains':
        return !String(convertedFieldValue).toLowerCase().includes(String(convertedCompareValue).toLowerCase());
      case 'startsWith':
        return String(convertedFieldValue).toLowerCase().startsWith(String(convertedCompareValue).toLowerCase());
      case 'endsWith':
        return String(convertedFieldValue).toLowerCase().endsWith(String(convertedCompareValue).toLowerCase());
      case 'regex':
        try {
          const regex = new RegExp(String(convertedCompareValue), 'i');
          return regex.test(String(convertedFieldValue));
        } catch {
          return false;
        }
      case 'isEmpty':
        return convertedFieldValue === '' || convertedFieldValue === null || convertedFieldValue === undefined;
      case 'isNotEmpty':
        return convertedFieldValue !== '' && convertedFieldValue !== null && convertedFieldValue !== undefined;
      case 'exists':
        return fieldValue !== undefined;
      case 'notExists':
        return fieldValue === undefined;
      default:
        return false;
    }
  }

  private convertValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Tentar converter para número se possível
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    // Tentar converter para boolean
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }

    return value;
  }
} 