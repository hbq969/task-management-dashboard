# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Task Management Dashboard - A desktop task management application built with React, TypeScript, and Tauri. The UI is in Chinese (Simplified).

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (port 5173)
npm run tauri:dev    # Start Tauri dev mode (desktop app)

# Build
npm run build        # Build frontend to dist/
npm run tauri:build  # Build desktop app for current platform

# Preview
npm run preview      # Preview production build
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI primitives)
- **Routing**: React Router with HashRouter (required for Tauri)
- **State**: React Context (TaskContext) with localStorage persistence
- **Desktop**: Tauri 2 (Rust backend, minimal - mostly shell)

### Directory Structure

```
src/
├── main.tsx                 # Entry point
├── app/
│   ├── App.tsx              # RouterProvider wrapper
│   ├── routes.tsx           # HashRouter config
│   ├── components/          # Feature components
│   │   ├── ui/              # shadcn/ui components (Radix-based)
│   │   ├── Dashboard.tsx    # Main layout, composes all components
│   │   ├── TaskList.tsx     # Task display with pagination
│   │   ├── TaskDrawer.tsx   # Task create/edit form
│   │   ├── TaskToolbar.tsx  # Filters, search, actions
│   │   └── ...
│   ├── context/
│   │   └── TaskContext.tsx  # Global state: tasks, projects, people, filters
│   ├── types/
│   │   └── task.ts          # Task, Project, Person, FilterOptions types
│   └── constants/
│       └── taskLabels.ts    # Label mappings, predefined tags
└── styles/
    └── index.css            # Global styles, scrollbar customization
```

### State Management

All app state lives in `TaskContext.tsx`:
- **Tasks**: CRUD, filtering, sorting, batch operations
- **Projects**: Group tasks by project
- **People**: Contact management, task assignment
- **Filters**: Status, priority, project, tags, time range, search
- **Selection**: Multi-select for batch operations
- **Persistence**: Auto-syncs to localStorage on change

### Key Types

```typescript
// src/app/types/task.ts
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  projectId: string;
  tags: string[];
  progress: number;  // 0-100
  assigneeId?: string;
  relatedPersonIds: string[];
  // ...timestamps
}
```

### UI Components

Uses shadcn/ui pattern. Components in `src/app/components/ui/` are Radix UI primitives wrapped with Tailwind. When adding new UI components, follow the same pattern or copy from shadcn/ui documentation.

### Tauri Configuration

- Config: `src-tauri/tauri.conf.json`
- Uses HashRouter (not BrowserRouter) for file:// protocol compatibility
- Frontend dist is bundled into the app via `vite-plugin-singlefile`

## Notes

- **Language**: UI labels are in Chinese. Keep Chinese text in `taskLabels.ts`.
- **No tests**: Project currently has no test framework configured.
- **Path alias**: `@/` maps to `./src/`
- 每次开发完代码后请使用 chrome dev tools 进行测试验证
- 每次测试完后请重新构建输出产出物
