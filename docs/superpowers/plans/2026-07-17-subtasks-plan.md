# 子任务功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在任务抽屉中支持添加/编辑子任务（标题、状态、进度、责任人），报告中以二级缩进展示，同时移除任务描述的导出逻辑。

**Architecture:** 新增 `SubTask` 接口挂载在 `Task.subtasks` 数组下，TaskDrawer 内联编辑子任务列表，TaskContext.generateReport 和 ReportExport 的纯文本转换器分别处理子任务的 markdown 和纯文本渲染。

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, shadcn/ui (Radix UI), date-fns

## Global Constraints

- UI 语言：简体中文，文案放入 `taskLabels.ts` 或内联中文
- 不可变数据：展开运算符 + map/filter
- 函数组件 + Hooks
- 向后兼容：无 `subtasks` 字段的任务默认 `subtasks: []`
- `exportDescription` 字段保留在接口中（已有数据兼容），仅移除 UI 控件

---

### Task 1: 新增 SubTask 类型和更新 Task 接口

**Files:**
- Modify: `src/app/types/task.ts`

**Interfaces:**
- Produces: `SubTask` interface, `Task.subtasks` field

- [ ] **Step 1: 在 task.ts 中添加 SubTask 接口和 Task.subtasks 字段**

在 `Person` 接口之后、`Task` 接口之前插入 `SubTask`：

```typescript
export interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number; // 0-100
  assigneeId?: string;
}
```

保留 `export interface Task { ... }` 中原有的 `exportDescription` 字段，在其后新增：

```typescript
  exportDescription?: boolean;
  subtasks?: SubTask[]; // 新增
```

同时更新 `importData` 中迁移逻辑（在 TaskContext.tsx Task 5 中处理）。

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/types/task.ts
git commit -m "feat: 新增 SubTask 类型和 Task.subtasks 字段"
```

---

### Task 2: TaskDrawer 移除导出描述 + 新增子任务 UI

**Files:**
- Modify: `src/app/components/TaskDrawer.tsx`

**Interfaces:**
- Consumes: `SubTask` from Task 1
- Produces: 子任务的添加、编辑、删除 UI

- [ ] **Step 1: 删除「导出描述到报告」复选框**

删除 TaskDrawer.tsx 第 203-215 行（描述下方的 checkbox 区域）：
```tsx
{/* 导出描述到报告 */}
<div className="flex items-center gap-2">
  <Checkbox ... />
  <Label ...>导出描述到报告</Label>
</div>
```

同时从 `formData` 初始状态、`useEffect` 中移除 `exportDescription` 相关字段。

- [ ] **Step 2: 添加子任务相关 state 和 handler**

在组件顶部（`useState` 区域）添加：

```typescript
const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
```

在 `formData` 初始状态中添加 `subtasks: [] as SubTask[]`，以及在 `useEffect` 初始化 `setFormData` 时添加 `subtasks: task.subtasks ?? []`。

在 `handleSubmit` 的 `taskData` 中添加 `subtasks: formData.subtasks`。

添加三个 handler 函数：

```typescript
const handleAddSubtask = () => {
  const title = newSubtaskTitle.trim();
  if (!title) return;
  const newSubtask: SubTask = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    status: 'todo' as TaskStatus,
    progress: 0,
  };
  setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }));
  setNewSubtaskTitle('');
};

const handleUpdateSubtask = (id: string, updates: Partial<SubTask>) => {
  setFormData(prev => ({
    ...prev,
    subtasks: prev.subtasks.map(s => s.id === id ? { ...s, ...updates } : s),
  }));
};

const handleDeleteSubtask = (id: string) => {
  setFormData(prev => ({
    ...prev,
    subtasks: prev.subtasks.filter(s => s.id !== id),
  }));
};
```

需要在 import 中添加 `SubTask` 类型：

```typescript
import type { Task, Priority, TaskStatus, SubTask } from '../types/task';
```

- [ ] **Step 3: 添加子任务 UI（描述下方）**

在原「导出描述到报告」checkbox 位置插入以下 JSX：

```tsx
{/* 子任务 */}
<div className="space-y-2">
  <Label>子任务</Label>
  <div className="flex gap-2">
    <Input
      placeholder="输入子任务标题，回车添加"
      value={newSubtaskTitle}
      onChange={e => setNewSubtaskTitle(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddSubtask();
        }
      }}
    />
    <Button type="button" onClick={handleAddSubtask} variant="outline" size="sm">
      添加
    </Button>
  </div>

  {formData.subtasks.length > 0 && (
    <div className="space-y-1.5">
      {formData.subtasks.map(subtask => (
        <div key={subtask.id} className="border rounded-md p-2 space-y-1.5">
          {/* Row 1: 完成按钮 + 标题 + 删除 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newStatus = subtask.status === 'completed' ? 'todo' as TaskStatus : 'completed' as TaskStatus;
                handleUpdateSubtask(subtask.id, {
                  status: newStatus,
                  progress: newStatus === 'completed' ? 100 : 0,
                });
              }}
              className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                subtask.status === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {subtask.status === 'completed' && <Check className="size-2.5" />}
            </button>
            <Input
              value={subtask.title}
              onChange={e => handleUpdateSubtask(subtask.id, { title: e.target.value })}
              className="h-7 text-sm flex-1"
              placeholder="子任务标题"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => handleDeleteSubtask(subtask.id)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Row 2: 状态 + 进度 + 责任人 */}
          <div className="flex items-center gap-1.5">
            <Select
              value={subtask.status}
              onValueChange={(value: TaskStatus) => {
                let newProgress = subtask.progress;
                if (value === 'completed') newProgress = 100;
                else if (value === 'todo') newProgress = 0;
                handleUpdateSubtask(subtask.id, { status: value, progress: newProgress });
              }}
            >
              <SelectTrigger className="h-7 text-xs w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabels) as TaskStatus[]).map(key => (
                  <SelectItem key={key} value={key}>{statusLabels[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 flex-1">
              <Slider
                value={[subtask.progress]}
                onValueChange={([value]) => {
                  let newStatus = subtask.status;
                  if (value === 100) newStatus = 'completed';
                  else if (value === 0 && subtask.status === 'completed') newStatus = 'todo';
                  handleUpdateSubtask(subtask.id, { progress: value, status: newStatus });
                }}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-7 text-right">{subtask.progress}%</span>
            </div>
            <Select
              value={subtask.assigneeId || ''}
              onValueChange={(value) => handleUpdateSubtask(subtask.id, { assigneeId: value || undefined })}
            >
              <SelectTrigger className="h-7 text-xs w-[80px]">
                <SelectValue placeholder="责任人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">无</SelectItem>
                {people.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/TaskDrawer.tsx
git commit -m "feat: 任务抽屉新增子任务添加编辑功能，移除导出描述开关"
```

---

### Task 3: TaskContext 报告生成中子任务渲染

**Files:**
- Modify: `src/app/context/TaskContext.tsx`

**Interfaces:**
- Consumes: `SubTask`, `Task.subtasks` from Task 1

- [ ] **Step 1: 在 generateReport 中添加子任务输出**

在 `generateReport` 中，处理完 `task.notes` 后、`report += '\n'` 前，添加子任务渲染逻辑。在约第 698 行（`report += '\n';` 之前）插入：

```typescript
          // 子任务
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(sub => {
              const subAssignee = sub.assigneeId
                ? people.find(p => p.id === sub.assigneeId)?.name
                : undefined;
              let subLine = `  - ${sub.title}（${statusLabels[sub.status]}`;
              if (sub.progress > 0) subLine += `，${sub.progress}%`;
              if (subAssignee) subLine += `，${subAssignee}`;
              subLine += '）';
              report += subLine + '\n';
            });
          }
```

同时更新 `importData` 中任务迁移逻辑，确保 `subtasks` 字段有默认值。在第 184 行左右：

```typescript
const migratedTasks = data.tasks.map((task: Task) => ({
  ...task,
  progress: task.progress ?? 0,
  relatedPersonIds: task.relatedPersonIds ?? [],
  subtasks: task.subtasks ?? [], // 新增
}));
```

同样的迁移逻辑加到 `loadData` 中的 `migratedTasks`（约第 184-188 行）。

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/context/TaskContext.tsx
git commit -m "feat: 报告生成支持子任务二级缩进渲染"
```

---

### Task 4: ReportExport 纯文本转换器支持子任务行

**Files:**
- Modify: `src/app/components/ReportExport.tsx`

**Interfaces:**
- Consumes: 子任务 markdown 格式 `  - title（status，progress%）`

- [ ] **Step 1: 更新 markdownToPlainText 处理子任务行**

在 `markdownToPlainText` 函数中，处理完 `- 状态：` / `- 进度：` 等详情行后（约第 87 行之后），添加子任务行的收集逻辑。

找到这一行附近：
```typescript
        if (detail.includes('备注：')) {
          notes = detail.replace(/- 备注：/, '').trim();
        }
```

在备注处理之后、`}`闭合之后，需要把子任务也加到 `descriptions` 或单独的 subtask 收集中。当前代码用 `descriptions` 数组收集缩进的描述行，格式是 `  line content`。子任务行的格式是 `  - title（...）`，可以用类似方式处理。

修改方案：在收集完详情行后，继续收集以 `  - ` 开头的子任务行。这些行以两个空格 + `- ` 开头，`trim()` 后也以 `- ` 开头。但当前循环 `lines[j].trim().startsWith('- ')` 会同时匹配详情行和子任务行。

实际上，详情行（`- 状态：xxx`）没有前导空格，子任务行（`  - [title]...`）有两个前导空格。所以需要区分。

在详情收集完之后（`for (; j < lines.length && lines[j].trim().startsWith('- '); j++)` 循环结束后），新增子任务收集循环：

```typescript
      // 收集子任务
      const subtasks: string[] = [];
      for (; j < lines.length; j++) {
        if (lines[j].startsWith('  - ')) {
          subtasks.push(lines[j].trim().replace(/^- /, ''));
        } else {
          break;
        }
      }
```

然后在输出任务行和描述后，输出子任务：

```typescript
      // 输出子任务
      for (const sub of subtasks) {
        result.push(`  - ${sub}`);
      }
```

需要在函数体开头附近（约第 22 行，`let taskIndex = 0;` 后）声明 `let subtasks: string[] = [];`，因为它在不同的作用域中使用。

实际上，`subtasks` 在三级标题的处理块内使用，在该块内声明即可。把变量声明放在详情收集循环之后。

完整修改见下方的代码 diff。

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ReportExport.tsx
git commit -m "feat: 报告纯文本导出支持子任务缩进显示"
```

---

### Task 5: 端到端验证

**Files:**
- 无新建文件

- [ ] **Step 1: 构建验证**

```bash
npm run build
```

预期：构建成功，无 TypeScript 错误。

- [ ] **Step 2: 开发服务器验证**

```bash
npm run dev
```

手动验证：
1. 打开 http://localhost:5173
2. 创建新任务，确认「导出描述到报告」复选框已消失
3. 在描述下方添加 2-3 个子任务，设置不同状态和进度
4. 保存任务，重新打开编辑确认子任务数据保留
5. 打开报告导出，确认子任务以缩进形式显示在父任务下方
6. 复制报告纯文本，确认格式正确

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: 子任务功能端到端验证通过"
```
