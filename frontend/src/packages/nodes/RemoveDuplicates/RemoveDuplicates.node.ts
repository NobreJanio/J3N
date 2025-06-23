import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class RemoveDuplicates implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Remove Duplicates',
    name: 'removeDuplicates',
    icon: 'fa:copy',
    group: ['transform'],
    version: 1,
    description: 'Remove duplicate items based on specified fields',
    defaults: {
      name: 'Remove Duplicates',
      color: '#FF9800',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Compare Fields',
        name: 'compareFields',
        type: 'string',
        default: '',
        description: 'Comma-separated list of fields to compare for duplicates (leave empty to compare entire objects)',
        placeholder: 'id, email, name',
      },
      {
        displayName: 'Keep',
        name: 'keep',
        type: 'options',
        options: [
          {
            name: 'First Occurrence',
            value: 'first',
            description: 'Keep the first occurrence of each duplicate',
          },
          {
            name: 'Last Occurrence',
            value: 'last',
            description: 'Keep the last occurrence of each duplicate',
          },
        ],
        default: 'first',
        description: 'Which occurrence to keep when duplicates are found',
      },
      {
        displayName: 'Case Sensitive',
        name: 'caseSensitive',
        type: 'boolean',
        default: true,
        description: 'Whether string comparisons should be case sensitive',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const compareFields = this.getNodeParameter('compareFields', 0, '') as string;
    const keep = this.getNodeParameter('keep', 0) as string;
    const caseSensitive = this.getNodeParameter('caseSensitive', 0) as boolean;

    if (items.length === 0) {
      return [];
    }

    const fieldsToCompare = compareFields
      .split(',')
      .map(field => field.trim())
      .filter(field => field.length > 0);

    const seen = new Map<string, number>();
    const returnData: any[] = [];

    // Primeiro passo: identificar duplicatas
    for (let i = 0; i < items.length; i++) {
      const key = this.generateKey(items[i].json, fieldsToCompare, caseSensitive);
      
      if (!seen.has(key)) {
        seen.set(key, i);
        if (keep === 'first') {
          returnData.push({
            json: items[i].json,
            pairedItem: { item: i },
          });
        }
      } else {
        if (keep === 'last') {
          // Remover o item anterior e adicionar o atual
          const previousIndex = seen.get(key)!;
          const indexInReturn = returnData.findIndex(item => 
            item.pairedItem && item.pairedItem.item === previousIndex
          );
          
          if (indexInReturn !== -1) {
            returnData.splice(indexInReturn, 1);
          }
          
          returnData.push({
            json: items[i].json,
            pairedItem: { item: i },
          });
          
          seen.set(key, i);
        }
      }
    }

    return returnData;
  }

  private generateKey(obj: any, fields: string[], caseSensitive: boolean): string {
    if (fields.length === 0) {
      // Se não há campos específicos, usar o objeto inteiro
      return JSON.stringify(this.sortObjectKeys(obj));
    }

    const keyParts: string[] = [];
    
    for (const field of fields) {
      const value = this.getFieldValue(obj, field);
      let stringValue = '';
      
      if (value !== null && value !== undefined) {
        stringValue = String(value);
        if (!caseSensitive && typeof value === 'string') {
          stringValue = stringValue.toLowerCase();
        }
      }
      
      keyParts.push(`${field}:${stringValue}`);
    }
    
    return keyParts.join('|');
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

  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }

    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sorted;
  }
} 