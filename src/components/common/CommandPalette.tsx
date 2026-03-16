import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useHistoryStore } from '../../store/historyStore';
import { NODE_TEMPLATES, CATEGORY_LABELS } from '../../data/nodeTemplates';
import type { NodeTemplate } from '../../data/nodeTemplates';
import { generateId } from '../../utils/helpers';
import {
  Zap, Clock, MousePointer, Globe, Mail, Shuffle,
  GitBranch, ArrowLeftRight, FileText, Box, Search, Command,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './CommandPalette.css';

/* ─── Icon map ────────────────────────────────── */
const iconMap: Record<string, LucideIcon> = {
  Zap, Clock, MousePointer, Globe, Mail, Shuffle,
  GitBranch, ArrowLeftRight, FileText, Box,
};

/* ===================================================
   CommandPalette — Ctrl+K quick-add overlay
   =================================================== */
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
  const addNode = useWorkflowStore((s) => s.addNode);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ─── Filter templates by query ──────────── */
  const filtered = useMemo(() => {
    if (!query.trim()) return NODE_TEMPLATES;
    const q = query.toLowerCase();
    return NODE_TEMPLATES.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
  }, [query]);

  /* ─── Reset on open ──────────────────────── */
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ─── Clamp active index ─────────────────── */
  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  /* ─── Scroll active item into view ───────── */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  /* ─── Add node at center-ish canvas pos ──── */
  const addNodeFromTemplate = useCallback(
    (template: NodeTemplate) => {
      pushSnapshot({ nodes, edges, workflowName });

      const baseX = 200 + Math.random() * 300;
      const baseY = 150 + Math.random() * 200;

      addNode({
        id: generateId('node'),
        type: template.type,
        label: template.label,
        description: template.description,
        position: { x: baseX, y: baseY },
        config: { ...template.defaultConfig },
      });

      onClose();
    },
    [addNode, onClose, pushSnapshot, nodes, edges, workflowName]
  );

  /* ─── Keyboard navigation ────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        addNodeFromTemplate(filtered[activeIndex]);
        return;
      }
    },
    [onClose, filtered, activeIndex, addNodeFromTemplate]
  );

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ─── Search input ────────────────── */}
        <div className="command-palette-input-row">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            className="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search nodes to add…"
            spellCheck={false}
          />
          <kbd className="command-palette-kbd">Esc</kbd>
        </div>

        {/* ─── Results list ────────────────── */}
        <div className="command-palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="command-palette-empty">
              No nodes matching "{query}"
            </div>
          )}

          {filtered.map((template, idx) => {
            const IconComponent = iconMap[template.icon];
            return (
              <div
                key={template.label}
                className={`command-palette-item ${idx === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => addNodeFromTemplate(template)}
              >
                <div
                  className="command-palette-item-icon"
                  style={{ '--node-color': template.color } as React.CSSProperties}
                >
                  {IconComponent && <IconComponent size={16} />}
                </div>
                <div className="command-palette-item-info">
                  <span className="command-palette-item-label">
                    {template.label}
                  </span>
                  <span className="command-palette-item-desc">
                    {template.description}
                  </span>
                </div>
                <span className="command-palette-item-badge">
                  {CATEGORY_LABELS[template.type]}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─── Footer hint ─────────────────── */}
        <div className="command-palette-footer">
          <span><Command size={12} /> <kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Add node</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
