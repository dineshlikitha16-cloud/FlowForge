import { memo, useCallback } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import type { WorkflowEdge as EdgeType } from '../../types/workflow';
import { getEdgePath, getEdgeMidpoint } from '../../utils/helpers';
import { X } from 'lucide-react';
import './WorkflowEdge.css';

/* ===================================================
   Props
   =================================================== */
interface WorkflowEdgeProps {
  edge: EdgeType;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
}

/* ===================================================
   WorkflowEdge Component — SVG bezier with delete
   =================================================== */
const WorkflowEdge = memo<WorkflowEdgeProps>(({ edge, sourcePos, targetPos }) => {
  const deleteEdge = useWorkflowStore((s) => s.deleteEdge);

  const path = getEdgePath(sourcePos, targetPos);
  const midpoint = getEdgeMidpoint(sourcePos, targetPos);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteEdge(edge.id);
    },
    [edge.id, deleteEdge]
  );

  return (
    <g className="workflow-edge-group">
      {/* Invisible wider path for easier hover target */}
      <path
        className="workflow-edge-hitarea"
        d={path}
        fill="none"
        strokeWidth={14}
        stroke="transparent"
      />
      {/* Visible edge */}
      <path
        className="workflow-edge-path"
        d={path}
        fill="none"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      {/* Delete button on hover */}
      <foreignObject
        className="workflow-edge-delete-wrapper"
        x={midpoint.x - 12}
        y={midpoint.y - 12}
        width={24}
        height={24}
      >
        <button
          className="workflow-edge-delete-btn"
          onClick={handleDelete}
          title="Delete connection"
        >
          <X size={12} />
        </button>
      </foreignObject>
    </g>
  );
});

WorkflowEdge.displayName = 'WorkflowEdge';
export default WorkflowEdge;
