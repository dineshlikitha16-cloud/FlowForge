import type { WorkflowNode, WorkflowEdge } from '../types/workflow';

/* ===================================================
   Auto-Layout Engine
   Lays out nodes in a left-to-right layered graph.
   Uses topological layers + vertical centering.
   =================================================== */

const LAYER_GAP_X = 260; // horizontal gap between layers
const NODE_GAP_Y = 100;  // vertical gap between nodes in same layer
const NODE_HEIGHT = 56;
const START_X = 80;
const START_Y = 80;

/**
 * Build adjacency list from edges
 */
function buildAdjacency(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { adj: Map<string, string[]>; inDeg: Map<string, number> } {
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  });

  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
  });

  return { adj, inDeg };
}

/**
 * Assign nodes to layers using longest-path method
 * (modified topological sort for better visual hierarchy)
 */
function assignLayers(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Map<string, number> {
  const { adj, inDeg } = buildAdjacency(nodes, edges);
  const layers = new Map<string, number>();

  // BFS from roots (in-degree 0) to assign layers
  const queue: string[] = [];
  inDeg.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id);
      layers.set(id, 0);
    }
  });

  // If no roots (cycle or disconnected), start from first node
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    layers.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current) || 0;
    const neighbors = adj.get(current) || [];

    for (const neighbor of neighbors) {
      const existingLayer = layers.get(neighbor);
      const newLayer = currentLayer + 1;

      // Always use the longest path (deepest layer)
      if (existingLayer === undefined || newLayer > existingLayer) {
        layers.set(neighbor, newLayer);
      }

      // Track in-degree reduction for BFS
      const deg = (inDeg.get(neighbor) || 1) - 1;
      inDeg.set(neighbor, deg);
      if (deg <= 0) {
        queue.push(neighbor);
      }
    }
  }

  // Handle any nodes not reached (disconnected components)
  nodes.forEach((n) => {
    if (!layers.has(n.id)) {
      // Place disconnected nodes to the right
      const maxLayer = Math.max(0, ...Array.from(layers.values()));
      layers.set(n.id, maxLayer + 1);
    }
  });

  return layers;
}

/**
 * Run auto-layout and return new positions for all nodes.
 * Does not modify the store — caller applies positions.
 */
export function autoLayoutNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (nodes.length === 0) return positions;

  // 1. Assign layers
  const layers = assignLayers(nodes, edges);

  // 2. Group nodes by layer
  const layerGroups = new Map<number, WorkflowNode[]>();
  nodes.forEach((node) => {
    const layer = layers.get(node.id) || 0;
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(node);
  });

  // 3. Sort layers and calculate positions
  const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  // Find the tallest layer for centering
  let maxLayerHeight = 0;
  sortedLayers.forEach((layerIdx) => {
    const group = layerGroups.get(layerIdx)!;
    const height = group.length * (NODE_HEIGHT + NODE_GAP_Y) - NODE_GAP_Y;
    maxLayerHeight = Math.max(maxLayerHeight, height);
  });

  sortedLayers.forEach((layerIdx, colIdx) => {
    const group = layerGroups.get(layerIdx)!;

    // Sort nodes in layer by type priority: trigger > condition > action > output
    const typePriority: Record<string, number> = {
      trigger: 0,
      condition: 1,
      action: 2,
      output: 3,
    };
    group.sort(
      (a, b) => (typePriority[a.type] || 99) - (typePriority[b.type] || 99)
    );

    const layerHeight = group.length * (NODE_HEIGHT + NODE_GAP_Y) - NODE_GAP_Y;
    const startY = START_Y + (maxLayerHeight - layerHeight) / 2;

    group.forEach((node, rowIdx) => {
      positions.set(node.id, {
        x: START_X + colIdx * LAYER_GAP_X,
        y: startY + rowIdx * (NODE_HEIGHT + NODE_GAP_Y),
      });
    });
  });

  return positions;
}
