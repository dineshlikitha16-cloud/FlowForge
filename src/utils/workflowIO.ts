import type { WorkflowNode, WorkflowEdge, Workflow } from '../types/workflow';
import { generateId } from './helpers';

/* ===================================================
   Workflow I/O Utilities
   Export / Import / Save / Load workflows
   =================================================== */

const STORAGE_KEY = 'flowforge-saved-workflow';
const VERSION_STORAGE_KEY = 'flowforge-workflow-versions';
const MAX_VERSIONS = 20;

/* ─── Build a full Workflow object from store data ── */
export const buildWorkflowObject = (
  name: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  existingId?: string
): Workflow => ({
  id: existingId || generateId('wf'),
  name,
  nodes,
  edges,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/* ===================================================
   Export — download as .json file
   =================================================== */
export const exportWorkflow = (
  name: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): void => {
  const workflow = buildWorkflowObject(name, nodes, edges);
  const json = JSON.stringify(workflow, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(name)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ===================================================
   Import — read from a .json file (via <input>)
   =================================================== */
export const importWorkflow = (): Promise<Workflow> =>
  new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Basic shape validation
        if (!data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('Invalid workflow file — missing nodes array.');
        }
        if (!data.edges || !Array.isArray(data.edges)) {
          throw new Error('Invalid workflow file — missing edges array.');
        }

        const workflow: Workflow = {
          id: data.id || generateId('wf'),
          name: data.name || 'Imported Workflow',
          nodes: data.nodes,
          edges: data.edges,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        resolve(workflow);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse workflow file.'));
      }
    };

    input.oncancel = () => reject(new Error('Import cancelled'));
    input.click();
  });

/* ===================================================
   Save / Load — localStorage persistence
   =================================================== */
export const saveWorkflowToStorage = (
  name: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): void => {
  const workflow = buildWorkflowObject(name, nodes, edges);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));

  try {
    const versions = loadWorkflowVersions();
    const latest = versions[0];

    // Avoid adding duplicate snapshots when only timestamps changed.
    if (latest && areWorkflowsEquivalent(latest, workflow)) {
      return;
    }

    const nextVersions = [workflow, ...versions].slice(0, MAX_VERSIONS);
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(nextVersions));
  } catch {
    // Keep current save path resilient even if version history fails.
  }
};

export const loadWorkflowFromStorage = (): Workflow | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.nodes || !data.edges) return null;
    return data as Workflow;
  } catch {
    return null;
  }
};

export const clearSavedWorkflow = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERSION_STORAGE_KEY);
};

export const loadWorkflowVersions = (): Workflow[] => {
  try {
    const raw = localStorage.getItem(VERSION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((w): w is Workflow => {
      const candidate = w as Partial<Workflow>;
      return (
        typeof candidate?.id === 'string' &&
        typeof candidate?.name === 'string' &&
        Array.isArray(candidate?.nodes) &&
        Array.isArray(candidate?.edges) &&
        typeof candidate?.createdAt === 'string' &&
        typeof candidate?.updatedAt === 'string'
      );
    });
  } catch {
    return [];
  }
};

export const restoreWorkflowVersion = (index = 1): Workflow | null => {
  const versions = loadWorkflowVersions();
  return versions[index] ?? null;
};

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
const sanitizeFileName = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'workflow';

const areWorkflowsEquivalent = (a: Workflow, b: Workflow): boolean =>
  JSON.stringify({
    name: a.name,
    nodes: a.nodes,
    edges: a.edges,
  }) ===
  JSON.stringify({
    name: b.name,
    nodes: b.nodes,
    edges: b.edges,
  });
