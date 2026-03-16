import { memo, useRef, useCallback } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { CATEGORY_COLORS } from '../../data/nodeTemplates';
import type { WorkflowNode as WorkflowNodeType } from '../../types/workflow';
import {
  Zap,
  Clock,
  MousePointer,
  Globe,
  Mail,
  Shuffle,
  GitBranch,
  ArrowLeftRight,
  FileText,
  Box,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './WorkflowNode.css';

/* ─── Icon map ─────────────────────────────── */
const iconMap: Record<string, LucideIcon> = {
  Zap, Clock, MousePointer, Globe, Mail, Shuffle,
  GitBranch, ArrowLeftRight, FileText, Box,
};

/* ─── Template icon lookup ─────────────────── */
import { NODE_TEMPLATES } from '../../data/nodeTemplates';

const getIconForNode = (node: WorkflowNodeType) => {
  const tmpl = NODE_TEMPLATES.find(
    (t) => t.type === node.type && t.label === node.label
  );
  if (!tmpl) return null;
  return iconMap[tmpl.icon] || null;
};

/* ===================================================
   Props
   =================================================== */
interface WorkflowNodeProps {
  node: WorkflowNodeType;
  isSelected: boolean;
  executionStatus?: string | null;
  onStartConnect: (nodeId: string, portType: 'output', portEl: HTMLDivElement) => void;
  onEndConnect: (nodeId: string) => void;
  canvasOffset: { x: number; y: number };
  zoom: number;
}

/* ===================================================
   WorkflowNode Component
   =================================================== */
const WorkflowNode = memo(({
  node,
  isSelected,
  executionStatus,
  onStartConnect,
  onEndConnect,
  canvasOffset,
  zoom,
}: WorkflowNodeProps) => {
  const updateNodePosition = useWorkflowStore((s) => s.updateNodePosition);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);

  const color = CATEGORY_COLORS[node.type];
  const IconComponent = getIconForNode(node);

  /* ─── Node drag ─────────────────────────── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag from port
      if ((e.target as HTMLElement).closest('.node-port')) return;
      e.stopPropagation();

      setSelectedNodeId(node.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (ev.clientX - dragRef.current.startX) / zoom;
        const dy = (ev.clientY - dragRef.current.startY) / zoom;
        updateNodePosition(node.id, {
          x: dragRef.current.nodeX + dx,
          y: dragRef.current.nodeY + dy,
        });
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [node.id, node.position.x, node.position.y, zoom, setSelectedNodeId, updateNodePosition]
  );

  /* ─── Port handlers ─────────────────────── */
  const handleOutputMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      onStartConnect(node.id, 'output', e.currentTarget);
    },
    [node.id, onStartConnect]
  );

  const handleInputMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEndConnect(node.id);
    },
    [node.id, onEndConnect]
  );

  /* ─── Execution glow class ─────────────── */
  let execClass = '';
  if (executionStatus === 'running') execClass = 'node-executing';
  else if (executionStatus === 'success') execClass = 'node-success';
  else if (executionStatus === 'failure') execClass = 'node-failure';

  return (
    <div
      className={`workflow-node ${isSelected ? 'workflow-node-selected' : ''} ${execClass}`}
      style={{
        left: node.position.x + canvasOffset.x,
        top: node.position.y + canvasOffset.y,
        '--node-color': color,
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
      data-node-id={node.id}
    >
      {/* ─── Input port ──────────────────── */}
      {node.type !== 'trigger' && (
        <div
          className="node-port node-port-input"
          onMouseUp={handleInputMouseUp}
          title="Drop connection here"
        >
          <div className="node-port-dot" />
        </div>
      )}

      {/* ─── Node body ───────────────────── */}
      <div className="workflow-node-accent" style={{ background: color }} />
      <div className="workflow-node-body">
        <div className="workflow-node-icon" style={{ background: `${color}20`, color }}>
          {IconComponent && <IconComponent size={16} />}
        </div>
        <div className="workflow-node-info">
          <span className="workflow-node-type">{node.type}</span>
          <span className="workflow-node-label">{node.label}</span>
        </div>
      </div>

      {/* ─── Output port ─────────────────── */}
      <div
        className="node-port node-port-output"
        onMouseDown={handleOutputMouseDown}
        title="Drag to connect"
      >
        <div className="node-port-dot" />
      </div>
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
export default WorkflowNode;
