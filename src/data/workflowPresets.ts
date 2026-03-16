import type { WorkflowNode, WorkflowEdge } from '../types/workflow';

/* ===================================================
   Workflow Presets — pre-built example workflows
   =================================================== */

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  category: 'starter' | 'integration' | 'automation';
  icon: string;              // lucide icon name
  nodeCount: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/* ===================================================
   1. API Data Pipeline
   =================================================== */
const apiPipeline: WorkflowPreset = {
  id: 'preset_api_pipeline',
  name: 'API Data Pipeline',
  description: 'Fetch data from an API, transform it, and log the results',
  category: 'integration',
  icon: 'Globe',
  nodeCount: 4,
  nodes: [
    {
      id: 'p1_n1',
      type: 'trigger',
      label: 'Webhook',
      description: 'Trigger workflow via webhook URL',
      position: { x: 80, y: 160 },
      config: { url: 'https://api.example.com/hook', method: 'POST' },
    },
    {
      id: 'p1_n2',
      type: 'action',
      label: 'HTTP Request',
      description: 'Make an HTTP request',
      position: { x: 340, y: 160 },
      config: { url: 'https://api.example.com/data', method: 'GET', headers: '{}', body: '' },
    },
    {
      id: 'p1_n3',
      type: 'action',
      label: 'Transform Data',
      description: 'Transform or map data fields',
      position: { x: 600, y: 160 },
      config: { expression: 'data.results.map(item => ({ id: item.id, name: item.name }))' },
    },
    {
      id: 'p1_n4',
      type: 'output',
      label: 'Log Output',
      description: 'Log data to console',
      position: { x: 860, y: 160 },
      config: { message: 'Pipeline complete — ${data.length} records processed' },
    },
  ],
  edges: [
    { id: 'p1_e1', source: 'p1_n1', target: 'p1_n2' },
    { id: 'p1_e2', source: 'p1_n2', target: 'p1_n3' },
    { id: 'p1_e3', source: 'p1_n3', target: 'p1_n4' },
  ],
};

/* ===================================================
   2. Email Notification Flow
   =================================================== */
const emailNotification: WorkflowPreset = {
  id: 'preset_email_notification',
  name: 'Email Notification Flow',
  description: 'Scheduled job that checks a condition and sends an email alert',
  category: 'automation',
  icon: 'Mail',
  nodeCount: 4,
  nodes: [
    {
      id: 'p2_n1',
      type: 'trigger',
      label: 'Schedule',
      description: 'Trigger on a time schedule',
      position: { x: 80, y: 160 },
      config: { cron: '0 9 * * 1-5', timezone: 'UTC' },
    },
    {
      id: 'p2_n2',
      type: 'action',
      label: 'HTTP Request',
      description: 'Make an HTTP request',
      position: { x: 340, y: 160 },
      config: { url: 'https://api.example.com/status', method: 'GET', headers: '{}', body: '' },
    },
    {
      id: 'p2_n3',
      type: 'condition',
      label: 'If/Else',
      description: 'Branch based on a condition',
      position: { x: 600, y: 160 },
      config: { condition: 'response.status === "critical"' },
    },
    {
      id: 'p2_n4',
      type: 'action',
      label: 'Send Email',
      description: 'Send an email notification',
      position: { x: 860, y: 100 },
      config: { to: 'team@example.com', subject: 'Alert: System Critical', body: 'The system reported a critical status. Please investigate.' },
    },
  ],
  edges: [
    { id: 'p2_e1', source: 'p2_n1', target: 'p2_n2' },
    { id: 'p2_e2', source: 'p2_n2', target: 'p2_n3' },
    { id: 'p2_e3', source: 'p2_n3', target: 'p2_n4' },
  ],
};

/* ===================================================
   3. Data Processing & Routing
   =================================================== */
const dataRouting: WorkflowPreset = {
  id: 'preset_data_routing',
  name: 'Data Processing & Routing',
  description: 'Manual trigger → transform → switch route → multiple outputs',
  category: 'starter',
  icon: 'GitBranch',
  nodeCount: 6,
  nodes: [
    {
      id: 'p3_n1',
      type: 'trigger',
      label: 'Manual Trigger',
      description: 'Manually start the workflow',
      position: { x: 80, y: 180 },
      config: {},
    },
    {
      id: 'p3_n2',
      type: 'action',
      label: 'Transform Data',
      description: 'Transform or map data fields',
      position: { x: 340, y: 180 },
      config: { expression: 'data.map(item => ({ ...item, processed: true }))' },
    },
    {
      id: 'p3_n3',
      type: 'condition',
      label: 'Switch',
      description: 'Route to multiple paths',
      position: { x: 600, y: 180 },
      config: { expression: 'item.category', cases: 'urgent, normal, low' },
    },
    {
      id: 'p3_n4',
      type: 'action',
      label: 'Send Email',
      description: 'Send an email notification',
      position: { x: 860, y: 60 },
      config: { to: 'urgent@example.com', subject: 'Urgent Item', body: 'Priority handling required.' },
    },
    {
      id: 'p3_n5',
      type: 'output',
      label: 'Log Output',
      description: 'Log data to console',
      position: { x: 860, y: 200 },
      config: { message: 'Normal item processed' },
    },
    {
      id: 'p3_n6',
      type: 'output',
      label: 'Set Variable',
      description: 'Set a workflow variable',
      position: { x: 860, y: 340 },
      config: { name: 'lowPriorityQueue', value: 'item.id' },
    },
  ],
  edges: [
    { id: 'p3_e1', source: 'p3_n1', target: 'p3_n2' },
    { id: 'p3_e2', source: 'p3_n2', target: 'p3_n3' },
    { id: 'p3_e3', source: 'p3_n3', target: 'p3_n4' },
    { id: 'p3_e4', source: 'p3_n3', target: 'p3_n5' },
    { id: 'p3_e5', source: 'p3_n3', target: 'p3_n6' },
  ],
};

/* ===================================================
   4. Webhook → Multi-Step Action Chain
   =================================================== */
const webhookChain: WorkflowPreset = {
  id: 'preset_webhook_chain',
  name: 'Webhook Action Chain',
  description: 'Webhook trigger with chained API calls and final logging',
  category: 'integration',
  icon: 'Zap',
  nodeCount: 5,
  nodes: [
    {
      id: 'p4_n1',
      type: 'trigger',
      label: 'Webhook',
      description: 'Trigger workflow via webhook URL',
      position: { x: 80, y: 160 },
      config: { url: 'https://hooks.example.com/ingest', method: 'POST' },
    },
    {
      id: 'p4_n2',
      type: 'action',
      label: 'HTTP Request',
      description: 'Make an HTTP request',
      position: { x: 340, y: 100 },
      config: { url: 'https://api.example.com/enrich', method: 'POST', headers: '{"Content-Type":"application/json"}', body: '${payload}' },
    },
    {
      id: 'p4_n3',
      type: 'action',
      label: 'Transform Data',
      description: 'Transform or map data fields',
      position: { x: 340, y: 260 },
      config: { expression: '({ ...data, timestamp: Date.now() })' },
    },
    {
      id: 'p4_n4',
      type: 'action',
      label: 'HTTP Request',
      description: 'Make an HTTP request',
      position: { x: 600, y: 160 },
      config: { url: 'https://api.example.com/store', method: 'PUT', headers: '{}', body: '${enriched}' },
    },
    {
      id: 'p4_n5',
      type: 'output',
      label: 'Log Output',
      description: 'Log data to console',
      position: { x: 860, y: 160 },
      config: { message: 'Webhook chain completed successfully' },
    },
  ],
  edges: [
    { id: 'p4_e1', source: 'p4_n1', target: 'p4_n2' },
    { id: 'p4_e2', source: 'p4_n1', target: 'p4_n3' },
    { id: 'p4_e3', source: 'p4_n2', target: 'p4_n4' },
    { id: 'p4_e4', source: 'p4_n3', target: 'p4_n4' },
    { id: 'p4_e5', source: 'p4_n4', target: 'p4_n5' },
  ],
};

/* ===================================================
   Export all presets
   =================================================== */
export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  apiPipeline,
  emailNotification,
  dataRouting,
  webhookChain,
];

export const PRESET_CATEGORY_LABELS: Record<string, string> = {
  starter: 'Starter',
  integration: 'Integration',
  automation: 'Automation',
};
