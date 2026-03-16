# FlowForge Architecture

## High-Level Layout

FlowForge follows a frontend-only layered architecture with clear separation of concerns:

1. UI Layer (`src/components`)
2. State Layer (`src/store`)
3. Engine Layer (`src/engine`)
4. Persistence Layer (`src/utils/workflowIO.ts`)
5. Types Layer (`src/types`)

## UI Layer

- `Sidebar`: Node template library and drag source
- `Canvas`: Graph editing area (nodes, edges, pan/zoom, minimap)
- `ConfigPanel`: Node configuration editing
- `ExecutionPanel`: Validation and execution logs
- `Header`: Workflow metadata, run controls, import/export/save

The UI is split into reusable feature components with CSS modules per component file.

## State Layer (Zustand)

### `workflowStore`

Single source of truth for:

- `nodes`, `edges`, `workflowName`
- selection state
- validation state
- execution status and logs

Actions mutate immutable arrays via functional `set` updates.

### `historyStore`

Implements undo/redo using past/future stacks:

- `pushSnapshot` stores pre-mutation snapshots
- `undo` returns previous snapshot and pushes current to future
- `redo` returns next snapshot and pushes current to past

## Engine Layer

### `validateWorkflow.ts`

Business validation rules:

- at least one trigger
- required config fields
- cycle detection
- duplicate edge detection
- disconnected/orphan warnings

### `graph.ts`

Core graph utility:

- `topologicalSort` (Kahn algorithm) with trigger-priority tie-break

### `executeWorkflow.ts`

Simulation pipeline:

- pre-run validation
- topological execution ordering
- async node simulation
- callback-driven status updates to store/UI

## Persistence Layer

`workflowIO.ts` handles:

- auto-save/load in `localStorage`
- JSON import/export
- rolling version snapshots
- restore previous workflow version
- workflow object serialization

## App Orchestration

`App.tsx` composes the full layout and cross-cutting concerns:

- theme application to root
- restore from storage on mount
- auto-save on workflow changes
- global keyboard shortcuts hook

## Performance and Scalability Notes

- Zustand selectors reduce unnecessary component updates
- `useMemo` and `useCallback` used for expensive derivations and handlers
- Minimap and canvas calculations are computed from normalized store data
- Architecture supports extending node types and validation rules without changing core layout
- Scalability baseline is covered by a 75-node unit test for sort + validation runtime
