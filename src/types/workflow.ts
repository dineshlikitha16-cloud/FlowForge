/* ===================================================
   Node category type
   =================================================== */
export type NodeCategory = 'trigger' | 'action' | 'condition' | 'output';

/* ===================================================
   Node configuration — dynamic key-value pairs
   =================================================== */
export interface NodeConfig {
  [key: string]: string | number | boolean;
}

/* ===================================================
   Workflow Node
   =================================================== */
export interface WorkflowNode {
  id: string;
  type: NodeCategory;
  label: string;
  position: { x: number; y: number };
  config: NodeConfig;
  description?: string;
}

/* ===================================================
   Workflow Edge (connection between two nodes)
   =================================================== */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/* ===================================================
   Full Workflow object
   =================================================== */
export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

/* ===================================================
   Validation
   =================================================== */
export interface ValidationError {
  nodeId?: string;
  message: string;
  type: 'error' | 'warning';
}

/* ===================================================
   Execution
   =================================================== */
export type NodeExecutionStatus = 'pending' | 'running' | 'success' | 'failure';

export interface ExecutionLog {
  nodeId: string;
  nodeLabel: string;
  status: NodeExecutionStatus;
  message: string;
  timestamp: string;
}

export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed';
