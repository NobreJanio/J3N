// Importar todos os nodes
import { HttpRequest } from './HttpRequest/HttpRequest.node';
import { Webhook } from './Webhook/Webhook.node';
import { Set } from './Set/Set.node';
import { If } from './If/If.node';
import { ManualTrigger } from './ManualTrigger/ManualTrigger.node';
import { ScheduleTrigger } from './ScheduleTrigger/ScheduleTrigger.node';
import { WorkflowTrigger } from './WorkflowTrigger/WorkflowTrigger.node';
import { Start } from './Start/Start.node';
import { Filter } from './Filter/Filter.node';
import { DateTime } from './DateTime/DateTime.node';
import { SplitOut } from './SplitOut/SplitOut.node';
import { RemoveDuplicates } from './RemoveDuplicates/RemoveDuplicates.node';
import { Wait } from './Wait/Wait.node';
import { Switch } from './Switch/Switch.node';

// Exportar todos os nodes
export const nodeTypes = {
  httpRequest: HttpRequest,
  webhook: Webhook,
  set: Set,
  if: If,
  manualTrigger: ManualTrigger,
  scheduleTrigger: ScheduleTrigger,
  workflowTrigger: WorkflowTrigger,
  start: Start,
  filter: Filter,
  dateTime: DateTime,
  splitOut: SplitOut,
  removeDuplicates: RemoveDuplicates,
  wait: Wait,
  switch: Switch,
};

// Exportar todas as credenciais
export const credentialTypes = {
  // Credenciais removidas - Slack removido
};

// Lista de todos os nodes disponíveis
export const availableNodes = [
  {
    type: 'webhook',
    displayName: 'Webhook',
    description: 'Starts the workflow when a webhook is called',
    group: 'trigger',
    icon: 'webhook',
  },
  {
    type: 'manualTrigger',
    displayName: 'Manual Trigger',
    description: 'Runs the workflow when manually executed',
    group: 'trigger',
    icon: 'play',
  },
  {
    type: 'scheduleTrigger',
    displayName: 'Schedule Trigger',
    description: 'Runs the workflow on a schedule',
    group: 'trigger',
    icon: 'clock',
  },
  {
    type: 'workflowTrigger',
    displayName: 'Workflow Trigger',
    description: 'Runs when executed by another workflow',
    group: 'trigger',
    icon: 'workflow',
  },
  {
    type: 'start',
    displayName: 'Start',
    description: 'Starts the workflow execution',
    group: 'trigger',
    icon: 'play',
  },
  {
    type: 'httpRequest',
    displayName: 'HTTP Request',
    description: 'Makes an HTTP request and returns the response data',
    group: 'input',
    icon: 'http',
  },
  {
    type: 'set',
    displayName: 'Set',
    description: 'Sets values on items and optionally remove other values',
    group: 'transform',
    icon: 'set',
  },
  {
    type: 'filter',
    displayName: 'Filter',
    description: 'Filter items based on conditions',
    group: 'transform',
    icon: 'filter',
  },
  {
    type: 'dateTime',
    displayName: 'Date & Time',
    description: 'Work with date and time values',
    group: 'transform',
    icon: 'calendar',
  },
  {
    type: 'splitOut',
    displayName: 'Split Out',
    description: 'Split arrays into individual items',
    group: 'transform',
    icon: 'expand',
  },
  {
    type: 'removeDuplicates',
    displayName: 'Remove Duplicates',
    description: 'Remove duplicate items based on specified fields',
    group: 'transform',
    icon: 'copy',
  },
  {
    type: 'if',
    displayName: 'IF',
    description: 'Routes data to different branches based on conditions',
    group: 'logic',
    icon: 'if',
  },
  {
    type: 'switch',
    displayName: 'Switch',
    description: 'Route data to different outputs based on conditions',
    group: 'logic',
    icon: 'branch',
  },
  {
    type: 'wait',
    displayName: 'Wait',
    description: 'Pause workflow execution for a specified amount of time',
    group: 'logic',
    icon: 'clock',
  },
];

// Função para obter um node por tipo
export function getNodeType(type: string) {
  return nodeTypes[type as keyof typeof nodeTypes];
}

// Função para obter uma credencial por tipo
export function getCredentialType(type: string) {
  return credentialTypes[type as keyof typeof credentialTypes];
}

// Função para obter todos os nodes de um grupo específico
export function getNodesByGroup(group: string) {
  return availableNodes.filter(node => node.group === group);
}

// Grupos de nodes disponíveis
export const nodeGroups = [
  {
    name: 'trigger',
    displayName: 'Triggers',
    description: 'Nodes that start workflows',
  },
  {
    name: 'input',
    displayName: 'Input/Output',
    description: 'Nodes for data input and output',
  },
  {
    name: 'communication',
    displayName: 'Communication',
    description: 'Nodes for messaging and communication',
  },
  {
    name: 'transform',
    displayName: 'Transform',
    description: 'Nodes for data transformation',
  },
  {
    name: 'logic',
    displayName: 'Logic',
    description: 'Nodes for conditional logic and flow control',
  },
]; 