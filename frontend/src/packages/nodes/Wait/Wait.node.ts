import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class Wait implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Wait',
    name: 'wait',
    icon: 'fa:clock',
    group: ['logic'],
    version: 1,
    description: 'Pause workflow execution for a specified amount of time',
    defaults: {
      name: 'Wait',
      color: '#9C27B0',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Wait Time',
        name: 'waitTime',
        type: 'number',
        default: 1,
        description: 'Amount of time to wait',
      },
      {
        displayName: 'Time Unit',
        name: 'timeUnit',
        type: 'options',
        options: [
          {
            name: 'Seconds',
            value: 'seconds',
          },
          {
            name: 'Minutes',
            value: 'minutes',
          },
          {
            name: 'Hours',
            value: 'hours',
          },
        ],
        default: 'seconds',
        description: 'The unit of time to wait',
      },
      {
        displayName: 'Resume On',
        name: 'resumeOn',
        type: 'options',
        options: [
          {
            name: 'Timer',
            value: 'timer',
            description: 'Resume after the specified time',
          },
          {
            name: 'Webhook',
            value: 'webhook',
            description: 'Resume when a webhook is called',
          },
        ],
        default: 'timer',
        description: 'How to resume the workflow',
      },
      {
        displayName: 'Webhook Path',
        name: 'webhookPath',
        type: 'string',
        displayOptions: {
          show: {
            resumeOn: ['webhook'],
          },
        },
        default: '',
        description: 'The webhook path to listen for resume signal',
        placeholder: '/resume-workflow',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const waitTime = this.getNodeParameter('waitTime', 0) as number;
    const timeUnit = this.getNodeParameter('timeUnit', 0) as string;
    const resumeOn = this.getNodeParameter('resumeOn', 0) as string;
    const webhookPath = this.getNodeParameter('webhookPath', 0, '') as string;

    let waitTimeMs = waitTime * 1000; // Default to seconds

    // Convert to milliseconds based on unit
    switch (timeUnit) {
      case 'minutes':
        waitTimeMs = waitTime * 60 * 1000;
        break;
      case 'hours':
        waitTimeMs = waitTime * 60 * 60 * 1000;
        break;
      case 'seconds':
      default:
        waitTimeMs = waitTime * 1000;
        break;
    }

    const returnData: any[] = [];

    for (let i = 0; i < items.length; i++) {
      if (resumeOn === 'timer') {
        // Simple timer wait
        await this.sleep(waitTimeMs);
        
        returnData.push({
          json: {
            ...items[i].json,
            _waitInfo: {
              waitTime,
              timeUnit,
              resumeOn,
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + waitTimeMs).toISOString(),
            },
          },
          pairedItem: { item: i },
        });
      } else if (resumeOn === 'webhook') {
        // Webhook wait (simplified - in real implementation this would need workflow state management)
        returnData.push({
          json: {
            ...items[i].json,
            _waitInfo: {
              waitTime,
              timeUnit,
              resumeOn,
              webhookPath,
              status: 'waiting_for_webhook',
              startTime: new Date().toISOString(),
            },
          },
          pairedItem: { item: i },
        });
      }
    }

    return returnData;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 