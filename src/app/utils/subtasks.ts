import type { SubTask } from '../types/task';

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 存量数据（没有时间字段的子任务）按父任务的时间补齐
export const backfillSubtaskTimestamps = (
  subtasks: SubTask[] | undefined,
  parentCreatedAt: string,
  parentUpdatedAt: string,
): SubTask[] =>
  (subtasks ?? []).map(subtask => ({
    ...subtask,
    createdAt: subtask.createdAt ?? parentCreatedAt,
    updatedAt: subtask.updatedAt ?? parentUpdatedAt,
  }));

export const createSubtask = (title: string, now = new Date().toISOString()): SubTask => ({
  id: createId(),
  title,
  status: 'todo',
  progress: 0,
  createdAt: now,
  updatedAt: now,
});

// 只有字段值真正变化时才刷新修改时间，创建时间始终不变
export const updateSubtaskWithTimestamp = (
  subtasks: SubTask[],
  id: string,
  updates: Partial<SubTask>,
  now = new Date().toISOString(),
): SubTask[] =>
  subtasks.map(subtask => {
    if (subtask.id !== id) return subtask;
    const changed = Object.entries(updates).some(
      ([key, value]) => !Object.is(subtask[key as keyof SubTask], value),
    );
    if (!changed) return subtask;
    return { ...subtask, ...updates, createdAt: subtask.createdAt, updatedAt: now };
  });

// 子任务合并：标题相同覆盖（保留全量子任务 id 与创建时间，采用周视图的修改时间），多出来的新增
export const mergeSubtasks = (masterSubs: SubTask[], weekSubs: SubTask[]): SubTask[] => {
  const result = [...masterSubs];
  for (const weekSub of weekSubs) {
    const idx = result.findIndex(masterSub => masterSub.title === weekSub.title);
    if (idx >= 0) {
      result[idx] = {
        ...result[idx],
        title: weekSub.title,
        status: weekSub.status,
        progress: weekSub.progress,
        assignee: weekSub.assignee,
        createdAt: result[idx].createdAt,
        updatedAt: weekSub.updatedAt,
      };
    } else {
      result.push({ ...weekSub, id: createId() });
    }
  }
  return result;
};
