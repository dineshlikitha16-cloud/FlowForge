import { memo } from 'react';
import { getEdgePath } from '../../utils/helpers';
import './ConnectionLine.css';

interface ConnectionLineProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

/**
 * Temporary bezier line drawn while the user drags from an output port
 * to an input port. Disappears when the mouse is released.
 */
const ConnectionLine = memo<ConnectionLineProps>(
  ({ sourceX, sourceY, targetX, targetY }) => {
    const path = getEdgePath(
      { x: sourceX, y: sourceY },
      { x: targetX, y: targetY }
    );

    return (
      <g className="connection-line-group">
        <path
          className="connection-line-path"
          d={path}
          fill="none"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        {/* Source circle */}
        <circle cx={sourceX} cy={sourceY} r={4} className="connection-line-dot" />
        {/* Target circle */}
        <circle cx={targetX} cy={targetY} r={4} className="connection-line-dot-target" />
      </g>
    );
  }
);

ConnectionLine.displayName = 'ConnectionLine';
export default ConnectionLine;
