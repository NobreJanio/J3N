import { INodeType, INodeTypeDescription } from '../../../types/NodeTypes';

export class WorkflowTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Workflow Trigger',
    name: 'workflowTrigger',
    icon: 'workflow',
    group: ['trigger'],
    version: 1,
    description: 'Runs when executed by another workflow',
    defaults: {
      name: 'Workflow Trigger',
      color: '#8b5cf6',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Workflow Name',
        name: 'workflowName',
        type: 'string',
        default: '',
        placeholder: 'Enter workflow name',
        description: 'Name of the workflow that can trigger this',
      },
      {
        displayName: 'Wait for Completion',
        name: 'waitForCompletion',
        type: 'boolean',
        default: true,
        description: 'Whether to wait for the calling workflow to complete',
      },
      {
        displayName: 'Pass Data',
        name: 'passData',
        type: 'boolean',
        default: true,
        description: 'Whether to pass data from the calling workflow',
      },
    ],
  };

  async execute(this: any, items: any[]): Promise<any[]> {
    const workflowName = this.getNodeParameter('workflowName', 0, '') as string;
    const waitForCompletion = this.getNodeParameter('waitForCompletion', 0, true) as boolean;
    const passData = this.getNodeParameter('passData', 0, true) as boolean;

    // Se há dados de entrada (de outro workflow), use-os
    const inputData = items.length > 0 && passData ? items[0].json : {};

    return [
      {
        json: {
          ...inputData,
          trigger: 'workflow',
          callingWorkflow: workflowName,
          waitForCompletion,
          passData,
          timestamp: new Date().toISOString(),
          message: `Workflow triggered by: ${workflowName || 'Unknown workflow'}`,
        },
      },
    ];
  }
} 