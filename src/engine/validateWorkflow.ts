import type {
  WorkflowNode,
  WorkflowEdge,
  ValidationError,
} from '../types/workflow';
import { NODE_TEMPLATES } from '../data/nodeTemplates';

/* ===================================================
   Workflow Validation Engine
   Runs a series of checks against the workflow graph
   and returns a list of errors / warnings.
   =================================================== */

/**
 * Validate the entire workflow and return all errors/warnings.
 */
export const validateWorkflow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (nodes.length === 0) {
    errors.push({
      message: 'Workflow is empty — add at least one node.',
      type: 'error',
    });
    return errors;
  }

  errors.push(...checkTriggerPresence(nodes));
  errors.push(...checkOrphanNodes(nodes, edges));
  errors.push(...checkRequiredConfig(nodes));
  errors.push(...checkDuplicateEdges(edges));
  errors.push(...checkCycles(nodes, edges));
  errors.push(...checkDisconnectedGraph(nodes, edges));

  return errors;
};

/* ───────────────────────────────────────────────
   1. Must have at least one trigger
   ─────────────────────────────────────────────── */
const checkTriggerPresence = (nodes: WorkflowNode[]): ValidationError[] => {
  const triggers = nodes.filter((n) => n.type === 'trigger');
  if (triggers.length === 0) {
    return [
      {
        message: 'Workflow must have at least one Trigger node.',
        type: 'error',
      },
    ];
  }
  return [];
};

/* ───────────────────────────────────────────────
   2. Orphan nodes (no connections at all)
   ─────────────────────────────────────────────── */
const checkOrphanNodes = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationError[] => {
  if (nodes.length <= 1) return [];

  const connected = new Set<string>();
  edges.forEach((e) => {
    connected.add(e.source);
    connected.add(e.target);
  });

  return nodes
    .filter((n) => !connected.has(n.id))
    .map((n) => ({
      nodeId: n.id,
      message: `"${n.label}" is not connected to any other node.`,
      type: 'warning' as const,
    }));
};

/* ───────────────────────────────────────────────
   3. Required config fields missing
   ─────────────────────────────────────────────── */
const checkRequiredConfig = (nodes: WorkflowNode[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  nodes.forEach((node) => {
    const template = NODE_TEMPLATES.find(
      (t) => t.type === node.type && t.label === node.label
    );
    if (!template) return;

    template.configFields
      .filter((f) => f.required)
      .forEach((field) => {
        const value = node.config[field.key];
        if (value === undefined || value === '' || value === null) {
          errors.push({
            nodeId: node.id,
            message: `"${node.label}" is missing required field: ${field.label}.`,
            type: 'error',
          });
        }
      });
  });

  return errors;
};

/* ───────────────────────────────────────────────
   4. Duplicate edges
   ─────────────────────────────────────────────── */
const checkDuplicateEdges = (edges: WorkflowEdge[]): ValidationError[] => {
  const seen = new Set<string>();
  const duplicates: ValidationError[] = [];

  edges.forEach((e) => {
    const key = `${e.source}->${e.target}`;
    if (seen.has(key)) {
      duplicates.push({
        message: `Duplicate connection detected between two nodes.`,
        type: 'warning',
      });
    }
    seen.add(key);
  });

  return duplicates;
};

/* ───────────────────────────────────────────────
   5. Cycle detection via DFS
   ─────────────────────────────────────────────── */
const checkCycles = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationError[] => {
  const adjacency = new Map<string, string[]>();
  nodes.forEach((n) => adjacency.set(n.id, []));
  edges.forEach((e) => {
    adjacency.get(e.source)?.push(e.target);
  });

  const visited = new Set<string>();
  const stack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (hasCycle(neighbor)) return true;
    }

    stack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (hasCycle(node.id)) {
      return [
        {
          message: 'Workflow contains a cycle — remove circular connections.',
          type: 'error',
        },
      ];
    }
  }

  return [];
};

/* ───────────────────────────────────────────────
   6. Disconnected graph detection
   ─────────────────────────────────────────────── */
const checkDisconnectedGraph = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationError[] => {
  if (nodes.length <= 1) return [];

  // Build undirected adjacency
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((n) => adjacency.set(n.id, new Set()));
  edges.forEach((e) => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });

  // BFS from first node
  const visited = new Set<string>();
  const queue = [nodes[0].id];
  visited.add(nodes[0].id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  if (visited.size < nodes.length) {
    return [
      {
        message: `Workflow has ${nodes.length - visited.size} disconnected node(s) — all nodes should be reachable.`,
        type: 'warning',
      },
    ];
  }

  return [];
};
