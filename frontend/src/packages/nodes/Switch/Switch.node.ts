import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class Switch implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Switch',
    name: 'switch',
    icon: 'fa:code-branch',
    group: ['logic'],
    version: 1,
    description: 'Route data to different outputs based on conditions',
    defaults: {
      name: 'Switch',
      color: '#FF5722',
    },
    inputs: ['main'],
    outputs: ['main', 'main', 'main', 'main'], // 4 outputs by default
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        options: [
          {
            name: 'Expression',
            value: 'expression',
            description: 'Use expressions to determine routing',
          },
          {
            name: 'Rules',
            value: 'rules',
            description: 'Use rules to determine routing',
          },
        ],
        default: 'rules',
        description: 'How to determine the routing',
      },
      {
        displayName: 'Data Property',
        name: 'dataProperty',
        type: 'string',
        displayOptions: {
          show: {
            mode: ['rules'],
          },
        },
        default: '',
        description: 'The property to check for routing decisions',
        placeholder: 'data.status',
      },
      {
        displayName: 'Rules',
        name: 'rules',
        placeholder: 'Add Rule',
        type: 'fixedCollection',
        displayOptions: {
          show: {
            mode: ['rules'],
          },
        },
        typeOptions: {
          multipleValues: true,
        },
        description: 'The rules to check',
        default: {},
        options: [
          {
            name: 'rule',
            displayName: 'Rule',
            values: [
              {
                displayName: 'Output',
                name: 'output',
                type: 'number',
                default: 0,
                description: 'The output index (0-3)',
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
                    name: 'Larger',
                    value: 'larger',
                  },
                  {
                    name: 'Smaller',
                    value: 'smaller',
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
                description: 'Operation to decide the routing',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                displayOptions: {
                  hide: {
                    operation: ['isEmpty', 'isNotEmpty'],
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
        displayName: 'Fallback Output',
        name: 'fallbackOutput',
        type: 'number',
        default: 3,
        description: 'Output to use when no rules match (0-3)',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[][]> {
    const mode = this.getNodeParameter('mode', 0) as string;
    const dataProperty = this.getNodeParameter('dataProperty', 0, '') as string;
    const rules = this.getNodeParameter('rules', 0, {}) as any;
    const fallbackOutput = this.getNodeParameter('fallbackOutput', 0) as number;

    // Initialize outputs
    const outputs: any[][] = [[], [], [], []];

    for (let i = 0; i < items.length; i++) {
      let outputIndex = fallbackOutput;

      if (mode === 'rules' && rules.rule) {
        const propertyValue = this.getFieldValue(items[i].json, dataProperty);

        // Check each rule
        for (const rule of rules.rule) {
          if (this.evaluateRule(propertyValue, rule.operation, rule.value)) {
            outputIndex = Math.max(0, Math.min(3, rule.output)); // Ensure output is between 0-3
            break;
          }
        }
      }

      // Add item to the determined output
      if (outputIndex >= 0 && outputIndex < outputs.length) {
        outputs[outputIndex].push({
          json: items[i].json,
          pairedItem: { item: i },
        });
      }
    }

    return outputs;
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

  private evaluateRule(value: any, operation: string, compareValue: any): boolean {
    const convertedValue = this.convertValue(value);
    const convertedCompareValue = this.convertValue(compareValue);

    switch (operation) {
      case 'equal':
        return convertedValue === convertedCompareValue;
      case 'notEqual':
        return convertedValue !== convertedCompareValue;
      case 'contains':
        return String(convertedValue).toLowerCase().includes(String(convertedCompareValue).toLowerCase());
      case 'notContains':
        return !String(convertedValue).toLowerCase().includes(String(convertedCompareValue).toLowerCase());
      case 'startsWith':
        return String(convertedValue).toLowerCase().startsWith(String(convertedCompareValue).toLowerCase());
      case 'endsWith':
        return String(convertedValue).toLowerCase().endsWith(String(convertedCompareValue).toLowerCase());
      case 'regex':
        try {
          const regex = new RegExp(String(convertedCompareValue), 'i');
          return regex.test(String(convertedValue));
        } catch {
          return false;
        }
      case 'larger':
        return convertedValue > convertedCompareValue;
      case 'smaller':
        return convertedValue < convertedCompareValue;
      case 'isEmpty':
        return convertedValue === '' || convertedValue === null || convertedValue === undefined;
      case 'isNotEmpty':
        return convertedValue !== '' && convertedValue !== null && convertedValue !== undefined;
      default:
        return false;
    }
  }

  private convertValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Try to convert to number if possible
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    // Try to convert to boolean
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }

    return value;
  }
} 