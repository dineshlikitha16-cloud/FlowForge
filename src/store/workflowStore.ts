import { create } from 'zustand';
import type {
  WorkflowNode,
  WorkflowEdge,
  ValidationError,
  ExecutionLog,
  ExecutionStatus,
} from '../types/workflow';

/* ===================================================
   Workflow Store — central state for the workflow
   =================================================== */
interface WorkflowState {
  /* ─── Data ──────────────────────────────────── */
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  workflowName: string;

  /* ─── Selection ─────────────────────────────── */
  selectedNodeId: string | null;

  /* ─── Validation ────────────────────────────── */
  validationErrors: ValidationError[];

  /* ─── Execution ─────────────────────────────── */
  executionStatus: ExecutionStatus;
  executionLogs: ExecutionLog[];
  currentExecutingNodeId: string | null;

  /* ─── Actions — Metadata ────────────────────── */
  setWorkflowName: (name: string) => void;
  setSelectedNodeId: (id: string | null) => void;

  /* ─── Actions — Nodes ───────────────────────── */
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;

  /* ─── Actions — Edges ───────────────────────── */
  addEdge: (edge: WorkflowEdge) => void;
  deleteEdge: (id: string) => void;

  /* ─── Actions — Validation ──────────────────── */
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;

  /* ─── Actions — Execution ───────────────────── */
  setExecutionStatus: (status: ExecutionStatus) => void;
  setCurrentExecutingNodeId: (id: string | null) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  clearExecutionLogs: () => void;

  /* ─── Actions — Reset ──────────────────────── */
  resetWorkflow: () => void;
}

const initialState = {
  nodes: [] as WorkflowNode[],
  edges: [] as WorkflowEdge[],
  workflowName: 'Untitled Workflow',
  selectedNodeId: null as string | null,
  validationErrors: [] as ValidationError[],
  executionStatus: 'idle' as ExecutionStatus,
  executionLogs: [] as ExecutionLog[],
  currentExecutingNodeId: null as string | null,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  ...initialState,

  /* ─── Metadata ──────────────────────────────── */
  setWorkflowName: (name) => set({ workflowName: name }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  /* ─── Nodes ─────────────────────────────────── */
  addNode: (node) =>
    set((s) => ({ nodes: [...s.nodes, node] })),

  updateNode: (id, updates) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  updateNodePosition: (id, position) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    })),

  deleteNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),

  /* ─── Edges ─────────────────────────────────── */
  addEdge: (edge) =>
    set((s) => ({ edges: [...s.edges, edge] })),

  deleteEdge: (id) =>
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),

  /* ─── Validation ────────────────────────────── */
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  clearValidationErrors: () => set({ validationErrors: [] }),

  /* ─── Execution ─────────────────────────────── */
  setExecutionStatus: (status) => set({ executionStatus: status }),
  setCurrentExecutingNodeId: (id) => set({ currentExecutingNodeId: id }),
  addExecutionLog: (log) =>
    set((s) => ({ executionLogs: [...s.executionLogs, log] })),
  clearExecutionLogs: () =>
    set({ executionLogs: [], currentExecutingNodeId: null }),

  /* ─── Reset ─────────────────────────────────── */
  resetWorkflow: () => set({ ...initialState }),
}));
