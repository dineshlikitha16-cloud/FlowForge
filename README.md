# FlowForge - Visual Workflow Builder

Frontend-only visual workflow automation builder built with React + TypeScript.

## Tech Stack

- React 18
- TypeScript (strict mode)
- Zustand (state + undo/redo history store)
- Vite
- Vitest (unit tests)

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

```bash
npm run dev      # development server
npm run lint     # TypeScript strict no-emit check
npm run test     # unit tests (graph, validation, history)
npm run build    # production build
npm run preview  # preview built app
```

## Features

- Three-panel workflow editor layout
- Node library, drag/drop, directional connections
- Validation engine:
  - Trigger presence
  - Cycle detection
  - Required config checks
- Execution simulation engine with logs and node highlighting
- Undo/redo (past/present/future pattern)
- Auto-save to localStorage
- Import/export workflow JSON
- Version history snapshots with one-click previous restore
- Light/dark theme
- Responsive UI

## Testing Scope

Unit tests cover:

- Graph traversal utility (`topologicalSort`)
- Workflow validation rules
- Undo/redo history behavior
- 75-node scalability baseline (topological sort + validation)

Manual testing:

- Run/stop execution simulation
- Validate workflow before run
- Import/export and auto-save restore

## Verification Snapshot (2026-03-15)

Command checks:

- `npm run test` -> pass
- `npm run lint` -> pass
- `npm run build` -> pass

Manual checks:

- Add/update/delete nodes and connect directional edges -> pass
- Invalid edge prevention (self-loop, duplicate edge, target trigger) -> pass
- Validation errors visible before execution -> pass
- Step execution highlighting and logs -> pass
- Auto-save persists across reload -> pass
- Import/export JSON roundtrip -> pass
- Restore previous version from header action -> pass

## Architecture

See `ARCHITECTURE.md` for layer breakdown and design decisions.
