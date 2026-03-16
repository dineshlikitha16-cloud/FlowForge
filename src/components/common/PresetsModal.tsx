import { useState, useCallback } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useHistoryStore } from '../../store/historyStore';
import { useToastStore } from '../../store/toastStore';
import {
  WORKFLOW_PRESETS,
  PRESET_CATEGORY_LABELS,
} from '../../data/workflowPresets';
import type { WorkflowPreset } from '../../data/workflowPresets';
import {
  X, Zap, Globe, Mail, GitBranch,
  Layers, ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './PresetsModal.css';

/* ─── Icon map for preset icons ──────────────── */
const presetIconMap: Record<string, LucideIcon> = {
  Zap, Globe, Mail, GitBranch,
};

/* ===================================================
   PresetsModal — browse and load workflow presets
   =================================================== */
interface PresetsModalProps {
  open: boolean;
  onClose: () => void;
}

const PresetsModal = ({ open, onClose }: PresetsModalProps) => {
  const resetWorkflow = useWorkflowStore((s) => s.resetWorkflow);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const addToast = useToastStore((s) => s.addToast);

  const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredPresets = filter === 'all'
    ? WORKFLOW_PRESETS
    : WORKFLOW_PRESETS.filter((p) => p.category === filter);

  /* ─── Load preset into canvas ────────────── */
  const handleLoadPreset = useCallback(
    (preset: WorkflowPreset) => {
      pushSnapshot({ nodes, edges, workflowName });
      resetWorkflow();
      setWorkflowName(preset.name);

      // Deep-clone nodes & edges to avoid mutation
      preset.nodes.forEach((n) =>
        addNode({ ...n, position: { ...n.position }, config: { ...n.config } })
      );
      preset.edges.forEach((e) => addEdge({ ...e }));

      addToast(`Loaded preset: "${preset.name}"`, 'success');
      onClose();
    },
    [resetWorkflow, setWorkflowName, addNode, addEdge, pushSnapshot, nodes, edges, workflowName, addToast, onClose]
  );

  if (!open) return null;

  return (
    <div className="presets-backdrop" onClick={onClose}>
      <div className="presets-modal" onClick={(e) => e.stopPropagation()}>
        {/* ─── Header ──────────────────────── */}
        <div className="presets-modal-header">
          <div className="presets-modal-header-left">
            <Layers size={20} />
            <h2>Workflow Templates</h2>
          </div>
          <button className="presets-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ─── Filter tabs ─────────────────── */}
        <div className="presets-filter-row">
          {['all', 'starter', 'integration', 'automation'].map((cat) => (
            <button
              key={cat}
              className={`presets-filter-tab ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'All' : PRESET_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* ─── Preset grid ─────────────────── */}
        <div className="presets-grid">
          {filteredPresets.map((preset) => {
            const IconComponent = presetIconMap[preset.icon];
            const isSelected = selectedPreset?.id === preset.id;

            return (
              <div
                key={preset.id}
                className={`presets-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPreset(preset)}
                onDoubleClick={() => handleLoadPreset(preset)}
              >
                <div className="presets-card-icon">
                  {IconComponent ? <IconComponent size={24} /> : <Layers size={24} />}
                </div>
                <div className="presets-card-info">
                  <h3 className="presets-card-name">{preset.name}</h3>
                  <p className="presets-card-desc">{preset.description}</p>
                  <div className="presets-card-meta">
                    <span className="presets-card-badge">
                      {PRESET_CATEGORY_LABELS[preset.category]}
                    </span>
                    <span className="presets-card-count">
                      {preset.nodeCount} nodes
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Footer ──────────────────────── */}
        <div className="presets-modal-footer">
          <span className="presets-modal-hint">
            Double-click to load instantly · Click to select, then use Load
          </span>
          <div className="presets-modal-footer-actions">
            <button className="presets-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="presets-modal-btn-primary"
              disabled={!selectedPreset}
              onClick={() => selectedPreset && handleLoadPreset(selectedPreset)}
            >
              <ArrowRight size={14} />
              Load Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetsModal;
