import { describe, expect, it } from 'vitest';
import type { WorkflowNode, WorkflowEdge } from '../types/workflow';
import { validateWorkflow } from './validateWorkflow';

const makeNode = (
  id: string,
  type: WorkflowNode['type'],
  label = id,
  config: WorkflowNode['config'] = {}
): WorkflowNode => ({
  id,
  type,
  label,
  position: { x: 0, y: 0 },
  config,
});

describe('validateWorkflow', () => {
  it('returns error when no trigger node exists', () => {
    const nodes: WorkflowNode[] = [makeNode('n1', 'action', 'HTTP Request')];
    const edges: WorkflowEdge[] = [];

    const errors = validateWorkflow(nodes, edges);
    expect(errors.some((e) => e.type === 'error' && /trigger/i.test(e.message))).toBe(true);
  });

  it('returns error when graph has a cycle', () => {
    const nodes: WorkflowNode[] = [
      makeNode('t1', 'trigger', 'Webhook Trigger', { url: 'https://example.com' }),
      makeNode('a1', 'action', 'HTTP Request', { method: 'GET', url: 'https://api.example.com' }),
    ];

    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 't1' },
    ];

    const errors = validateWorkflow(nodes, edges);
    expect(errors.some((e) => e.type === 'error' && /cycle/i.test(e.message))).toBe(true);
  });

  it('returns required-field validation errors for missing config', () => {
    const nodes: WorkflowNode[] = [
      makeNode('t1', 'trigger', 'Webhook', {}),
    ];

    const errors = validateWorkflow(nodes, []);
    expect(errors.some((e) => e.type === 'error' && /missing required field/i.test(e.message))).toBe(true);
  });

  it('validates a 75-node acyclic workflow without blocking errors', () => {
    const nodes: WorkflowNode[] = [
      makeNode('trigger-0', 'trigger', 'Webhook Trigger', { url: 'https://example.com/hook' }),
    ];
    const edges: WorkflowEdge[] = [];

    for (let i = 1; i < 74; i += 1) {
      nodes.push(
        makeNode(
          `action-${i}`,
          'action',
          'HTTP Request',
          { method: 'GET', url: `https://api.example.com/${i}` }
        )
      );
      edges.push({
        id: `e-${i}`,
        source: i === 1 ? 'trigger-0' : `action-${i - 1}`,
        target: `action-${i}`,
      });
    }

    nodes.push(makeNode('output-74', 'output', 'Email', { to: 'team@example.com' }));
    edges.push({ id: 'e-74', source: 'action-73', target: 'output-74' });

    const errors = validateWorkflow(nodes, edges);
    expect(errors.filter((e) => e.type === 'error')).toHaveLength(0);
  });
});
