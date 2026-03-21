# CLAUDE.md

本文件为 Claude Code 提供项目指导，记录项目架构、开发规范、测试流程和开发历程。

## 项目概述

**任务管理仪表盘** - 基于 React + TypeScript + Tauri 2 构建的桌面任务管理应用。

- **UI 语言**: 简体中文
- **版本**: v1.0.0
- **仓库**: https://github.com/hbq969/task-management-dashboard

## 命令

```bash
# 开发
npm run dev          # 启动 Vite 开发服务器 (端口 5173)
npm run tauri:dev    # 启动 Tauri 桌面应用开发模式

# 构建
npm run build        # 构建前端到 dist/
npm run tauri:build  # 构建当前平台桌面应用

# 预览
npm run preview      # 预览生产构建
```

## 技术栈

| 领域 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式方案 | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| 路由 | React Router 7 (HashRouter) |
| 状态管理 | React Context + Hooks |
| 桌面框架 | Tauri 2 (Rust) |
| 文件存储 | @tauri-apps/plugin-fs |
| 图标 | Lucide React |
| 日期处理 | date-fns |
| Markdown 渲染 | react-markdown |
| Excel 导出 | xlsx |

## 目录结构

```
src/
├── main.tsx                    # 入口文件
├── app/
│   ├── App.tsx                 # 路由配置
│   ├── routes.tsx              # HashRouter 配置
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── Dashboard.tsx       # 主布局容器
│   │   ├── Sidebar.tsx         # 左侧导航栏（状态、项目、标签、时间）
│   │   ├── TaskList.tsx        # 任务列表（分页、多选、状态切换）
│   │   ├── TaskDrawer.tsx      # 任务创建/编辑抽屉
│   │   ├── TaskToolbar.tsx     # 工具栏（搜索、筛选、排序、批量操作）
│   │   ├── ProjectDialog.tsx   # 项目创建/编辑对话框
│   │   ├── PersonManager.tsx   # 人员管理（含 Excel 导入）
│   │   ├── DataManager.tsx     # 数据导入/导出
│   │   └── ReportExport.tsx    # 报告导出（周报/月报/季报）
│   ├── context/
│   │   └── TaskContext.tsx     # 全局状态管理
│   ├── types/
│   │   └── task.ts             # 类型定义
│   ├── constants/
│   │   └── taskLabels.ts       # 中文标签映射
│   └── services/
│       └── storage.ts          # 文件存储服务（Tauri/localStorage）
└── styles/
    └── index.css               # 全局样式、滚动条定制
```

## 核心数据模型

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
  progress: number;           // 0-100
  assigneeId?: string;
  relatedPersonIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  order: number;              // 排序字段
}

interface Person {
  id: string;
  name: string;
  company?: string;
  department?: string;
  createdAt: string;
}

interface FilterOptions {
  status: 'all' | Task['status'];
  priority: 'all' | Task['priority'];
  projectId: string;
  tags: string[];
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
  timeRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  searchQuery: string;
  customDateStart?: string;
  customDateEnd?: string;
}
```

## 状态管理 (TaskContext)

所有应用状态集中在 `TaskContext.tsx`:

### 数据状态
- `tasks` - 任务列表
- `projects` - 项目列表
- `people` - 人员列表
- `predefinedTags` - 预定义标签
- `filters` - 筛选条件
- `selectedTaskIds` - 选中的任务 ID
- `currentPage` / `pageSize` - 分页状态

### 核心操作
- **任务 CRUD**: `addTask`, `updateTask`, `deleteTask`
- **项目管理**: `addProject`, `updateProject`, `deleteProject`
- **人员管理**: `addPerson`, `updatePerson`, `deletePerson`
- **筛选排序**: `updateFilters`, `getFilteredTasks`
- **批量操作**: `batchUpdateStatus`, `batchDelete`, `batchMoveProject`, `batchToggleTag`, `removeTagFromSelectedTasks`
- **标签管理**: `addPredefinedTag`, `deleteTag`, `getSelectedTasksTagStatus`
- **数据持久化**: `exportData`, `importData`
- **报告生成**: `generateReport(type, startDate?, filterTags?)`

## 开发规范

### 代码风格
- **不可变数据**: 使用展开运算符和 `map/filter`，禁止直接修改状态
- **函数组件**: 统一使用函数组件 + Hooks
- **文件大小**: 单文件不超过 800 行
- **路径别名**: `@/` 映射到 `./src/`

### UI 组件规范
- 使用 shadcn/ui 模式：Radix UI 原语 + Tailwind CSS
- 中文文本统一放在 `taskLabels.ts`
- 响应式设计：使用 `shrink-0`, `whitespace-nowrap` 防止关键元素换行
- 图标按钮配合 Tooltip 使用

### Git 提交规范
```
<type>: <description>

Types: feat, fix, refactor, docs, test, chore, perf, ci
```

## 测试流程

### 开发阶段测试
1. **启动开发服务器**: `npm run dev`
2. **Chrome DevTools MCP 测试**:
   - 页面快照验证: `take_snapshot`
   - 截图验证: `take_screenshot`
   - 交互测试: `click`, `fill`, `hover`
3. **功能验证清单**:
   - [ ] 创建/编辑/删除任务
   - [ ] 状态切换（待办/进行中/已完成）
   - [ ] 进度联动（0%=待办, 1-99%=进行中, 100%=已完成）
   - [ ] 批量操作（打标签、删除）
   - [ ] 筛选排序
   - [ ] 报告导出
   - [ ] 数据导入导出
   - [ ] 响应式布局

### 构建验证
```bash
npm run build          # 前端构建
npm run tauri:build    # 桌面应用构建
```

### 完成检查
- [ ] 功能测试通过
- [ ] 构建成功
- [ ] `git commit` 提交
- [ ] 更新 `TODO.md`

## 关键实现细节

### 1. 数据持久化
- **Tauri 环境**: 使用 `@tauri-apps/plugin-fs` 写入 `{appDataDir}/todo-app/data.json`
- **浏览器环境**: 降级到 `localStorage`
- **自动迁移**: 首次启动时自动从 `localStorage` 迁移到文件存储

### 2. 进度联动逻辑
```typescript
// TaskDrawer.tsx
if (progress === 0) status = 'todo';
else if (progress < 100) status = 'in-progress';
else status = 'completed';
```

### 3. 批量标签切换
- 点击标签即时切换
- 所有选中任务都有标签 → 确认后移除
- 部分有/都没有 → 直接添加
- 使用 `getSelectedTasksTagStatus()` 判断状态

### 4. 报告导出
- 支持格式: Markdown、纯文本、Excel
- 按项目分组，按状态排序（已完成 → 进行中 → 待办）
- 项目按 `order` 字段排序
- 筛选标签后导出

### 5. 响应式工具栏
- 图标按钮 + Tooltip 节省空间
- 创建任务按钮保留文字（主要操作）
- 搜索框 `max-w-xs` 限制宽度

## 注意事项

- **UI 语言**: 保持中文，新增文案放入 `taskLabels.ts`
- **无测试框架**: 当前项目未配置自动化测试，使用 Chrome DevTools MCP 手动测试
- **Tauri 权限**: 文件系统权限在 `src-tauri/capabilities/default.json` 配置
- **单文件构建**: 使用 `vite-plugin-singlefile` 将所有资源内联到 HTML
