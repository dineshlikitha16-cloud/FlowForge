import { beforeEach, describe, expect, it } from 'vitest';
import { useHistoryStore } from './historyStore';
import type { WorkflowNode, WorkflowEdge } from '../types/workflow';

const node: WorkflowNode = {
  id: 'n1',
  type: 'trigger',
  label: 'Trigger',
  position: { x: 0, y: 0 },
  config: {},
};

const edge: WorkflowEdge = { id: 'e1', source: 'n1', target: 'n2' };

beforeEach(() => {
  useHistoryStore.setState({ past: [], future: [], maxHistory: 50 });
});

describe('historyStore', () => {
  it('pushes snapshots and performs undo', () => {
    const history = useHistoryStore.getState();

    history.pushSnapshot({ nodes: [node], edges: [], workflowName: 'One' });

    const undoResult = useHistoryStore.getState().undo({
      nodes: [],
      edges: [edge],
      workflowName: 'Two',
    });

    expect(undoResult?.workflowName).toBe('One');
    expect(useHistoryStore.getState().future.length).toBe(1);
  });

  it('performs redo after undo', () => {
    const history = useHistoryStore.getState();

    history.pushSnapshot({ nodes: [node], edges: [], workflowName: 'Initial' });
    useHistoryStore.getState().undo({ nodes: [], edges: [], workflowName: 'Current' });

    const redoResult = useHistoryStore.getState().redo({
      nodes: [node],
      edges: [],
      workflowName: 'Initial',
    });

    expect(redoResult?.workflowName).toBe('Current');
  });
});
