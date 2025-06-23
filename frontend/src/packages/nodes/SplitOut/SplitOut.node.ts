import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class SplitOut implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Split Out',
    name: 'splitOut',
    icon: 'fa:expand-arrows-alt',
    group: ['transform'],
    version: 1,
    description: 'Split arrays into individual items',
    defaults: {
      name: 'Split Out',
      color: '#4CAF50',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Field to Split',
        name: 'fieldToSplit',
        type: 'string',
        default: '',
        required: true,
        description: 'The field containing the array to split (use dot notation for nested fields)',
        placeholder: 'data.items',
      },
      {
        displayName: 'Include Original Data',
        name: 'includeOriginalData',
        type: 'boolean',
        default: true,
        description: 'Whether to include the original item data in each split item',
      },
      {
        displayName: 'Destination Field',
        name: 'destinationField',
        type: 'string',
        default: 'item',
        description: 'The field name to store each array item',
        placeholder: 'item',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const returnData: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const fieldToSplit = this.getNodeParameter('fieldToSplit', i) as string;
      const includeOriginalData = this.getNodeParameter('includeOriginalData', i) as boolean;
      const destinationField = this.getNodeParameter('destinationField', i, 'item') as string;

      if (!fieldToSplit) {
        throw new Error('Field to Split is required');
      }

      const arrayValue = this.getFieldValue(items[i].json, fieldToSplit);

      if (!Array.isArray(arrayValue)) {
        // Se não é um array, tratar como item único
        const newItem: any = {};
        
        if (includeOriginalData) {
          Object.assign(newItem, items[i].json);
        }
        
        newItem[destinationField] = arrayValue;

        returnData.push({
          json: newItem,
          pairedItem: { item: i },
        });
        continue;
      }

      // Se é um array, dividir em itens individuais
      for (let j = 0; j < arrayValue.length; j++) {
        const newItem: any = {};
        
        if (includeOriginalData) {
          Object.assign(newItem, items[i].json);
        }
        
        newItem[destinationField] = arrayValue[j];
        newItem._splitIndex = j;
        newItem._splitTotal = arrayValue.length;

        returnData.push({
          json: newItem,
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
} 