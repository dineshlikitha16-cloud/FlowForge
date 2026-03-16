import { useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useHistoryStore } from '../store/historyStore';
import { saveWorkflowToStorage } from '../utils/workflowIO';
import { generateId } from '../utils/helpers';

/* ===================================================
   Keyboard Shortcuts Hook
   Mount once in App — handles global key combos.
   =================================================== */

export const useKeyboardShortcuts = (onCommandPalette?: () => void) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();
      const store = useWorkflowStore.getState();
      const history = useHistoryStore.getState();

      /* ─── Ctrl+Z — Undo ──────────────────── */
      if (ctrl && !shift && key === 'z') {
        e.preventDefault();
        const snapshot = history.undo({
          nodes: store.nodes,
          edges: store.edges,
          workflowName: store.workflowName,
        });
        if (snapshot) {
          store.resetWorkflow();
          useWorkflowStore.setState({
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            workflowName: snapshot.workflowName,
          });
        }
        return;
      }

      /* ─── Ctrl+Shift+Z / Ctrl+Y — Redo ──── */
      if ((ctrl && shift && key === 'z') || (ctrl && key === 'y')) {
        e.preventDefault();
        const snapshot = history.redo({
          nodes: store.nodes,
          edges: store.edges,
          workflowName: store.workflowName,
        });
        if (snapshot) {
          store.resetWorkflow();
          useWorkflowStore.setState({
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            workflowName: snapshot.workflowName,
          });
        }
        return;
      }

      /* ─── Ctrl+K — Command Palette ────────── */
      if (ctrl && key === 'k') {
        e.preventDefault();
        onCommandPalette?.();
        return;
      }

      /* ─── Ctrl+S — Save ──────────────────── */
      if (ctrl && key === 's') {
        e.preventDefault();
        saveWorkflowToStorage(store.workflowName, store.nodes, store.edges);
        // Dispatch a custom event so the toast system can pick it up
        window.dispatchEvent(new CustomEvent('flowforge:toast', {
          detail: { message: 'Workflow saved!', type: 'success' },
        }));
        return;
      }

      /* ─── Delete / Backspace — Delete selected node ── */
      if ((key === 'delete' || key === 'backspace') && store.selectedNodeId) {
        // Don't intercept if user is typing in an input/textarea
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        e.preventDefault();
        // Push history before delete
        history.pushSnapshot({
          nodes: store.nodes,
          edges: store.edges,
          workflowName: store.workflowName,
        });
        store.deleteNode(store.selectedNodeId);
        return;
      }

      /* ─── Escape — Deselect ──────────────── */
      if (key === 'escape') {
        store.setSelectedNodeId(null);
        return;
      }

      /* ─── Ctrl+D — Duplicate selected node ─ */
      if (ctrl && key === 'd' && store.selectedNodeId) {
        e.preventDefault();
        const node = store.nodes.find((n) => n.id === store.selectedNodeId);
        if (!node) return;

        history.pushSnapshot({
          nodes: store.nodes,
          edges: store.edges,
          workflowName: store.workflowName,
        });

        const newNode = {
          ...node,
          id: generateId('node'),
          position: {
            x: node.position.x + 40,
            y: node.position.y + 40,
          },
          config: { ...node.config },
        };
        store.addNode(newNode);
        store.setSelectedNodeId(newNode.id);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
};
