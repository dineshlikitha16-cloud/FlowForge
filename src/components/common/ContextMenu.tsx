import { useEffect, useRef, useState, useCallback } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useHistoryStore } from '../../store/historyStore';
import { generateId } from '../../utils/helpers';
import { Copy, Trash2, Clipboard, MousePointer } from 'lucide-react';
import './ContextMenu.css';

/* ===================================================
   Context Menu — canvas & node right-click menu
   =================================================== */

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuPos {
  x: number;
  y: number;
}

const ContextMenu = () => {
  const [pos, setPos] = useState<ContextMenuPos | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const addNode = useWorkflowStore((s) => s.addNode);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  /* ─── Open on contextmenu ────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Only open on canvas or node right-click
      const target = e.target as HTMLElement;
      const canvas = target.closest('.canvas');
      if (!canvas) return;

      e.preventDefault();

      const nodeEl = target.closest('.workflow-node');
      const nodeId = nodeEl?.getAttribute('data-node-id') || null;

      if (nodeId) {
        setSelectedNodeId(nodeId);
      }

      setTargetNodeId(nodeId);
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('contextmenu', handler);
    return () => window.removeEventListener('contextmenu', handler);
  }, [setSelectedNodeId]);

  /* ─── Close on outside click / escape ─────── */
  useEffect(() => {
    if (!pos) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPos(null);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null);
    };

    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [pos]);

  /* ─── Actions ────────────────────────────── */
  const handleDuplicate = useCallback(() => {
    const nodeId = targetNodeId || selectedNodeId;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    pushSnapshot({ nodes, edges, workflowName });

    const newNode = {
      ...node,
      id: generateId('node'),
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      config: { ...node.config },
    };
    addNode(newNode);
    setSelectedNodeId(newNode.id);
    setPos(null);
  }, [targetNodeId, selectedNodeId, nodes, edges, workflowName, pushSnapshot, addNode, setSelectedNodeId]);

  const handleDelete = useCallback(() => {
    const nodeId = targetNodeId || selectedNodeId;
    if (!nodeId) return;

    pushSnapshot({ nodes, edges, workflowName });
    deleteNode(nodeId);
    setPos(null);
  }, [targetNodeId, selectedNodeId, nodes, edges, workflowName, pushSnapshot, deleteNode]);

  const handleDeselect = useCallback(() => {
    setSelectedNodeId(null);
    setPos(null);
  }, [setSelectedNodeId]);

  /* ─── Don't render if closed ─────────────── */
  if (!pos) return null;

  const nodeActive = !!(targetNodeId || selectedNodeId);

  const items: MenuItem[] = [
    {
      label: 'Duplicate',
      icon: <Copy size={14} />,
      shortcut: 'Ctrl+D',
      action: handleDuplicate,
      disabled: !nodeActive,
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      shortcut: 'Del',
      action: handleDelete,
      danger: true,
      disabled: !nodeActive,
    },
    {
      label: 'Deselect All',
      icon: <MousePointer size={14} />,
      shortcut: 'Esc',
      action: handleDeselect,
    },
    {
      label: 'Copy ID',
      icon: <Clipboard size={14} />,
      action: () => {
        const id = targetNodeId || selectedNodeId;
        if (id) navigator.clipboard.writeText(id);
        setPos(null);
      },
      disabled: !nodeActive,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          className={`context-menu-item ${item.danger ? 'context-menu-danger' : ''} ${item.disabled ? 'context-menu-disabled' : ''}`}
          onClick={item.disabled ? undefined : item.action}
          disabled={item.disabled}
        >
          <span className="context-menu-icon">{item.icon}</span>
          <span className="context-menu-label">{item.label}</span>
          {item.shortcut && (
            <span className="context-menu-shortcut">{item.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
