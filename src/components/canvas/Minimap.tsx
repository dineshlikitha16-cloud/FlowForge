import { useCallback, useMemo, useRef, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { CATEGORY_COLORS } from '../../data/nodeTemplates';
import './Minimap.css';

/* ===================================================
   Minimap — shows a small bird's-eye view of the
   workflow graph in the corner of the canvas.
   =================================================== */

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const NODE_DOT_SIZE = 8;
const PADDING = 12;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  offset: { x: number; y: number };
  onNavigate: (worldX: number, worldY: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const Minimap = ({
  canvasWidth,
  canvasHeight,
  zoom,
  offset,
  onNavigate,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: MinimapProps) => {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const dragRef = useRef<{ worldDx: number; worldDy: number } | null>(null);

  /* ─── Calculate bounds and scale ──────────── */
  const { scaledNodes, scaledEdges, viewportRect, minimapBounds, viewportCenterWorld } = useMemo(() => {
    if (nodes.length === 0) {
      return {
        scaledNodes: [],
        scaledEdges: [],
        viewportRect: null,
        minimapBounds: null,
        viewportCenterWorld: null,
      };
    }

    const safeZoom = zoom || 1;
    const viewportMinX = -offset.x / safeZoom;
    const viewportMinY = -offset.y / safeZoom;
    const viewportMaxX = viewportMinX + canvasWidth / safeZoom;
    const viewportMaxY = viewportMinY + canvasHeight / safeZoom;

    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + NODE_HEIGHT);
    });

    // Include visible viewport in bounds so the viewport indicator stays on the minimap.
    minX = Math.min(minX, viewportMinX);
    minY = Math.min(minY, viewportMinY);
    maxX = Math.max(maxX, viewportMaxX);
    maxY = Math.max(maxY, viewportMaxY);

    const graphW = maxX - minX || 1;
    const graphH = maxY - minY || 1;
    const inner = { w: MINIMAP_WIDTH - PADDING * 2, h: MINIMAP_HEIGHT - PADDING * 2 };
    const scale = Math.min(inner.w / graphW, inner.h / graphH);

    const offsetX = (inner.w - graphW * scale) / 2 + PADDING;
    const offsetY = (inner.h - graphH * scale) / 2 + PADDING;

    const nodeMap = new Map<string, { x: number; y: number }>();

    const sNodes = nodes.map((n) => {
      const x = (n.position.x - minX) * scale + offsetX;
      const y = (n.position.y - minY) * scale + offsetY;
      nodeMap.set(n.id, { x: x + NODE_DOT_SIZE / 2, y: y + NODE_DOT_SIZE / 2 });
      return {
        id: n.id,
        x,
        y,
        color: CATEGORY_COLORS[n.type] || 'var(--accent)',
        selected: n.id === selectedNodeId,
      };
    });

    const sEdges = edges
      .map((e) => {
        const from = nodeMap.get(e.source);
        const to = nodeMap.get(e.target);
        if (!from || !to) return null;
        return { id: e.id, x1: from.x, y1: from.y, x2: to.x, y2: to.y };
      })
      .filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];

    const viewport = {
      x: (viewportMinX - minX) * scale + offsetX,
      y: (viewportMinY - minY) * scale + offsetY,
      w: (canvasWidth / safeZoom) * scale,
      h: (canvasHeight / safeZoom) * scale,
    };

    const viewportCenter = {
      x: viewportMinX + canvasWidth / (safeZoom * 2),
      y: viewportMinY + canvasHeight / (safeZoom * 2),
    };

    return {
      scaledNodes: sNodes,
      scaledEdges: sEdges,
      viewportRect: viewport,
      minimapBounds: { minX, minY, scale, offsetX, offsetY },
      viewportCenterWorld: viewportCenter,
    };
  }, [nodes, edges, selectedNodeId, zoom, offset.x, offset.y, canvasWidth, canvasHeight]);

  const localToWorld = useCallback(
    (localX: number, localY: number) => {
      if (!minimapBounds) return null;
      return {
        x: (localX - minimapBounds.offsetX) / minimapBounds.scale + minimapBounds.minX,
        y: (localY - minimapBounds.offsetY) / minimapBounds.scale + minimapBounds.minY,
      };
    },
    [minimapBounds]
  );

  const handleMinimapPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!minimapBounds) return;
      e.preventDefault();

      const svgRect = e.currentTarget.getBoundingClientRect();
      const pointerId = e.pointerId;
      e.currentTarget.setPointerCapture(pointerId);
      const startLocalX = e.clientX - svgRect.left;
      const startLocalY = e.clientY - svgRect.top;
      const startWorld = localToWorld(startLocalX, startLocalY);
      if (!startWorld) return;

      const clickedViewport =
        !!viewportRect &&
        startLocalX >= viewportRect.x &&
        startLocalX <= viewportRect.x + viewportRect.w &&
        startLocalY >= viewportRect.y &&
        startLocalY <= viewportRect.y + viewportRect.h;

      if (clickedViewport && viewportCenterWorld) {
        dragRef.current = {
          worldDx: startWorld.x - viewportCenterWorld.x,
          worldDy: startWorld.y - viewportCenterWorld.y,
        };
      } else {
        dragRef.current = { worldDx: 0, worldDy: 0 };
        onNavigate(startWorld.x, startWorld.y);
      }

      setIsDraggingViewport(true);

      const handleMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const localX = ev.clientX - svgRect.left;
        const localY = ev.clientY - svgRect.top;
        const world = localToWorld(localX, localY);
        if (!world || !dragRef.current) return;

        onNavigate(
          world.x - dragRef.current.worldDx,
          world.y - dragRef.current.worldDy
        );
      };

      const handleUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        setIsDraggingViewport(false);
        dragRef.current = null;
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [minimapBounds, localToWorld, viewportRect, viewportCenterWorld, onNavigate]
  );

  const handleMinimapKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!viewportCenterWorld) return;

      const safeZoom = zoom || 1;
      const stepX = Math.max((canvasWidth / safeZoom) * 0.15, 24);
      const stepY = Math.max((canvasHeight / safeZoom) * 0.15, 24);

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -stepX;
      if (e.key === 'ArrowRight') dx = stepX;
      if (e.key === 'ArrowUp') dy = -stepY;
      if (e.key === 'ArrowDown') dy = stepY;

      if (dx === 0 && dy === 0) return;

      e.preventDefault();
      onNavigate(viewportCenterWorld.x + dx, viewportCenterWorld.y + dy);
    },
    [viewportCenterWorld, zoom, canvasWidth, canvasHeight, onNavigate]
  );

  const handleControlPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const handleControlClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    e.stopPropagation();
    action();
  };

  if (nodes.length === 0) return null;

  return (
    <div
      className={`minimap ${isDraggingViewport ? 'minimap-dragging' : ''}`}
      tabIndex={0}
      role="group"
      aria-label="Workflow minimap. Use arrow keys to pan the viewport."
      onKeyDown={handleMinimapKeyDown}
    >
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onPointerDown={handleMinimapPointerDown}
      >
        {/* Edges */}
        {scaledEdges.map((e) => (
          <line
            key={e.id}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            className="minimap-edge"
          />
        ))}

        {/* Nodes */}
        {scaledNodes.map((n) => (
          <rect
            key={n.id}
            x={n.x}
            y={n.y}
            width={NODE_DOT_SIZE}
            height={NODE_DOT_SIZE}
            rx={2}
            fill={n.color}
            className={n.selected ? 'minimap-node-selected' : ''}
            opacity={n.selected ? 1 : 0.75}
          />
        ))}

        {/* Current viewport */}
        {viewportRect && (
          <rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.w}
            height={viewportRect.h}
            className="minimap-viewport"
          />
        )}
      </svg>

      <div className="minimap-controls" aria-label="Minimap zoom controls">
        <button
          type="button"
          className="minimap-control-btn"
          title="Zoom out"
          aria-label="Zoom out"
          onPointerDown={handleControlPointerDown}
          onClick={(e) => handleControlClick(e, onZoomOut)}
        >
          -
        </button>
        <button
          type="button"
          className="minimap-control-btn minimap-control-readout"
          title="Reset zoom"
          aria-label="Reset zoom"
          onPointerDown={handleControlPointerDown}
          onClick={(e) => handleControlClick(e, onZoomReset)}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="minimap-control-btn"
          title="Zoom in"
          aria-label="Zoom in"
          onPointerDown={handleControlPointerDown}
          onClick={(e) => handleControlClick(e, onZoomIn)}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Minimap;
