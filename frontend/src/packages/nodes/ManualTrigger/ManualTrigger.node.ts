import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class ManualTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Manual Trigger',
    name: 'manualTrigger',
    icon: 'play',
    group: ['trigger'],
    version: 1,
    description: 'Runs the workflow when manually executed',
    defaults: {
      name: 'Manual Trigger',
      color: '#16a34a',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Execution Mode',
        name: 'mode',
        type: 'options',
        options: [
          {
            name: 'Once',
            value: 'once',
            description: 'Execute once when triggered',
          },
          {
            name: 'Multiple Times',
            value: 'multiple',
            description: 'Can be executed multiple times',
          },
        ],
        default: 'once',
        description: 'How the trigger should behave when executed',
      },
      {
        displayName: 'Initial Data',
        name: 'initialData',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '{}',
        placeholder: '{"message": "Workflow started manually"}',
        description: 'Initial data to pass to the workflow (JSON format)',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const mode = this.getNodeParameter('mode', 0, 'once') as string;
    const initialDataStr = this.getNodeParameter('initialData', 0, '{}') as string;
    
    let initialData;
    try {
      initialData = JSON.parse(initialDataStr);
    } catch (error) {
      initialData = { message: 'Workflow started manually' };
    }

    return [
      {
        json: {
          ...initialData,
          trigger: 'manual',
          executionMode: mode,
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }
} 