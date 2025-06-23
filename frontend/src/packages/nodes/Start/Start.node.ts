import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class Start implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Start',
    name: 'start',
    icon: 'play',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow execution',
    defaults: {
      name: 'Start',
      color: '#16a34a',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Initial Message',
        name: 'message',
        type: 'string',
        default: 'Workflow started',
        placeholder: 'Enter initial message',
        description: 'Message to start the workflow with',
      },
      {
        displayName: 'Include Timestamp',
        name: 'includeTimestamp',
        type: 'boolean',
        default: true,
        description: 'Whether to include timestamp in the output',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const message = this.getNodeParameter('message', 0, 'Workflow started') as string;
    const includeTimestamp = this.getNodeParameter('includeTimestamp', 0, true) as boolean;

    const output: any = {
      trigger: 'start',
      message,
    };

    if (includeTimestamp) {
      output.timestamp = new Date().toISOString();
    }

    return [
      {
        json: output,
      },
    ];
  }
} 