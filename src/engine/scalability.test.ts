import { describe, expect, it } from 'vitest';
import type { WorkflowEdge, WorkflowNode } from '../types/workflow';
import { topologicalSort } from './graph';
import { validateWorkflow } from './validateWorkflow';

const makeNode = (id: string, type: WorkflowNode['type']): WorkflowNode => ({
  id,
  type,
  label: id,
  position: { x: 0, y: 0 },
  config: type === 'trigger' ? { event: 'manual' } : { name: id },
});

describe('workflow scalability baseline', () => {
  it('handles a 75-node workflow with acceptable processing time', () => {
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    nodes.push(makeNode('trigger-0', 'trigger'));
    for (let i = 1; i <= 50; i += 1) {
      nodes.push(makeNode(`action-${i}`, 'action'));
    }
    for (let i = 1; i <= 24; i += 1) {
      nodes.push(makeNode(`output-${i}`, 'output'));
    }

    for (let i = 0; i < 50; i += 1) {
      const source = i === 0 ? 'trigger-0' : `action-${i}`;
      const target = `action-${i + 1}`;
      edges.push({ id: `chain-${i}`, source, target });
    }

    for (let i = 1; i <= 24; i += 1) {
      const source = `action-${Math.max(1, i * 2)}`;
      edges.push({ id: `fanout-${i}`, source, target: `output-${i}` });
    }

    const start = performance.now();
    const sorted = topologicalSort(nodes, edges);
    const validation = validateWorkflow(nodes, edges);
    const durationMs = performance.now() - start;

    expect(sorted).toHaveLength(nodes.length);
    expect(validation.filter((v) => v.type === 'error')).toHaveLength(0);
    expect(durationMs).toBeLessThan(2000);
  });
});
