import { useWorkflowStore } from '../../store/workflowStore';
import { NODE_TEMPLATES } from '../../data/nodeTemplates';
import { Settings, X, Trash2 } from 'lucide-react';
import './ConfigPanel.css';

const ConfigPanel = () => {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const template = selectedNode
    ? NODE_TEMPLATES.find(
        (t) =>
          t.type === selectedNode.type && t.label === selectedNode.label
      )
    : null;

  /* ─── Empty state ─────────────────────────── */
  if (!selectedNode) {
    return (
      <aside className="config-panel config-panel-empty-state">
        <div className="config-panel-header">
          <h2 className="config-panel-title">Configuration</h2>
        </div>
        <div className="config-panel-empty">
          <div className="config-panel-empty-icon">
            <Settings size={36} />
          </div>
          <p className="config-panel-empty-title">No node selected</p>
          <p className="config-panel-empty-text">
            Click on a node in the canvas to configure it
          </p>
        </div>
      </aside>
    );
  }

  /* ─── Config change handler ───────────────── */
  const handleConfigChange = (key: string, value: string | number | boolean) => {
    updateNode(selectedNode.id, {
      config: { ...selectedNode.config, [key]: value },
    });
  };

  return (
    <aside className="config-panel">
      <div className="config-panel-header">
        <h2 className="config-panel-title">Configuration</h2>
        <button
          className="config-panel-close"
          onClick={() => setSelectedNodeId(null)}
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="config-panel-content">
        {/* ─── Node info ─────────────────────── */}
        <div className="config-section">
          <div className="config-node-badge" style={{ '--badge-color': template?.color || '#6366f1' } as React.CSSProperties}>
            <span className="config-node-type">{selectedNode.type}</span>
          </div>
          <h3 className="config-node-name">{selectedNode.label}</h3>
          {selectedNode.description && (
            <p className="config-node-desc">{selectedNode.description}</p>
          )}
        </div>

        <div className="config-divider" />

        {/* ─── Config fields ─────────────────── */}
        {template && template.configFields.length > 0 ? (
          <div className="config-section">
            <h4 className="config-section-title">Settings</h4>
            {template.configFields.map((field) => (
              <div key={field.key} className="config-field">
                <label className="config-label">
                  {field.label}
                  {field.required && <span className="config-required">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    className="config-input"
                    type="text"
                    value={(selectedNode.config[field.key] as string) ?? ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    className="config-input"
                    type="number"
                    value={(selectedNode.config[field.key] as number) ?? 0}
                    onChange={(e) => handleConfigChange(field.key, Number(e.target.value))}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    className="config-textarea"
                    value={(selectedNode.config[field.key] as string) ?? ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                )}

                {field.type === 'select' && field.options && (
                  <select
                    className="config-select"
                    value={(selectedNode.config[field.key] as string) ?? ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'boolean' && (
                  <label className="config-checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!selectedNode.config[field.key]}
                      onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="config-section">
            <p className="config-no-fields">
              This node has no configurable fields.
            </p>
          </div>
        )}

        <div className="config-divider" />

        {/* ─── Danger zone ───────────────────── */}
        <div className="config-section">
          <button
            className="config-delete-btn"
            onClick={() => {
              deleteNode(selectedNode.id);
            }}
          >
            <Trash2 size={14} />
            <span>Delete Node</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ConfigPanel;
