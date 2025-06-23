import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class ScheduleTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Schedule Trigger',
    name: 'scheduleTrigger',
    icon: 'clock',
    group: ['trigger'],
    version: 1,
    description: 'Runs the workflow on a schedule',
    defaults: {
      name: 'Schedule Trigger',
      color: '#f59e0b',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Trigger Interval',
        name: 'interval',
        type: 'options',
        options: [
          {
            name: 'Every Minute',
            value: 'minute',
            description: 'Execute every minute',
          },
          {
            name: 'Every Hour',
            value: 'hour',
            description: 'Execute every hour',
          },
          {
            name: 'Every Day',
            value: 'day',
            description: 'Execute every day',
          },
          {
            name: 'Every Week',
            value: 'week',
            description: 'Execute every week',
          },
          {
            name: 'Custom Cron',
            value: 'cron',
            description: 'Use custom cron expression',
          },
        ],
        default: 'hour',
        description: 'How often the workflow should be triggered',
      },
      {
        displayName: 'Cron Expression',
        name: 'cronExpression',
        type: 'string',
        displayOptions: {
          show: {
            interval: ['cron'],
          },
        },
        default: '0 * * * *',
        placeholder: '0 * * * *',
        description: 'Cron expression for custom scheduling',
      },
      {
        displayName: 'Timezone',
        name: 'timezone',
        type: 'string',
        default: 'UTC',
        placeholder: 'America/New_York',
        description: 'Timezone for the schedule',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const interval = this.getNodeParameter('interval', 0, 'hour') as string;
    const cronExpression = this.getNodeParameter('cronExpression', 0, '0 * * * *') as string;
    const timezone = this.getNodeParameter('timezone', 0, 'UTC') as string;

    return [
      {
        json: {
          trigger: 'schedule',
          interval,
          cronExpression: interval === 'cron' ? cronExpression : undefined,
          timezone,
          timestamp: new Date().toISOString(),
          message: `Workflow triggered by schedule (${interval})`,
        },
      },
    ];
  }
} 