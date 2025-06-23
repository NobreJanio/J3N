import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class DateTime implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Date & Time',
    name: 'dateTime',
    icon: 'fa:calendar',
    group: ['transform'],
    version: 1,
    description: 'Work with date and time values',
    defaults: {
      name: 'Date & Time',
      color: '#FF6B6B',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        options: [
          {
            name: 'Get Current Date/Time',
            value: 'getCurrentDateTime',
            description: 'Get the current date and time',
          },
          {
            name: 'Format Date',
            value: 'formatDate',
            description: 'Format a date value',
          },
          {
            name: 'Parse Date',
            value: 'parseDate',
            description: 'Parse a date string',
          },
          {
            name: 'Add Time',
            value: 'addTime',
            description: 'Add time to a date',
          },
          {
            name: 'Subtract Time',
            value: 'subtractTime',
            description: 'Subtract time from a date',
          },
          {
            name: 'Get Date Parts',
            value: 'getDateParts',
            description: 'Extract parts from a date',
          },
          {
            name: 'Compare Dates',
            value: 'compareDates',
            description: 'Compare two dates',
          },
        ],
        default: 'getCurrentDateTime',
        description: 'The action to perform',
      },
      {
        displayName: 'Date Field',
        name: 'dateField',
        type: 'string',
        displayOptions: {
          show: {
            action: ['formatDate', 'parseDate', 'addTime', 'subtractTime', 'getDateParts'],
          },
        },
        default: '',
        description: 'The field containing the date value (use dot notation for nested fields)',
        placeholder: 'data.createdAt',
      },
      {
        displayName: 'Date Format',
        name: 'dateFormat',
        type: 'options',
        displayOptions: {
          show: {
            action: ['formatDate'],
          },
        },
        options: [
          {
            name: 'ISO 8601 (2023-12-25T10:30:00.000Z)',
            value: 'iso',
          },
          {
            name: 'Date Only (2023-12-25)',
            value: 'dateOnly',
          },
          {
            name: 'Time Only (10:30:00)',
            value: 'timeOnly',
          },
          {
            name: 'Human Readable (December 25, 2023)',
            value: 'humanReadable',
          },
          {
            name: 'Short Date (12/25/2023)',
            value: 'shortDate',
          },
          {
            name: 'Custom Format',
            value: 'custom',
          },
        ],
        default: 'iso',
        description: 'The format to use for the date',
      },
      {
        displayName: 'Custom Format',
        name: 'customFormat',
        type: 'string',
        displayOptions: {
          show: {
            action: ['formatDate'],
            dateFormat: ['custom'],
          },
        },
        default: 'YYYY-MM-DD HH:mm:ss',
        description: 'Custom date format (using moment.js format)',
        placeholder: 'YYYY-MM-DD HH:mm:ss',
      },
      {
        displayName: 'Time Unit',
        name: 'timeUnit',
        type: 'options',
        displayOptions: {
          show: {
            action: ['addTime', 'subtractTime'],
          },
        },
        options: [
          {
            name: 'Years',
            value: 'years',
          },
          {
            name: 'Months',
            value: 'months',
          },
          {
            name: 'Days',
            value: 'days',
          },
          {
            name: 'Hours',
            value: 'hours',
          },
          {
            name: 'Minutes',
            value: 'minutes',
          },
          {
            name: 'Seconds',
            value: 'seconds',
          },
        ],
        default: 'days',
        description: 'The unit of time to add/subtract',
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        displayOptions: {
          show: {
            action: ['addTime', 'subtractTime'],
          },
        },
        default: 1,
        description: 'The amount of time to add/subtract',
      },
      {
        displayName: 'Output Field',
        name: 'outputField',
        type: 'string',
        default: 'dateTime',
        description: 'The field name to store the result',
        placeholder: 'dateTime',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const returnData: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const action = this.getNodeParameter('action', i) as string;
      const outputField = this.getNodeParameter('outputField', i, 'dateTime') as string;

      let result: any = {};

      try {
        switch (action) {
          case 'getCurrentDateTime':
            result = this.getCurrentDateTime();
            break;
          case 'formatDate':
            result = this.formatDate(items[i], i);
            break;
          case 'parseDate':
            result = this.parseDate(items[i], i);
            break;
          case 'addTime':
            result = this.addTime(items[i], i);
            break;
          case 'subtractTime':
            result = this.subtractTime(items[i], i);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        returnData.push({
          json: {
            ...items[i].json,
            [outputField]: result,
          },
          pairedItem: { item: i },
        });
      } catch (error: any) {
        throw new Error(`Error in DateTime node: ${error.message}`);
      }
    }

    return returnData;
  }

  private getCurrentDateTime(): any {
    const now = new Date();
    return {
      iso: now.toISOString(),
      timestamp: now.getTime(),
      dateOnly: now.toISOString().split('T')[0],
      timeOnly: now.toTimeString().split(' ')[0],
      humanReadable: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      shortDate: now.toLocaleDateString('en-US'),
    };
  }

  private formatDate(this: any, item: any, index: number): any {
    const dateField = this.getNodeParameter('dateField', index) as string;
    const dateFormat = this.getNodeParameter('dateFormat', index) as string;
    const customFormat = this.getNodeParameter('customFormat', index, '') as string;

    const dateValue = this.getFieldValue(item.json, dateField);
    if (!dateValue) {
      throw new Error(`Date field '${dateField}' not found or empty`);
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${dateValue}`);
    }

    switch (dateFormat) {
      case 'iso':
        return date.toISOString();
      case 'dateOnly':
        return date.toISOString().split('T')[0];
      case 'timeOnly':
        return date.toTimeString().split(' ')[0];
      case 'humanReadable':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'shortDate':
        return date.toLocaleDateString('en-US');
      case 'custom':
        return this.formatCustomDate(date, customFormat);
      default:
        return date.toISOString();
    }
  }

  private parseDate(this: any, item: any, index: number): any {
    const dateField = this.getNodeParameter('dateField', index) as string;

    const dateValue = this.getFieldValue(item.json, dateField);
    if (!dateValue) {
      throw new Error(`Date field '${dateField}' not found or empty`);
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error(`Unable to parse date: ${dateValue}`);
    }

    return {
      iso: date.toISOString(),
      timestamp: date.getTime(),
      valid: true,
    };
  }

  private addTime(this: any, item: any, index: number): any {
    const dateField = this.getNodeParameter('dateField', index) as string;
    const timeUnit = this.getNodeParameter('timeUnit', index) as string;
    const amount = this.getNodeParameter('amount', index) as number;

    const dateValue = this.getFieldValue(item.json, dateField);
    if (!dateValue) {
      throw new Error(`Date field '${dateField}' not found or empty`);
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${dateValue}`);
    }

    const newDate = new Date(date);
    this.addTimeToDate(newDate, timeUnit, amount);

    return {
      original: date.toISOString(),
      result: newDate.toISOString(),
      added: `${amount} ${timeUnit}`,
    };
  }

  private subtractTime(this: any, item: any, index: number): any {
    const dateField = this.getNodeParameter('dateField', index) as string;
    const timeUnit = this.getNodeParameter('timeUnit', index) as string;
    const amount = this.getNodeParameter('amount', index) as number;

    const dateValue = this.getFieldValue(item.json, dateField);
    if (!dateValue) {
      throw new Error(`Date field '${dateField}' not found or empty`);
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${dateValue}`);
    }

    const newDate = new Date(date);
    this.addTimeToDate(newDate, timeUnit, -amount);

    return {
      original: date.toISOString(),
      result: newDate.toISOString(),
      subtracted: `${amount} ${timeUnit}`,
    };
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

  private addTimeToDate(date: Date, unit: string, amount: number): void {
    switch (unit) {
      case 'years':
        date.setFullYear(date.getFullYear() + amount);
        break;
      case 'months':
        date.setMonth(date.getMonth() + amount);
        break;
      case 'days':
        date.setDate(date.getDate() + amount);
        break;
      case 'hours':
        date.setHours(date.getHours() + amount);
        break;
      case 'minutes':
        date.setMinutes(date.getMinutes() + amount);
        break;
      case 'seconds':
        date.setSeconds(date.getSeconds() + amount);
        break;
    }
  }

  private formatCustomDate(date: Date, format: string): string {
    const replacements: { [key: string]: string } = {
      'YYYY': date.getFullYear().toString(),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'DD': date.getDate().toString().padStart(2, '0'),
      'HH': date.getHours().toString().padStart(2, '0'),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'ss': date.getSeconds().toString().padStart(2, '0'),
    };

    let result = format;
    for (const [pattern, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(pattern, 'g'), replacement);
    }

    return result;
  }
} 