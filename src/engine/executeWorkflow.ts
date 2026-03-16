import type {
  WorkflowNode,
  WorkflowEdge,
  ExecutionLog,
  NodeExecutionStatus,
} from '../types/workflow';
import { validateWorkflow } from './validateWorkflow';
import { topologicalSort } from './graph';

/* ===================================================
   Execution Engine
   Performs a simulated topological-order walk through
   the workflow graph, calling back into the store on
   every step so the UI can visualise progress.
   =================================================== */

/* ─── Callbacks that the caller passes in ────── */
export interface ExecutionCallbacks {
  onStart: () => void;
  onNodeStart: (nodeId: string) => void;
  onNodeComplete: (log: ExecutionLog) => void;
  onComplete: () => void;
  onFail: (message: string) => void;
}

/* ─── Abort handle ──────────────────────────── */
export interface ExecutionHandle {
  abort: () => void;
}

/* ───────────────────────────────────────────────
   Simulate a single node execution (async delay)
   ─────────────────────────────────────────────── */
const simulateNode = (node: WorkflowNode): Promise<{
  status: NodeExecutionStatus;
  message: string;
}> =>
  new Promise((resolve) => {
    // Simulate processing time: 600–1400 ms
    const delay = 600 + Math.random() * 800;

    setTimeout(() => {
      // Condition nodes: random true/false to simulate branching
      if (node.type === 'condition') {
        const passed = Math.random() > 0.3;
        resolve({
          status: 'success',
          message: passed
            ? `Condition "${node.label}" evaluated → true`
            : `Condition "${node.label}" evaluated → false (branch skipped)`,
        });
        return;
      }

      // 10 % random failure for non-trigger nodes to make it interesting
      if (node.type !== 'trigger' && Math.random() < 0.1) {
        resolve({
          status: 'failure',
          message: `"${node.label}" failed — simulated error`,
        });
        return;
      }

      // Normal success
      const messages: Record<string, string> = {
        trigger: `Trigger "${node.label}" fired successfully`,
        action: `Action "${node.label}" completed`,
        output: `Output "${node.label}" emitted result`,
      };

      resolve({
        status: 'success',
        message: messages[node.type] || `"${node.label}" executed`,
      });
    }, delay);
  });

/* ===================================================
   Main execute function
   =================================================== */
export const executeWorkflow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  callbacks: ExecutionCallbacks
): ExecutionHandle => {
  let aborted = false;

  const run = async () => {
    /* ─── Pre-flight validation ──────────── */
    const errors = validateWorkflow(nodes, edges);
    const blocking = errors.filter((e) => e.type === 'error');
    if (blocking.length > 0) {
      callbacks.onFail(
        `Validation failed with ${blocking.length} error(s). Fix them before running.`
      );
      return;
    }

    /* ─── Sort nodes ─────────────────────── */
    const sorted = topologicalSort(nodes, edges);
    callbacks.onStart();

    /* ─── Walk each node ─────────────────── */
    for (const node of sorted) {
      if (aborted) {
        callbacks.onFail('Execution aborted by user.');
        return;
      }

      callbacks.onNodeStart(node.id);

      const result = await simulateNode(node);

      const log: ExecutionLog = {
        nodeId: node.id,
        nodeLabel: node.label,
        status: result.status,
        message: result.message,
        timestamp: new Date().toISOString(),
      };

      callbacks.onNodeComplete(log);

      // Stop on failure
      if (result.status === 'failure') {
        callbacks.onFail(result.message);
        return;
      }
    }

    if (!aborted) {
      callbacks.onComplete();
    }
  };

  run();

  return {
    abort: () => {
      aborted = true;
    },
  };
};
