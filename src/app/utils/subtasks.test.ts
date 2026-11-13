import { describe, expect, test } from 'bun:test';
import type { SubTask } from '../types/task';
import {
  backfillSubtaskTimestamps,
  createSubtask,
  mergeSubtasks,
  updateSubtaskWithTimestamp,
} from './subtasks';

const PARENT_CREATED = '2026-01-01T00:00:00.000Z';
const PARENT_UPDATED = '2026-02-02T00:00:00.000Z';

const makeSubtask = (overrides: Partial<SubTask> = {}): SubTask => ({
  id: 's1',
  title: '子任务一',
  status: 'todo',
  progress: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

describe('backfillSubtaskTimestamps', () => {
  test('存量子任务缺时间字段时用父任务的时间补齐', () => {
    const legacy = [
      { id: 's1', title: '子任务一', status: 'todo', progress: 0 },
      { id: 's2', title: '子任务二', status: 'completed', progress: 100 },
    ] as unknown as SubTask[];

    const result = backfillSubtaskTimestamps(legacy, PARENT_CREATED, PARENT_UPDATED);

    expect(result.map(s => [s.id, s.createdAt, s.updatedAt])).toEqual([
      ['s1', PARENT_CREATED, PARENT_UPDATED],
      ['s2', PARENT_CREATED, PARENT_UPDATED],
    ]);
  });

  test('已有时间字段的子任务保持原值', () => {
    const subtasks = [
      makeSubtask({ id: 's1', createdAt: '2025-05-05T00:00:00.000Z', updatedAt: '2025-06-06T00:00:00.000Z' }),
    ];

    const result = backfillSubtaskTimestamps(subtasks, PARENT_CREATED, PARENT_UPDATED);

    expect(result[0].createdAt).toBe('2025-05-05T00:00:00.000Z');
    expect(result[0].updatedAt).toBe('2025-06-06T00:00:00.000Z');
  });

  test('没有子任务时返回空数组', () => {
    expect(backfillSubtaskTimestamps(undefined, PARENT_CREATED, PARENT_UPDATED)).toEqual([]);
  });
});

describe('createSubtask', () => {
  test('新建子任务同时写入创建时间与修改时间', () => {
    const now = '2026-03-03T00:00:00.000Z';

    const subtask = createSubtask('写测试', now);

    expect(subtask.title).toBe('写测试');
    expect(subtask.status).toBe('todo');
    expect(subtask.progress).toBe(0);
    expect(subtask.createdAt).toBe(now);
    expect(subtask.updatedAt).toBe(now);
    expect(subtask.id.length).toBeGreaterThan(0);
  });
});

describe('updateSubtaskWithTimestamp', () => {
  const NOW = '2026-04-04T00:00:00.000Z';

  test('修改子任务时刷新修改时间、保留创建时间', () => {
    const subtasks = [makeSubtask({ id: 's1' }), makeSubtask({ id: 's2', title: '子任务二' })];

    const result = updateSubtaskWithTimestamp(subtasks, 's1', { status: 'completed', progress: 100 }, NOW);

    expect(result[0].status).toBe('completed');
    expect(result[0].progress).toBe(100);
    expect(result[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].updatedAt).toBe(NOW);
  });

  test('只影响被修改的子任务，其他子任务时间不变', () => {
    const subtasks = [makeSubtask({ id: 's1' }), makeSubtask({ id: 's2', title: '子任务二' })];

    const result = updateSubtaskWithTimestamp(subtasks, 's1', { progress: 50 }, NOW);

    expect(result[1]).toEqual(subtasks[1]);
  });

  test('字段值没有实际变化时不刷新修改时间', () => {
    const subtasks = [makeSubtask({ id: 's1', progress: 30 })];

    const result = updateSubtaskWithTimestamp(subtasks, 's1', { progress: 30 }, NOW);

    expect(result[0].updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  test('不修改传入的原子任务列表', () => {
    const subtasks = [makeSubtask({ id: 's1', status: 'todo' })];

    updateSubtaskWithTimestamp(subtasks, 's1', { status: 'completed' }, NOW);

    expect(subtasks[0].status).toBe('todo');
    expect(subtasks[0].updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });
});

describe('mergeSubtasks', () => {
  const WEEK_NOW = '2026-05-05T00:00:00.000Z';

  test('标题相同时保留全量子任务的创建时间，采用周视图的修改时间', () => {
    const master = [makeSubtask({ id: 'master-1', title: '写方案' })];
    const week = [
      makeSubtask({ id: 'week-1', title: '写方案', status: 'completed', progress: 100, updatedAt: WEEK_NOW }),
    ];

    const result = mergeSubtasks(master, week);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('master-1');
    expect(result[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].updatedAt).toBe(WEEK_NOW);
    expect(result[0].status).toBe('completed');
  });

  test('全量里没有的子任务按新增并入，保留其时间字段', () => {
    const week = [makeSubtask({ id: 'week-1', title: '周视图新增', updatedAt: WEEK_NOW })];

    const result = mergeSubtasks([], week);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('周视图新增');
    expect(result[0].id).not.toBe('week-1');
    expect(result[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].updatedAt).toBe(WEEK_NOW);
  });

  test('全量独有的子任务原样保留', () => {
    const master = [makeSubtask({ id: 'master-1', title: '只在全量' })];

    const result = mergeSubtasks(master, []);

    expect(result).toEqual(master);
  });
});
