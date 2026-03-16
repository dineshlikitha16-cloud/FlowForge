import { useState, useMemo } from 'react';
import {
  NODE_TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '../../data/nodeTemplates';
import type { NodeTemplate } from '../../data/nodeTemplates';
import type { NodeCategory } from '../../types/workflow';
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
  Search,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './Sidebar.css';

/* ─── Icon map — maps string key to Lucide component ─── */
const iconMap: Record<string, LucideIcon> = {
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
};

const categories: NodeCategory[] = ['trigger', 'action', 'condition', 'output'];

const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  /* ─── Filter templates by search ─────────── */
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return NODE_TEMPLATES;
    const q = searchQuery.toLowerCase();
    return NODE_TEMPLATES.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData(
      'application/flowforge-node',
      JSON.stringify(template)
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const renderNodeItem = (template: NodeTemplate) => {
    const IconComponent = iconMap[template.icon];

    return (
      <div
        key={template.label}
        className="sidebar-node-item"
        draggable
        onDragStart={(e) => onDragStart(e, template)}
        title={`${template.label} (${template.type})`}
        style={{ '--node-color': template.color } as React.CSSProperties}
      >
        <div className="sidebar-node-icon">
          {IconComponent && <IconComponent size={18} />}
        </div>
        <div className="sidebar-node-info">
          <span className="sidebar-node-label">{template.label}</span>
          <span className="sidebar-node-desc">{template.description}</span>
        </div>
      </div>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Node Library</h2>
        <span className="sidebar-count">{filteredTemplates.length} nodes</span>
      </div>

      {/* ─── Search input ─────────────────── */}
      <div className="sidebar-search">
        <Search size={14} className="sidebar-search-icon" />
        <input
          className="sidebar-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes…"
          spellCheck={false}
        />
        {searchQuery && (
          <button
            className="sidebar-search-clear"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {categories.map((category) => {
          const templates = filteredTemplates.filter((t) => t.type === category);
          if (templates.length === 0) return null;
          return (
            <div key={category} className="sidebar-category">
              <div className="sidebar-category-header">
                <div
                  className="sidebar-category-dot"
                  style={{ background: CATEGORY_COLORS[category] }}
                />
                <span className="sidebar-category-label">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="sidebar-category-count">
                  {templates.length}
                </span>
              </div>
              <div className="sidebar-category-nodes">
                {templates.map(renderNodeItem)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <span>Drag nodes to canvas →</span>
      </div>
    </aside>
  );
};

export default Sidebar;
