import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useHistoryStore } from '../../store/historyStore';
import type { NodeTemplate } from '../../data/nodeTemplates';
import WorkflowNode from '../canvas/WorkflowNode';
import WorkflowEdge from '../canvas/WorkflowEdge';
import ConnectionLine from '../canvas/ConnectionLine';
import Minimap from '../canvas/Minimap';
import Toolbar from './Toolbar';
import { generateId, clamp } from '../../utils/helpers';
import { autoLayoutNodes } from '../../engine/autoLayout';
import { Workflow } from 'lucide-react';
import './Canvas.css';

/* ===================================================
   Constants
   =================================================== */
const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

/* ===================================================
   Connection state (what we track while wiring)
   =================================================== */
interface ConnectingState {
  sourceNodeId: string;
  sourceX: number;
  sourceY: number;
  mouseX: number;
  mouseY: number;
}

/* ===================================================
   Canvas Component
   =================================================== */
const Canvas = () => {
  /* ─── Store ─────────────────────────────── */
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const currentExecutingNodeId = useWorkflowStore((s) => s.currentExecutingNodeId);
  const executionLogs = useWorkflowStore((s) => s.executionLogs);
  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const updateNodePosition = useWorkflowStore((s) => s.updateNodePosition);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  /* ─── Pan & zoom state ──────────────────── */
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const panRef = useRef<{ startX: number; startY: number; offX: number; offY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  /* ─── Connection state ──────────────────── */
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);

  /* ─── Track canvas size for minimap viewport ─── */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const updateCanvasSize = () => {
      const rect = el.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /* ─── Execution status per node ─────────── */
  const nodeExecStatus = useMemo(() => {
    const map: Record<string, string> = {};
    executionLogs.forEach((log) => {
      map[log.nodeId] = log.status;
    });
    if (currentExecutingNodeId) {
      map[currentExecutingNodeId] = 'running';
    }
    return map;
  }, [executionLogs, currentExecutingNodeId]);

  /* ===================================================
     Helpers — port positions
     =================================================== */
  const getOutputPortPos = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      return {
        x: (node.position.x + NODE_WIDTH) * zoom + offset.x,
        y: (node.position.y + NODE_HEIGHT / 2) * zoom + offset.y,
      };
    },
    [nodes, zoom, offset]
  );

  const getInputPortPos = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      return {
        x: node.position.x * zoom + offset.x,
        y: (node.position.y + NODE_HEIGHT / 2) * zoom + offset.y,
      };
    },
    [nodes, zoom, offset]
  );

  /* ===================================================
     Drop from sidebar → create node
     =================================================== */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/flowforge-node');
      if (!data) return;

      const template: NodeTemplate = JSON.parse(data);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - offset.x) / zoom - NODE_WIDTH / 2;
      const y = (e.clientY - rect.top - offset.y) / zoom - NODE_HEIGHT / 2;

      addNode({
        id: generateId('node'),
        type: template.type,
        label: template.label,
        description: template.description,
        position: { x, y },
        config: { ...template.defaultConfig },
      });
    },
    [addNode, offset, zoom]
  );

  /* ===================================================
     Pan — drag canvas background
     =================================================== */
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on background click
      if ((e.target as HTMLElement).closest('.workflow-node')) return;
      if (connecting) return;

      setSelectedNodeId(null);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offX: offset.x,
        offY: offset.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!panRef.current) return;
        setOffset({
          x: panRef.current.offX + (ev.clientX - panRef.current.startX),
          y: panRef.current.offY + (ev.clientY - panRef.current.startY),
        });
      };

      const handleUp = () => {
        panRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [offset, connecting, setSelectedNodeId]
  );

  /* ===================================================
     Zoom — mouse wheel
     =================================================== */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      setZoom((z) => clamp(z + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
    },
    []
  );

  /* ===================================================
     Toolbar zoom callbacks
     =================================================== */
  const handleZoomIn = useCallback(
    () => setZoom((z) => clamp(z + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => clamp(z - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)),
    []
  );
  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);
  const handleFitView = useCallback(() => {
    if (nodes.length === 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + NODE_HEIGHT);
    });

    const padding = 80;
    const graphW = maxX - minX + padding * 2;
    const graphH = maxY - minY + padding * 2;

    const fitZoom = clamp(Math.min(rect.width / graphW, rect.height / graphH), MIN_ZOOM, MAX_ZOOM);
    setZoom(fitZoom);
    setOffset({
      x: (rect.width - (maxX + minX) * fitZoom) / 2,
      y: (rect.height - (maxY + minY) * fitZoom) / 2,
    });
  }, [nodes]);

  const handleMinimapNavigate = useCallback(
    (worldX: number, worldY: number) => {
      setOffset({
        x: canvasSize.width / 2 - worldX * zoom,
        y: canvasSize.height / 2 - worldY * zoom,
      });
    },
    [canvasSize.width, canvasSize.height, zoom]
  );

  /* ===================================================
     Auto-layout — rearrange nodes
     =================================================== */
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    pushSnapshot({ nodes, edges, workflowName });

    const positions = autoLayoutNodes(nodes, edges);
    positions.forEach((pos, nodeId) => {
      updateNodePosition(nodeId, pos);
    });
  }, [nodes, edges, workflowName, pushSnapshot, updateNodePosition]);

  /* ===================================================
     Connection wiring — start from output port
     =================================================== */
  const handleStartConnect = useCallback(
    (nodeId: string, _portType: 'output', portEl: HTMLDivElement) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const portRect = portEl.getBoundingClientRect();
      if (!rect) return;

      const sx = portRect.left + portRect.width / 2 - rect.left;
      const sy = portRect.top + portRect.height / 2 - rect.top;

      const state: ConnectingState = {
        sourceNodeId: nodeId,
        sourceX: sx,
        sourceY: sy,
        mouseX: sx,
        mouseY: sy,
      };
      setConnecting(state);

      const handleMove = (ev: MouseEvent) => {
        setConnecting((prev) =>
          prev
            ? {
                ...prev,
                mouseX: ev.clientX - rect.left,
                mouseY: ev.clientY - rect.top,
              }
            : null
        );
      };

      const handleUp = () => {
        setConnecting(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    []
  );

  /* ===================================================
     Connection wiring — finish on input port
     =================================================== */
  const handleEndConnect = useCallback(
    (targetNodeId: string) => {
      if (!connecting) return;
      const { sourceNodeId } = connecting;

      // Validation: no self-connect
      if (sourceNodeId === targetNodeId) return;

      // Validation: no duplicate edge
      const exists = edges.some(
        (e) => e.source === sourceNodeId && e.target === targetNodeId
      );
      if (exists) return;

      // Validation: no connecting to a trigger (triggers are entry-only)
      const targetNode = nodes.find((n) => n.id === targetNodeId);
      if (targetNode?.type === 'trigger') return;

      addEdge({
        id: generateId('edge'),
        source: sourceNodeId,
        target: targetNodeId,
      });

      setConnecting(null);
    },
    [connecting, edges, nodes, addEdge]
  );

  /* ===================================================
     Compute edge positions for SVG
     =================================================== */
  const edgePositions = useMemo(
    () =>
      edges.map((edge) => ({
        edge,
        sourcePos: getOutputPortPos(edge.source),
        targetPos: getInputPortPos(edge.target),
      })),
    [edges, getOutputPortPos, getInputPortPos]
  );

  /* ===================================================
     Render
     =================================================== */
  return (
    <div
      ref={canvasRef}
      className="canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
    >
      {/* ─── Grid background ───────────────── */}
      <div
        className="canvas-grid"
        style={{
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        }}
      />

      {/* ─── Toolbar ──────────────────────── */}
      <Toolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onFitView={handleFitView}
        onAutoLayout={handleAutoLayout}
      />

      {/* ─── Minimap ──────────────────────── */}
      <Minimap
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
        zoom={zoom}
        offset={offset}
        onNavigate={handleMinimapNavigate}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* ─── SVG layer (edges + connection line) ─── */}
      <svg className="canvas-svg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              className="edge-arrowhead"
            />
          </marker>
        </defs>

        {/* Rendered edges */}
        {edgePositions.map(({ edge, sourcePos, targetPos }) => (
          <WorkflowEdge
            key={edge.id}
            edge={edge}
            sourcePos={sourcePos}
            targetPos={targetPos}
          />
        ))}

        {/* Temporary connection line while wiring */}
        {connecting && (
          <ConnectionLine
            sourceX={connecting.sourceX}
            sourceY={connecting.sourceY}
            targetX={connecting.mouseX}
            targetY={connecting.mouseY}
          />
        )}
      </svg>

      {/* ─── Empty state ───────────────────── */}
      {nodes.length === 0 && (
        <div className="canvas-empty">
          <div className="canvas-empty-icon">
            <Workflow size={48} />
          </div>
          <h3 className="canvas-empty-title">Build Your Workflow</h3>
          <p className="canvas-empty-desc">
            Drag nodes from the sidebar to get started
          </p>
          <div className="canvas-empty-steps">
            <div className="canvas-empty-step">
              <span className="canvas-empty-step-num">1</span>
              <span>Drag a Trigger node to start</span>
            </div>
            <div className="canvas-empty-step">
              <span className="canvas-empty-step-num">2</span>
              <span>Add Action & Condition nodes</span>
            </div>
            <div className="canvas-empty-step">
              <span className="canvas-empty-step-num">3</span>
              <span>Connect and configure your flow</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Nodes layer ───────────────────── */}
      <div
        className="canvas-nodes-layer"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            executionStatus={nodeExecStatus[node.id] || null}
            onStartConnect={handleStartConnect}
            onEndConnect={handleEndConnect}
            canvasOffset={offset}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
