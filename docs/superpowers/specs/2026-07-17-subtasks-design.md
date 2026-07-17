# 子任务功能设计

**日期**: 2026-07-17
**状态**: 待实现

## 概述

在任务详情中支持添加子任务，每个子任务有独立的状态、进度和责任人。子任务在报告导出中以二级缩进形式展示。同时移除任务描述导出到报告的逻辑。

## 数据模型

### SubTask 接口

```typescript
interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;      // 复用现有 14 种状态
  progress: number;         // 0-100
  assigneeId?: string;      // 可选责任人
}
```

### Task 接口变更

```typescript
interface Task {
  // ... 现有字段不变
  subtasks: SubTask[];      // 新增，默认 []
}
```

`exportDescription` 字段保留在接口中（向后兼容），但不再有新数据写入，UI 上移除对应控件。

## UI 变更

### TaskDrawer（创建/编辑任务）

1. **删除**：「导出描述到报告」复选框
2. **新增**：描述文本域下方增加子任务区域
   - 内联输入框 + 「添加子任务」按钮
   - 子任务列表，每项展示：
     - 完成圆形按钮（点击切换 completed/todo）
     - 标题（可点击编辑）
     - 状态下拉（复用 TaskStatus）
     - 进度滑块
     - 责任人选择
     - 删除按钮

### ReportExport（报告导出）

- 子任务以二级缩进展示在父任务下方
- 格式示例：
  ```
  1. 父任务标题（进行中，70%）
    - [子任务A]（完成，100%）
    - [子任务B]（待办，0%）
  ```

## 不变更

- TaskList 主列表不变
- 侧边栏筛选不变
- 批量操作逻辑不变
- 数据导入/导出兼容旧数据（无 subtasks 字段的任务默认 subtasks: []）
