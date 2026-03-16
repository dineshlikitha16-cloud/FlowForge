import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { validateWorkflow } from '../../engine/validateWorkflow';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Terminal,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import './ExecutionPanel.css';

type PanelTab = 'logs' | 'validation';

const ExecutionPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('logs');
  const logsEndRef = useRef<HTMLDivElement>(null);

  /* ─── Store ─────────────────────────────── */
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const executionStatus = useWorkflowStore((s) => s.executionStatus);
  const executionLogs = useWorkflowStore((s) => s.executionLogs);
  const validationErrors = useWorkflowStore((s) => s.validationErrors);
  const setValidationErrors = useWorkflowStore((s) => s.setValidationErrors);
  const clearValidationErrors = useWorkflowStore((s) => s.clearValidationErrors);
  const clearExecutionLogs = useWorkflowStore((s) => s.clearExecutionLogs);

  /* ─── Auto-scroll logs ──────────────────── */
  useEffect(() => {
    if (isExpanded && activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionLogs, isExpanded, activeTab]);

  /* ─── Auto-expand when execution starts ── */
  useEffect(() => {
    if (executionStatus === 'running') {
      setIsExpanded(true);
      setActiveTab('logs');
    }
  }, [executionStatus]);

  /* ─── Validate handler ──────────────────── */
  const handleValidate = () => {
    const errors = validateWorkflow(nodes, edges);
    setValidationErrors(errors);
    setActiveTab('validation');
    setIsExpanded(true);
  };

  /* ─── Counts ─────────────────────────────── */
  const errorCount = validationErrors.filter((e) => e.type === 'error').length;
  const warningCount = validationErrors.filter((e) => e.type === 'warning').length;

  /* ─── Status badge ───────────────────────── */
  const renderStatusBadge = () => {
    switch (executionStatus) {
      case 'running':
        return (
          <span className="exec-badge exec-badge-running">
            <Loader2 size={12} className="exec-spinner" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="exec-badge exec-badge-success">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="exec-badge exec-badge-error">
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return (
          <span className="exec-badge exec-badge-idle">
            Idle
          </span>
        );
    }
  };

  return (
    <div className={`execution-panel ${isExpanded ? 'execution-panel-expanded' : ''}`}>
      {/* ─── Header bar ─────────────────────── */}
      <div
        className="execution-panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="execution-panel-header-left">
          <Terminal size={16} />
          <span className="execution-panel-title">Execution</span>
          {renderStatusBadge()}

          {validationErrors.length > 0 && (
            <span className="exec-validation-count">
              {errorCount > 0 && (
                <span className="exec-count-error">
                  <XCircle size={11} /> {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="exec-count-warning">
                  <AlertTriangle size={11} /> {warningCount}
                </span>
              )}
            </span>
          )}
        </div>

        <div className="execution-panel-header-right">
          <button
            className="exec-header-btn"
            title="Validate Workflow"
            onClick={(e) => {
              e.stopPropagation();
              handleValidate();
            }}
          >
            <ShieldCheck size={14} />
          </button>
          {executionLogs.length > 0 && (
            <button
              className="exec-header-btn"
              title="Clear Logs"
              onClick={(e) => {
                e.stopPropagation();
                clearExecutionLogs();
                clearValidationErrors();
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* ─── Body ───────────────────────────── */}
      {isExpanded && (
        <div className="execution-panel-body">
          {/* Tabs */}
          <div className="exec-tabs">
            <button
              className={`exec-tab ${activeTab === 'logs' ? 'exec-tab-active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <Terminal size={13} />
              Logs
              {executionLogs.length > 0 && (
                <span className="exec-tab-count">{executionLogs.length}</span>
              )}
            </button>
            <button
              className={`exec-tab ${activeTab === 'validation' ? 'exec-tab-active' : ''}`}
              onClick={() => setActiveTab('validation')}
            >
              <ShieldCheck size={13} />
              Validation
              {validationErrors.length > 0 && (
                <span className="exec-tab-count">{validationErrors.length}</span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="exec-content">
            {activeTab === 'logs' && (
              <div className="exec-logs">
                {executionLogs.length === 0 ? (
                  <div className="exec-empty">
                    <Terminal size={24} />
                    <p>No execution logs yet.</p>
                    <p className="exec-empty-sub">Run the workflow to see output here.</p>
                  </div>
                ) : (
                  executionLogs.map((log, i) => (
                    <div
                      key={`${log.nodeId}-${i}`}
                      className={`exec-log-entry exec-log-${log.status}`}
                    >
                      <div className="exec-log-icon">
                        {log.status === 'success' && <CheckCircle2 size={14} />}
                        {log.status === 'failure' && <XCircle size={14} />}
                        {log.status === 'running' && <Loader2 size={14} className="exec-spinner" />}
                        {log.status === 'pending' && <AlertCircle size={14} />}
                      </div>
                      <div className="exec-log-body">
                        <span className="exec-log-message">{log.message}</span>
                        <span className="exec-log-time">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="exec-validation">
                {validationErrors.length === 0 ? (
                  <div className="exec-empty">
                    <ShieldCheck size={24} />
                    <p>No validation results.</p>
                    <p className="exec-empty-sub">
                      Click the shield icon to validate your workflow.
                    </p>
                  </div>
                ) : (
                  validationErrors.map((err, i) => (
                    <div
                      key={i}
                      className={`exec-validation-item exec-validation-${err.type}`}
                    >
                      <div className="exec-validation-icon">
                        {err.type === 'error' ? (
                          <XCircle size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                      </div>
                      <span className="exec-validation-msg">{err.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionPanel;
