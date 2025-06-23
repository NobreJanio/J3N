import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class If implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'IF',
    name: 'if',
    icon: 'fa:map-signs',
    group: ['logic'],
    version: 1,
    description: 'Routes data to different branches based on conditions',
    defaults: {
      name: 'IF',
      color: '#408000',
    },
    inputs: ['main'],
    outputs: ['main', 'main'],
    properties: [
      {
        displayName: 'Conditions',
        name: 'conditions',
        placeholder: 'Add Condition',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        description: 'The conditions to check',
        default: {},
        options: [
          {
            name: 'boolean',
            displayName: 'Boolean',
            values: [
              {
                displayName: 'Value 1',
                name: 'value1',
                type: 'string',
                default: '',
                description: 'The value to compare with the second one',
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
                    name: 'Not Starts With',
                    value: 'notStartsWith',
                  },
                  {
                    name: 'Ends With',
                    value: 'endsWith',
                  },
                  {
                    name: 'Not Ends With',
                    value: 'notEndsWith',
                  },
                  {
                    name: 'Regex',
                    value: 'regex',
                  },
                  {
                    name: 'Not Regex',
                    value: 'notRegex',
                  },
                  {
                    name: 'Is Empty',
                    value: 'isEmpty',
                  },
                  {
                    name: 'Is Not Empty',
                    value: 'isNotEmpty',
                  },
                ],
                default: 'equal',
                description: 'Operation to decide where the the data should be mapped to',
              },
              {
                displayName: 'Value 2',
                name: 'value2',
                type: 'string',
                displayOptions: {
                  hide: {
                    operation: ['isEmpty', 'isNotEmpty'],
                  },
                },
                default: '',
                description: 'The value to compare with the first one',
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
            description: 'Only if all conditions are met it goes into "true" branch',
          },
          {
            name: 'ANY',
            value: 'any',
            description: 'If any condition is met it goes into "true" branch',
          },
        ],
        default: 'all',
        description: 'If multiple conditions are defined how to combine them',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[][]> {
    const returnDataTrue: any[] = [];
    const returnDataFalse: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const conditions = this.getNodeParameter('conditions', i, {}) as any;
      const combineOperation = this.getNodeParameter('combineOperation', i) as string;

      let conditionResults: boolean[] = [];

      // Avaliar todas as condições
      if (conditions.boolean) {
        for (const condition of conditions.boolean) {
          const value1 = condition.value1;
          const operation = condition.operation;
          const value2 = condition.value2;

          const result = this.evaluateCondition(value1, operation, value2);
          conditionResults.push(result);
        }
      }

      // Combinar resultados das condições
      let finalResult = false;
      if (conditionResults.length > 0) {
        if (combineOperation === 'all') {
          finalResult = conditionResults.every(result => result === true);
        } else if (combineOperation === 'any') {
          finalResult = conditionResults.some(result => result === true);
        }
      }

      // Rotear dados baseado no resultado
      if (finalResult) {
        returnDataTrue.push({
          json: items[i].json,
          pairedItem: { item: i },
        });
      } else {
        returnDataFalse.push({
          json: items[i].json,
          pairedItem: { item: i },
        });
      }
    }

    return [returnDataTrue, returnDataFalse];
  }

  private evaluateCondition(value1: any, operation: string, value2: any): boolean {
    // Converter valores para comparação
    const val1 = this.convertValue(value1);
    const val2 = this.convertValue(value2);

    switch (operation) {
      case 'equal':
        return val1 === val2;
      case 'notEqual':
        return val1 !== val2;
      case 'larger':
        return Number(val1) > Number(val2);
      case 'largerEqual':
        return Number(val1) >= Number(val2);
      case 'smaller':
        return Number(val1) < Number(val2);
      case 'smallerEqual':
        return Number(val1) <= Number(val2);
      case 'contains':
        return String(val1).includes(String(val2));
      case 'notContains':
        return !String(val1).includes(String(val2));
      case 'startsWith':
        return String(val1).startsWith(String(val2));
      case 'notStartsWith':
        return !String(val1).startsWith(String(val2));
      case 'endsWith':
        return String(val1).endsWith(String(val2));
      case 'notEndsWith':
        return !String(val1).endsWith(String(val2));
      case 'regex':
        try {
          const regex = new RegExp(String(val2));
          return regex.test(String(val1));
        } catch (error) {
          return false;
        }
      case 'notRegex':
        try {
          const regex = new RegExp(String(val2));
          return !regex.test(String(val1));
        } catch (error) {
          return true;
        }
      case 'isEmpty':
        return val1 === '' || val1 === null || val1 === undefined;
      case 'isNotEmpty':
        return val1 !== '' && val1 !== null && val1 !== undefined;
      default:
        return false;
    }
  }

  private convertValue(value: any): any {
    if (typeof value === 'string') {
      // Tentar converter string para número se possível
      const numValue = Number(value);
      if (!isNaN(numValue) && value.trim() !== '') {
        return numValue;
      }
      
      // Tentar converter string para boolean
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    
    return value;
  }
} 