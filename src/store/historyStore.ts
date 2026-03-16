import { create } from 'zustand';
import type { WorkflowNode, WorkflowEdge } from '../types/workflow';

/* ===================================================
   History Store — Undo / Redo for workflow state
   Stores snapshots of { nodes, edges } only.
   =================================================== */

interface HistorySnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  workflowName: string;
}

interface HistoryState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  maxHistory: number;

  /** Push the current state onto the undo stack (call BEFORE mutating). */
  pushSnapshot: (snapshot: HistorySnapshot) => void;

  /** Undo — returns the snapshot to restore, or null. */
  undo: (current: HistorySnapshot) => HistorySnapshot | null;

  /** Redo — returns the snapshot to restore, or null. */
  redo: (current: HistorySnapshot) => HistorySnapshot | null;

  /** Whether undo / redo are available */
  canUndo: () => boolean;
  canRedo: () => boolean;

  /** Clear all history */
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  pushSnapshot: (snapshot) =>
    set((s) => ({
      past: [...s.past.slice(-(s.maxHistory - 1)), snapshot],
      future: [], // new action invalidates the redo stack
    })),

  undo: (current) => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [current, ...s.future],
    }));
    return previous;
  },

  redo: (current) => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    set((s) => ({
      past: [...s.past, current],
      future: s.future.slice(1),
    }));
    return next;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clearHistory: () => set({ past: [], future: [] }),
}));
