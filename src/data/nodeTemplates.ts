import type { NodeCategory } from '../types/workflow';

/* ===================================================
   Config field definition for node configuration forms
   =================================================== */
export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue: string | number | boolean;
}

/* ===================================================
   Node template — blueprint for creating workflow nodes
   =================================================== */
export interface NodeTemplate {
  type: NodeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultConfig: Record<string, string | number | boolean>;
  configFields: ConfigField[];
}

/* ===================================================
   Node templates grouped by category
   =================================================== */
export const NODE_TEMPLATES: NodeTemplate[] = [
  /* ─── Triggers ────────────────────────────────── */
  {
    type: 'trigger',
    label: 'Webhook',
    description: 'Trigger workflow via webhook URL',
    icon: 'Zap',
    color: '#8b5cf6',
    defaultConfig: { url: '', method: 'GET' },
    configFields: [
      { key: 'url', label: 'Webhook URL', type: 'text', required: true, placeholder: 'https://...', defaultValue: '' },
      { key: 'method', label: 'HTTP Method', type: 'select', required: true, options: ['GET', 'POST', 'PUT'], defaultValue: 'GET' },
    ],
  },
  {
    type: 'trigger',
    label: 'Schedule',
    description: 'Trigger on a time schedule',
    icon: 'Clock',
    color: '#8b5cf6',
    defaultConfig: { cron: '0 * * * *', timezone: 'UTC' },
    configFields: [
      { key: 'cron', label: 'Cron Expression', type: 'text', required: true, placeholder: '0 * * * *', defaultValue: '0 * * * *' },
      { key: 'timezone', label: 'Timezone', type: 'text', required: false, placeholder: 'UTC', defaultValue: 'UTC' },
    ],
  },
  {
    type: 'trigger',
    label: 'Manual Trigger',
    description: 'Manually start the workflow',
    icon: 'MousePointer',
    color: '#8b5cf6',
    defaultConfig: {},
    configFields: [],
  },

  /* ─── Actions ─────────────────────────────────── */
  {
    type: 'action',
    label: 'HTTP Request',
    description: 'Make an HTTP request',
    icon: 'Globe',
    color: '#3b82f6',
    defaultConfig: { url: '', method: 'GET', headers: '{}', body: '' },
    configFields: [
      { key: 'url', label: 'Request URL', type: 'text', required: true, placeholder: 'https://api.example.com', defaultValue: '' },
      { key: 'method', label: 'Method', type: 'select', required: true, options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], defaultValue: 'GET' },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea', required: false, placeholder: '{"Content-Type": "application/json"}', defaultValue: '{}' },
      { key: 'body', label: 'Request Body', type: 'textarea', required: false, placeholder: '{}', defaultValue: '' },
    ],
  },
  {
    type: 'action',
    label: 'Send Email',
    description: 'Send an email notification',
    icon: 'Mail',
    color: '#3b82f6',
    defaultConfig: { to: '', subject: '', body: '' },
    configFields: [
      { key: 'to', label: 'Recipient', type: 'text', required: true, placeholder: 'user@example.com', defaultValue: '' },
      { key: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Email subject', defaultValue: '' },
      { key: 'body', label: 'Email Body', type: 'textarea', required: true, placeholder: 'Write your message...', defaultValue: '' },
    ],
  },
  {
    type: 'action',
    label: 'Transform Data',
    description: 'Transform or map data fields',
    icon: 'Shuffle',
    color: '#3b82f6',
    defaultConfig: { expression: '' },
    configFields: [
      { key: 'expression', label: 'Transform Expression', type: 'textarea', required: true, placeholder: 'data.map(item => ...)', defaultValue: '' },
    ],
  },

  /* ─── Conditions ──────────────────────────────── */
  {
    type: 'condition',
    label: 'If/Else',
    description: 'Branch based on a condition',
    icon: 'GitBranch',
    color: '#f59e0b',
    defaultConfig: { condition: '' },
    configFields: [
      { key: 'condition', label: 'Condition Expression', type: 'text', required: true, placeholder: 'value > 10', defaultValue: '' },
    ],
  },
  {
    type: 'condition',
    label: 'Switch',
    description: 'Route to multiple paths',
    icon: 'ArrowLeftRight',
    color: '#f59e0b',
    defaultConfig: { expression: '', cases: '' },
    configFields: [
      { key: 'expression', label: 'Switch Expression', type: 'text', required: true, placeholder: 'status', defaultValue: '' },
      { key: 'cases', label: 'Cases (comma-separated)', type: 'text', required: true, placeholder: 'active, inactive, pending', defaultValue: '' },
    ],
  },

  /* ─── Outputs ─────────────────────────────────── */
  {
    type: 'output',
    label: 'Log Output',
    description: 'Log data to console',
    icon: 'FileText',
    color: '#10b981',
    defaultConfig: { message: '' },
    configFields: [
      { key: 'message', label: 'Log Message', type: 'textarea', required: false, placeholder: 'Workflow completed', defaultValue: '' },
    ],
  },
  {
    type: 'output',
    label: 'Set Variable',
    description: 'Set a workflow variable',
    icon: 'Box',
    color: '#10b981',
    defaultConfig: { name: '', value: '' },
    configFields: [
      { key: 'name', label: 'Variable Name', type: 'text', required: true, placeholder: 'myVariable', defaultValue: '' },
      { key: 'value', label: 'Value', type: 'text', required: true, placeholder: 'Hello World', defaultValue: '' },
    ],
  },
];

/* ===================================================
   Category labels and colors
   =================================================== */
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: 'Triggers',
  action: 'Actions',
  condition: 'Conditions',
  output: 'Outputs',
};

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  trigger: '#8b5cf6',
  action: '#3b82f6',
  condition: '#f59e0b',
  output: '#10b981',
};
