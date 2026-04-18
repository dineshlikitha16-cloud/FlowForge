import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { useThemeStore } from './store/themeStore';
import { useWorkflowStore } from './store/workflowStore';
import { loadWorkflowFromStorage, saveWorkflowToStorage } from './utils/workflowIO';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Header from './components/layout/Header';

const Sidebar = lazy(() => import('./components/layout/Sidebar'));
const Canvas = lazy(() => import('./components/layout/Canvas'));
const ConfigPanel = lazy(() => import('./components/layout/ConfigPanel'));
const ExecutionPanel = lazy(() => import('./components/layout/ExecutionPanel'));
const ContextMenu = lazy(() => import('./components/common/ContextMenu'));
const CommandPalette = lazy(() => import('./components/common/CommandPalette'));
const PresetsModal = lazy(() => import('./components/common/PresetsModal'));

import ToastContainer from './components/common/Toast';
import './App.css';

const App = () => {
  const theme = useThemeStore((s) => s.theme);
  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);

  /* ─── Modal states ─────────────────────────── */
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);
  const openPresets = useCallback(() => setPresetsOpen(true), []);
  const closePresets = useCallback(() => setPresetsOpen(false), []);

  /* ─── Keyboard shortcuts ───────────────────── */
  useKeyboardShortcuts(openCommandPalette);

  /* ─── Apply theme ─────────────────────────── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* ─── Restore saved workflow on mount ─────── */
  useEffect(() => {
    const saved = loadWorkflowFromStorage();
    if (saved) {
      setWorkflowName(saved.name);
      saved.nodes.forEach((n) => addNode(n));
      saved.edges.forEach((e) => addEdge(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Auto-save workflow changes ─────────── */
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveWorkflowToStorage(workflowName, nodes, edges);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [workflowName, nodes, edges]);

  return (
    <div className="app">
      <Header onOpenPresets={openPresets} onOpenCommandPalette={openCommandPalette} />
      <Suspense fallback={<div className="loading-fallback">Loading engine...</div>}>
        <div className="app-body">
          <Sidebar />
          <Canvas />
          <ConfigPanel />
          <ExecutionPanel />
        </div>
        <ContextMenu />
        <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />
        <PresetsModal open={presetsOpen} onClose={closePresets} />
      </Suspense>
      <ToastContainer />
    </div>
  );
};

export default App;
