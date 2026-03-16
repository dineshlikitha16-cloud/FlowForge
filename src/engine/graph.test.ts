import { describe, expect, it } from 'vitest';
import type { WorkflowNode, WorkflowEdge } from '../types/workflow';
import { topologicalSort } from './graph';

const makeNode = (id: string, type: WorkflowNode['type']): WorkflowNode => ({
  id,
  type,
  label: id,
  position: { x: 0, y: 0 },
  config: {},
});

describe('topologicalSort', () => {
  it('orders nodes respecting dependencies', () => {
    const nodes: WorkflowNode[] = [
      makeNode('trigger-1', 'trigger'),
      makeNode('action-1', 'action'),
      makeNode('output-1', 'output'),
    ];

    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'trigger-1', target: 'action-1' },
      { id: 'e2', source: 'action-1', target: 'output-1' },
    ];

    const sorted = topologicalSort(nodes, edges).map((n) => n.id);
    expect(sorted).toEqual(['trigger-1', 'action-1', 'output-1']);
  });

  it('prioritizes trigger nodes among zero-indegree nodes', () => {
    const nodes: WorkflowNode[] = [
      makeNode('action-a', 'action'),
      makeNode('trigger-a', 'trigger'),
      makeNode('action-b', 'action'),
    ];

    const edges: WorkflowEdge[] = [{ id: 'e1', source: 'trigger-a', target: 'action-b' }];

    const sorted = topologicalSort(nodes, edges).map((n) => n.id);
    expect(sorted[0]).toBe('trigger-a');
    expect(sorted.indexOf('trigger-a')).toBeLessThan(sorted.indexOf('action-b'));
  });

  it('handles a 75-node workflow graph', () => {
    const nodes: WorkflowNode[] = [makeNode('trigger-0', 'trigger')];
    const edges: WorkflowEdge[] = [];

    for (let i = 1; i < 75; i += 1) {
      const type: WorkflowNode['type'] = i === 74 ? 'output' : 'action';
      nodes.push(makeNode(`node-${i}`, type));
      const source = i === 1 ? 'trigger-0' : `node-${i - 1}`;
      const target = `node-${i}`;
      edges.push({ id: `e-${i}`, source, target });
    }

    const sorted = topologicalSort(nodes, edges).map((n) => n.id);

    expect(sorted).toHaveLength(75);
    expect(sorted[0]).toBe('trigger-0');
    expect(sorted[74]).toBe('node-74');
  });
});
