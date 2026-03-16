import { useRef, useCallback } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import ThemeToggle from '../common/ThemeToggle';
import { validateWorkflow } from '../../engine/validateWorkflow';
import { executeWorkflow } from '../../engine/executeWorkflow';
import type { ExecutionHandle } from '../../engine/executeWorkflow';
import {
  exportWorkflow,
  importWorkflow,
  restoreWorkflowVersion,
  saveWorkflowToStorage,
} from '../../utils/workflowIO';
import { useHistoryStore } from '../../store/historyStore';
import { useToastStore } from '../../store/toastStore';
import { Workflow, Save, Upload, Download, Play, Loader2, Layers, RotateCcw } from 'lucide-react';
import './Header.css';

/* ===================================================
   Header Props
   =================================================== */
interface HeaderProps {
  onOpenPresets?: () => void;
  onOpenCommandPalette?: () => void;
}

const Header = ({ onOpenPresets, onOpenCommandPalette }: HeaderProps) => {
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const executionStatus = useWorkflowStore((s) => s.executionStatus);

  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const resetWorkflow = useWorkflowStore((s) => s.resetWorkflow);
  const setValidationErrors = useWorkflowStore((s) => s.setValidationErrors);
  const setExecutionStatus = useWorkflowStore((s) => s.setExecutionStatus);
  const setCurrentExecutingNodeId = useWorkflowStore((s) => s.setCurrentExecutingNodeId);
  const addExecutionLog = useWorkflowStore((s) => s.addExecutionLog);
  const clearExecutionLogs = useWorkflowStore((s) => s.clearExecutionLogs);

  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const addToast = useToastStore((s) => s.addToast);
  const execHandleRef = useRef<ExecutionHandle | null>(null);

  /* ─── Import ──────────────────────────────── */
  const handleImport = useCallback(async () => {
    try {
      const workflow = await importWorkflow();
      pushSnapshot({ nodes, edges, workflowName });
      resetWorkflow();
      setWorkflowName(workflow.name);
      workflow.nodes.forEach((n) => addNode(n));
      workflow.edges.forEach((e) => addEdge(e));
      addToast(`Imported "${workflow.name}"`, 'success');
    } catch {
      // user cancelled or bad file — silently ignore
    }
  }, [resetWorkflow, setWorkflowName, addNode, addEdge, pushSnapshot, nodes, edges, workflowName, addToast]);

  /* ─── Export ──────────────────────────────── */
  const handleExport = useCallback(() => {
    exportWorkflow(workflowName, nodes, edges);
    addToast('Workflow exported!', 'success');
  }, [workflowName, nodes, edges, addToast]);

  /* ─── Save ────────────────────────────────── */
  const handleSave = useCallback(() => {
    saveWorkflowToStorage(workflowName, nodes, edges);
    addToast('Workflow saved!', 'success');
  }, [workflowName, nodes, edges, addToast]);

  /* ─── Restore previous version ───────────── */
  const handleRestorePrevious = useCallback(() => {
    const previous = restoreWorkflowVersion(1);
    if (!previous) {
      addToast('No previous saved version available yet', 'warning');
      return;
    }

    pushSnapshot({ nodes, edges, workflowName });
    resetWorkflow();
    setWorkflowName(previous.name);
    previous.nodes.forEach((n) => addNode(n));
    previous.edges.forEach((e) => addEdge(e));
    addToast('Restored previous version', 'success');
  }, [
    addEdge,
    addNode,
    addToast,
    edges,
    nodes,
    pushSnapshot,
    resetWorkflow,
    setWorkflowName,
    workflowName,
  ]);

  /* ─── Run / Stop ──────────────────────────── */
  const handleRun = useCallback(() => {
    if (executionStatus === 'running') {
      execHandleRef.current?.abort();
      setExecutionStatus('failed');
      setCurrentExecutingNodeId(null);
      execHandleRef.current = null;
      return;
    }

    // Validate first
    const errors = validateWorkflow(nodes, edges);
    setValidationErrors(errors);
    const blocking = errors.filter((e) => e.type === 'error');
    if (blocking.length > 0) {
      setExecutionStatus('failed');
      addToast(`${blocking.length} validation error(s) — fix before running`, 'error');
      return;
    }

    clearExecutionLogs();

    execHandleRef.current = executeWorkflow(nodes, edges, {
      onStart: () => setExecutionStatus('running'),
      onNodeStart: (nodeId) => setCurrentExecutingNodeId(nodeId),
      onNodeComplete: (log) => {
        addExecutionLog(log);
        setCurrentExecutingNodeId(null);
      },
      onComplete: () => {
        setExecutionStatus('completed');
        setCurrentExecutingNodeId(null);
        execHandleRef.current = null;
        addToast('Workflow completed successfully!', 'success');
      },
      onFail: (message) => {
        addExecutionLog({
          nodeId: '__system__',
          nodeLabel: 'System',
          status: 'failure',
          message,
          timestamp: new Date().toISOString(),
        });
        setExecutionStatus('failed');
        setCurrentExecutingNodeId(null);
        execHandleRef.current = null;
        addToast('Workflow execution failed', 'error');
      },
    });
  }, [nodes, edges, executionStatus, setValidationErrors, setExecutionStatus, setCurrentExecutingNodeId, addExecutionLog, clearExecutionLogs, addToast]);

  const isRunning = executionStatus === 'running';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <Workflow size={24} />
          <span className="header-brand">FlowForge</span>
        </div>
        <div className="header-divider" />
        <input
          className="header-workflow-name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow name..."
          spellCheck={false}
        />
      </div>

      <div className="header-right">
        <button className="header-btn" title="Workflow Templates" onClick={onOpenPresets}>
          <Layers size={18} />
          <span className="header-btn-label">Templates</span>
        </button>
        <button className="header-btn" title="Quick Add Node (Ctrl+K)" onClick={onOpenCommandPalette}>
          <span className="header-btn-label">⌘K</span>
        </button>
        <div className="header-divider" />
        <button className="header-btn" title="Import Workflow" onClick={handleImport}>
          <Upload size={18} />
          <span className="header-btn-label">Import</span>
        </button>
        <button className="header-btn" title="Export Workflow" onClick={handleExport}>
          <Download size={18} />
          <span className="header-btn-label">Export</span>
        </button>
        <button className="header-btn" title="Restore Previous Version" onClick={handleRestorePrevious}>
          <RotateCcw size={18} />
          <span className="header-btn-label">Restore</span>
        </button>
        <button className="header-btn" title="Save Workflow" onClick={handleSave}>
          <Save size={18} />
          <span className="header-btn-label">Save</span>
        </button>
        <div className="header-divider" />
        <ThemeToggle />
        <div className="header-divider" />
        <button
          className={`header-btn ${isRunning ? 'header-btn-danger' : 'header-btn-primary'}`}
          title={isRunning ? 'Stop Workflow' : 'Run Workflow'}
          onClick={handleRun}
        >
          {isRunning ? (
            <>
              <Loader2 size={16} className="header-spinner" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Run</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
