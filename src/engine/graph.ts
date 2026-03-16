import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

/* ===================================================
   Graph Utilities
   =================================================== */

export const topologicalSort = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] => {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map<string, WorkflowNode>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
    nodeMap.set(n.id, n);
  });

  edges.forEach((e) => {
    adjacency.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue: string[] = [];
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) queue.push(n.id);
  });

  // Triggers get execution priority when multiple nodes are available.
  queue.sort((a, b) => {
    const na = nodeMap.get(a);
    const nb = nodeMap.get(b);
    if (!na || !nb) return 0;
    if (na.type === 'trigger' && nb.type !== 'trigger') return -1;
    if (na.type !== 'trigger' && nb.type === 'trigger') return 1;
    return 0;
  });

  const sorted: WorkflowNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) break;

    const node = nodeMap.get(id);
    if (!node) continue;
    sorted.push(node);

    for (const neighbor of adjacency.get(id) || []) {
      const deg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  return sorted;
};
