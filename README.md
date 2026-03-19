# Task Management Dashboard

一个基于 Tauri 2 构建的跨平台桌面任务管理应用，使用 React、TypeScript 和 Tailwind CSS 开发。

## 功能特性

### 任务管理
- 创建、编辑、删除任务
- 任务属性：标题、描述、截止日期、优先级、状态、进度
- 支持标签分类和项目分组
- 任务指派和关联人员

### 项目管理
- 创建和管理项目
- 项目颜色标识
- 按项目筛选任务

### 人员管理
- 联系人信息管理（姓名、公司、部门、联系方式）
- 任务负责人指派
- 关联人员设置

### 筛选与搜索
- 按状态筛选（待办/进行中/已完成）
- 按优先级筛选（紧急/高/中/低）
- 按项目筛选
- 按标签筛选
- 时间范围筛选（最近1天/3天/1周/本周/本月/本季度/本年/自定义）
- 关键词搜索
- 多种排序方式（截止日期/优先级/创建时间/标题）

### 报告导出
- 支持多种格式导出
- 任务报告生成

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式方案 | Tailwind CSS 4 |
| UI 组件 | shadcn/ui (Radix UI) |
| 路由管理 | React Router (HashRouter) |
| 状态管理 | React Context + localStorage |
| 桌面框架 | Tauri 2 |
| 动画效果 | Framer Motion |
| 日期处理 | date-fns |

## 快速开始

### 环境要求

- Node.js 18+
- Rust (用于 Tauri)
- pnpm/npm/yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动 Web 开发服务器
npm run dev

# 启动 Tauri 桌面应用开发模式
npm run tauri:dev
```

### 构建应用

```bash
# 构建前端
npm run build

# 构建桌面应用
npm run tauri:build
```

### 预览构建

```bash
npm run preview
```

## 项目结构

```
src/
├── main.tsx                 # 应用入口
├── app/
│   ├── App.tsx              # 路由配置
│   ├── routes.tsx           # 路由定义
│   ├── components/          # 功能组件
│   │   ├── ui/              # shadcn/ui 基础组件
│   │   ├── Dashboard.tsx    # 主布局
│   │   ├── TaskList.tsx     # 任务列表
│   │   ├── TaskDrawer.tsx   # 任务表单抽屉
│   │   ├── TaskToolbar.tsx  # 工具栏（筛选、搜索）
│   │   ├── Sidebar.tsx      # 侧边栏
│   │   ├── ProjectDialog.tsx# 项目管理对话框
│   │   ├── PersonManager.tsx# 人员管理
│   │   ├── DataManager.tsx  # 数据管理
│   │   └── ReportExport.tsx # 报告导出
│   ├── context/
│   │   └── TaskContext.tsx  # 全局状态管理
│   ├── types/
│   │   └── task.ts          # 类型定义
│   └── constants/
│       └── taskLabels.ts    # 标签和常量
└── styles/
    └── index.css            # 全局样式
```

## 核心数据模型

```typescript
// 任务
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
}

// 项目
interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

// 人员
interface Person {
  id: string;
  name: string;
  company?: string;
  department?: string;
  phone?: string;
  email?: string;
}
```

## 配置说明

### Tauri 配置

配置文件位于 `src-tauri/tauri.conf.json`。

应用使用 HashRouter 以兼容 Tauri 的 `file://` 协议。

### 路径别名

`@/` 映射到 `./src/` 目录。

## 开发说明

- **语言**: UI 界面使用简体中文
- **数据持久化**: 使用 localStorage 本地存储
- **构建输出**: 通过 `vite-plugin-singlefile` 将前端打包为单文件嵌入应用

## License

MIT