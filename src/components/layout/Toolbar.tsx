import { useWorkflowStore } from '../../store/workflowStore';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid3X3,
  AlignHorizontalSpaceAround,
} from 'lucide-react';
import './Toolbar.css';

/* ===================================================
   Toolbar Props — receives zoom controls from Canvas
   =================================================== */
interface ToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
}

const Toolbar = ({ zoom, onZoomIn, onZoomOut, onZoomReset, onFitView, onAutoLayout }: ToolbarProps) => {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);

  return (
    <div className="toolbar">
      {/* ─── Zoom controls ───────────────── */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onZoomOut}
          title="Zoom Out"
          disabled={zoom <= 0.25}
        >
          <ZoomOut size={16} />
        </button>

        <button
          className="toolbar-zoom-label"
          onClick={onZoomReset}
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          className="toolbar-btn"
          onClick={onZoomIn}
          title="Zoom In"
          disabled={zoom >= 2}
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* ─── View controls ───────────────── */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onFitView}
          title="Fit to View"
          disabled={nodes.length === 0}
        >
          <Maximize2 size={15} />
        </button>
        <button
          className="toolbar-btn"
          onClick={onZoomReset}
          title="Reset View"
        >
          <RotateCcw size={15} />
        </button>
        <button
          className="toolbar-btn"
          onClick={onAutoLayout}
          title="Auto Layout (arrange nodes)"
          disabled={nodes.length === 0}
        >
          <AlignHorizontalSpaceAround size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* ─── Stats ───────────────────────── */}
      <div className="toolbar-group toolbar-stats">
        <div className="toolbar-stat" title="Nodes">
          <Grid3X3 size={13} />
          <span>{nodes.length}</span>
        </div>
        <div className="toolbar-stat" title="Connections">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
          <span>{edges.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
