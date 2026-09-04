import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Task,
  Project,
  FilterOptions,
  Person,
  getTimeRangeBounds,
  TaskStatus,
  SubTask,
  ViewMode,
} from '../types/task';
import { statusLabels } from '../constants/taskLabels';
import { readData, writeData, migrateFromLocalStorage, StorageData } from '../services/storage';

interface TaskContextType {
  tasks: Task[];
  weekTasks: Task[];
  activeTasks: Task[];
  weekSourceTaskIds: ReadonlySet<string>; // 已在周视图的全量任务 ID 集合
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  projects: Project[];
  people: Person[];
  filters: FilterOptions;
  selectedTaskIds: string[];
  currentPage: number;
  pageSize: number;
  isLoaded: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'taskCount'>) => void;
  deleteProject: (id: string) => void;
  updateFilters: (filters: Partial<FilterOptions>) => void;
  getFilteredTasks: () => Task[];
  allTags: string[];
  // People management
  addPerson: (person: Omit<Person, 'id' | 'createdAt'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  // Selection
  toggleTaskSelection: (id: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  // Batch operations
  batchUpdateStatus: (status: Task['status']) => void;
  batchDelete: () => void;
  batchMoveProject: (projectId: string) => void;
  batchAddTags: (tags: string[]) => void;
  batchToggleTag: (tag: string) => void;
  getSelectedTasksTagStatus: (tag: string) => 'all' | 'some' | 'none';
  removeTagFromSelectedTasks: (tag: string) => void;
  // Project operations
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'taskCount'>>) => void;
  // Tag management
  addPredefinedTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
  // Data management
  exportData: () => string;
  importData: (data: string) => { success: boolean; message: string };
  // Report generation
  generateReport: (
    type: 'weekly' | 'monthly' | 'quarterly',
    startDate?: Date,
    filterTags?: string[]
  ) => string;
  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  // Weekly view
  addToWeekTasks: (taskIds: string[]) => { added: number; skipped: number };
  mergeWeekToAll: () => { updated: number; added: number };
  clearWeekTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const defaultProjects: Project[] = [
  { id: '1', name: '工作项目', color: '#3b82f6', taskCount: 0, order: 0 },
  { id: '2', name: '个人事务', color: '#8b5cf6', taskCount: 0, order: 1 },
  { id: '3', name: '学习计划', color: '#10b981', taskCount: 0, order: 2 },
];

const defaultPeople: Person[] = [
  {
    id: '1',
    name: '张三',
    company: '示例公司',
    department: '研发部',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '李四',
    company: '示例公司',
    department: '产品部',
    createdAt: new Date().toISOString(),
  },
];

const getSampleTasks = (): Task[] => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      id: '1',
      title: '完成项目方案设计',
      description: '需要设计新产品的整体架构方案，包括技术选型和系统设计',
      dueDate: tomorrow.toISOString(),
      priority: 'high',
      tags: ['设计', '重要'],
      status: 'in-progress',
      projectId: '1',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '已完成技术选型部分，正在进行系统架构设计',
      progress: 70,
      assigneeId: '1',
      relatedPersonIds: ['2'],
    },
    {
      id: '2',
      title: '准备周会汇报材料',
      description: '整理本周工作进展，准备周会汇报PPT',
      dueDate: nextWeek.toISOString(),
      priority: 'medium',
      tags: ['会议'],
      status: 'todo',
      projectId: '1',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
      progress: 0,
      assigneeId: undefined,
      relatedPersonIds: [],
    },
    {
      id: '3',
      title: '学习 React 新特性',
      description: '深入了解 React 19 的新特性和最佳实践',
      dueDate: null,
      priority: 'low',
      tags: ['学习', '前端'],
      status: 'todo',
      projectId: '3',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
      progress: 20,
      assigneeId: undefined,
      relatedPersonIds: [],
    },
  ];
};

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [viewMode, setViewModeState] = useState<ViewMode>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [predefinedTags, setPredefinedTags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    projectId: 'all',
    tags: [],
    sortBy: 'priority',
    sortOrder: 'asc',
    timeRange: 'all',
    searchQuery: '',
  });

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);

  // 初始化数据加载
  useEffect(() => {
    const loadData = async () => {
      // 首先尝试从文件读取数据
      let data = await readData();

      if (!data) {
        // 如果文件没有数据，尝试从 localStorage 迁移
        data = await migrateFromLocalStorage();
      }

      if (data) {
        // 迁移旧任务字段
        const migrateTask = (task: Task): Task => ({
          ...task,
          progress: task.progress ?? 0,
          relatedPersonIds: task.relatedPersonIds ?? [],
          subtasks: task.subtasks ?? [],
        });
        const migratedTasks = data.tasks.map(migrateTask);
        setTasks(migratedTasks);
        setWeekTasks((data.weekTasks ?? []).map(migrateTask));
        setProjects(data.projects);
        setPeople(data.people);
        setPredefinedTags(data.predefinedTags ?? []);
      } else {
        // 首次启动：加载示例数据
        const sampleTasks = getSampleTasks();
        setTasks(sampleTasks);
        setProjects(defaultProjects);
        setPeople(defaultPeople);

        // 保存初始数据
        await writeData({
          tasks: sampleTasks,
          projects: defaultProjects,
          people: defaultPeople,
        });
      }

      setIsLoaded(true);
    };

    loadData();
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  // 视图切换时重置分页和选择
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setCurrentPage(1);
    setSelectedTaskIds([]);
  }, []);

  // 当前视图的任务列表与 setter
  const activeTasks = viewMode === 'week' ? weekTasks : tasks;
  const setActiveTasks = viewMode === 'week' ? setWeekTasks : setTasks;

  // 统一数据持久化
  useEffect(() => {
    if (isLoaded) {
      writeData({ tasks, projects, people, predefinedTags, weekTasks });
    }
  }, [tasks, projects, people, predefinedTags, weekTasks, isLoaded]);

  // Update project task counts when tasks change
  useEffect(() => {
    setProjects(prev =>
      prev.map(project => ({
        ...project,
        taskCount: tasks.filter(task => task.projectId === project.id).length,
      }))
    );
  }, [tasks]);

  // Task CRUD operations（作用于当前视图列表：全量或周视图）
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveTasks(prev => [newTask, ...prev]);
  }, [viewMode]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setActiveTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  }, [viewMode]);

  const deleteTask = useCallback((id: string) => {
    setActiveTasks(prev => prev.filter(task => task.id !== id));
    setSelectedTaskIds(prev => prev.filter(taskId => taskId !== id));
  }, [viewMode]);

  // Project operations
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'taskCount'>) => {
    const newProject: Project = {
      ...projectData,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      taskCount: 0,
      order: projectData.order ?? 0,
    };
    setProjects(prev => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'taskCount'>>) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    // Delete project and its tasks（全量与周视图都清理）
    setProjects(prev => prev.filter(project => project.id !== id));
    setTasks(prev => prev.filter(task => task.projectId !== id));
    setWeekTasks(prev => prev.filter(task => task.projectId !== id));
    // Clear project filter if deleted project was selected
    setFilters(prev => prev.projectId === id ? { ...prev, projectId: 'all' } : prev);
  }, []);

  // Filter operations
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const getFilteredTasks = useCallback(() => {
    let filtered = [...activeTasks];

    // Filter by status
    if (filters.status === 'incomplete') {
      filtered = filtered.filter(task => task.status !== 'completed' && task.status !== 'shelved' && task.status !== 'transferred');
    } else if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Filter by project
    if (filters.projectId !== 'all') {
      filtered = filtered.filter(task => task.projectId === filters.projectId);
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task =>
        filters.tags.some(tag => task.tags.includes(tag))
      );
    }

    // Filter by time range
    if (filters.timeRange === 'custom' && filters.customDateStart && filters.customDateEnd) {
      const startDate = new Date(filters.customDateStart);
      const endDate = new Date(filters.customDateEnd);
      endDate.setHours(23, 59, 59, 999); // 设置为当天的最后一刻
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= startDate && taskDate <= endDate;
      });
    } else {
      const timeBounds = getTimeRangeBounds(filters.timeRange);
      if (timeBounds) {
        filtered = filtered.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= timeBounds.start && taskDate <= timeBounds.end;
        });
      }
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [activeTasks, filters]);

  // People management
  const addPerson = useCallback((personData: Omit<Person, 'id' | 'createdAt'>) => {
    const newPerson: Person = {
      ...personData,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setPeople(prev => [...prev, newPerson]);
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    setPeople(prev =>
      prev.map(person => (person.id === id ? { ...person, ...updates } : person))
    );
  }, []);

  const deletePerson = useCallback((id: string) => {
    setPeople(prev => prev.filter(person => person.id !== id));
    // Clear this person from tasks（全量与周视图都清理）
    const clearPerson = (prev: Task[]) =>
      prev.map(task => ({
        ...task,
        assigneeId: task.assigneeId === id ? undefined : task.assigneeId,
        relatedPersonIds: task.relatedPersonIds.filter(pid => pid !== id),
      }));
    setTasks(clearPerson);
    setWeekTasks(clearPerson);
  }, []);

  // Selection operations
  const toggleTaskSelection = useCallback((id: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  }, []);

  const selectAllTasks = useCallback(() => {
    const filtered = getFilteredTasks();
    setSelectedTaskIds(filtered.map(task => task.id));
  }, [getFilteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedTaskIds([]);
  }, []);

  // Batch operations（作用于当前视图列表）
  const batchUpdateStatus = useCallback(
    (status: Task['status']) => {
      setActiveTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task
        )
      );
      clearSelection();
    },
    [selectedTaskIds, clearSelection, viewMode]
  );

  const batchDelete = useCallback(() => {
    setActiveTasks(prev => prev.filter(task => !selectedTaskIds.includes(task.id)));
    clearSelection();
  }, [selectedTaskIds, clearSelection, viewMode]);

  const batchMoveProject = useCallback(
    (projectId: string) => {
      setActiveTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? { ...task, projectId, updatedAt: new Date().toISOString() }
            : task
        )
      );
      clearSelection();
    },
    [selectedTaskIds, clearSelection, viewMode]
  );

  const batchAddTags = useCallback(
    (tags: string[]) => {
      setActiveTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? {
                ...task,
                tags: [...new Set([...task.tags, ...tags])],
                updatedAt: new Date().toISOString(),
              }
            : task
        )
      );
      clearSelection();
    },
    [selectedTaskIds, clearSelection, viewMode]
  );

  // 获取选中任务的标签状态：'all'=全部都有, 'some'=部分有, 'none'=都没有
  const getSelectedTasksTagStatus = useCallback(
    (tag: string): 'all' | 'some' | 'none' => {
      if (selectedTaskIds.length === 0) return 'none';
      const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));
      const tasksWithTag = selectedTasks.filter(task => task.tags.includes(tag));
      if (tasksWithTag.length === selectedTasks.length) return 'all';
      if (tasksWithTag.length === 0) return 'none';
      return 'some';
    },
    [tasks, selectedTaskIds]
  );

  // 切换标签：如果所有选中任务都有该标签则移除，否则添加
  const batchToggleTag = useCallback(
    (tag: string) => {
      const status = getSelectedTasksTagStatus(tag);
      setActiveTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? {
                ...task,
                tags: status === 'all'
                  ? task.tags.filter(t => t !== tag)
                  : [...new Set([...task.tags, tag])],
                updatedAt: new Date().toISOString(),
              }
            : task
        )
      );
      // 不清除选择，允许继续操作
    },
    [selectedTaskIds, getSelectedTasksTagStatus, viewMode]
  );

  // 直接从选中任务中移除标签（不检查状态，用于确认对话框）
  const removeTagFromSelectedTasks = useCallback(
    (tag: string) => {
      setActiveTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? {
                ...task,
                tags: task.tags.filter(t => t !== tag),
                updatedAt: new Date().toISOString(),
              }
            : task
        )
      );
      // 确保标签保留在预定义列表中，即使没有任务使用也不会消失
      setPredefinedTags(prev => {
        if (!prev.includes(tag)) {
          return [...prev, tag];
        }
        return prev;
      });
    },
    [selectedTaskIds, viewMode]
  );

  // Tag management
  const addPredefinedTag = useCallback((tag: string) => {
    setPredefinedTags(prev => {
      if (prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  }, []);

  const deleteTag = useCallback((tag: string) => {
    // 从任务中移除（全量与周视图都清理）
    const removeTag = (prev: Task[]) =>
      prev.map(task => ({
        ...task,
        tags: task.tags.filter(t => t !== tag),
        updatedAt: new Date().toISOString(),
      }));
    setTasks(removeTag);
    setWeekTasks(removeTag);
    // 从预定义中移除
    setPredefinedTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Data import/export
  const exportData = useCallback(() => {
    const data = {
      tasks,
      projects,
      people,
      weekTasks,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }, [tasks, projects, people, weekTasks]);

  const importData = useCallback(
    (dataString: string): { success: boolean; message: string } => {
      try {
        const data = JSON.parse(dataString);
        if (!data.tasks || !Array.isArray(data.tasks)) {
          return { success: false, message: '无效的数据格式：缺少任务列表' };
        }
        if (!data.projects || !Array.isArray(data.projects)) {
          return { success: false, message: '无效的数据格式：缺少项目列表' };
        }

        // Migrate tasks to include new fields
        const migrateTask = (task: Task): Task => ({
          ...task,
          progress: task.progress ?? 0,
          relatedPersonIds: task.relatedPersonIds ?? [],
          subtasks: task.subtasks ?? [],
        });
        const migratedTasks = data.tasks.map(migrateTask);

        setTasks(migratedTasks);
        setWeekTasks((data.weekTasks ?? []).map(migrateTask));
        setProjects(data.projects);
        if (data.people && Array.isArray(data.people)) {
          setPeople(data.people);
        }
        return { success: true, message: `成功导入 ${data.tasks.length} 个任务` };
      } catch {
        return { success: false, message: '解析数据失败，请检查JSON格式' };
      }
    },
    []
  );

  // Report generation
  const generateReport = useCallback(
    (_type: 'weekly' | 'monthly' | 'quarterly', _startDate?: Date, filterTags?: string[]): string => {
      const formatDate = (date: Date) =>
        date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

      // 周报告直接使用周视图任务，月/季报告使用全量任务
      // Filter by tags if specified (no time filtering)
      let reportTasks = _type === 'weekly' ? weekTasks : tasks;
      if (filterTags && filterTags.length > 0) {
        reportTasks = reportTasks.filter(task =>
          filterTags.some(tag => task.tags.includes(tag))
        );
      }

      // Group by project and sort by project order
      const projectGroups = new Map<string, { tasks: Task[]; order: number }>();
      reportTasks.forEach(task => {
        const project = projects.find(p => p.id === task.projectId);
        const projectName = project?.name || '未分类';
        const projectOrder = project?.order ?? 0;
        if (!projectGroups.has(projectName)) {
          projectGroups.set(projectName, { tasks: [], order: projectOrder });
        }
        projectGroups.get(projectName)!.tasks.push(task);
      });

      // Sort project groups by order
      const sortedProjectGroups = [...projectGroups.entries()].sort(
        (a, b) => a[1].order - b[1].order
      );

      // Build report
      let report = `# 任务报告\n\n`;
      report += `**任务统计**: 共 ${reportTasks.length} 个任务\n\n`;

      const priorityLabels = {
        urgent: '紧急',
        high: '高',
        medium: '中',
        low: '低',
      };

      // 状态排序顺序（按显示顺序）
      const statusOrderList: TaskStatus[] = [
        'shelved', 'transferred',
        'todo', 'pending-apply', 'review', 'researching', 'in-progress', 'daily', 'processing',
        'investigating', 'fixing', 'in-flow', 'designing', 'developing',
        'testing', 'pending-change', 'completed'
      ];
      const statusOrderMap = Object.fromEntries(statusOrderList.map((s, i) => [s, i]));

      sortedProjectGroups.forEach(([projectName, { tasks: projectTasks }]) => {
        report += `## ${projectName}\n\n`;

        // 已完成 → 有进度（降序） → 无进度
        const sortedTasks = [...projectTasks].sort((a, b) => {
          // 1. 已完成优先
          const aCompleted = a.status === 'completed' ? 0 : 1;
          const bCompleted = b.status === 'completed' ? 0 : 1;
          if (aCompleted !== bCompleted) return aCompleted - bCompleted;
          // 2. 有进度的排在无进度前面
          const aHasProgress = a.progress > 0 ? 0 : 1;
          const bHasProgress = b.progress > 0 ? 0 : 1;
          if (aHasProgress !== bHasProgress) return aHasProgress - bHasProgress;
          // 3. 按进度降序
          if (a.progress !== b.progress) return b.progress - a.progress;
          // 4. 同进度按状态排序
          const aOrder = statusOrderMap[a.status] ?? 99;
          const bOrder = statusOrderMap[b.status] ?? 99;
          return aOrder - bOrder;
        });

        sortedTasks.forEach(task => {
          const assignee = task.assigneeId
            ? people.find(p => p.id === task.assigneeId)?.name
            : undefined;

          report += `### ${task.title}\n`;
          report += `- 状态：${statusLabels[task.status]}\n`;
          if (assignee) {
            report += `- 负责人：${assignee}\n`;
          }
          if (task.progress > 0 && task.status !== 'daily') {
            report += `- 进度：${task.progress}%\n`;
          }
          // 未结束的任务显示截止时间
          if (task.dueDate && task.status !== 'completed') {
            report += `- 截止日期：${formatDate(new Date(task.dueDate))}\n`;
          }
          if (task.priority !== 'medium') {
            report += `- 优先级：${priorityLabels[task.priority]}\n`;
          }
          if (task.notes) {
            report += `- 备注：${task.notes}\n`;
          }
          // 子任务（排序：已完成 → 有进度降序 → 无进度 → 按状态顺序）
          if (task.subtasks && task.subtasks.length > 0) {
            const sortedSubtasks = [...task.subtasks].sort((a, b) => {
              const aDone = a.status === 'completed' ? 0 : 1;
              const bDone = b.status === 'completed' ? 0 : 1;
              if (aDone !== bDone) return aDone - bDone;
              const aHas = a.progress > 0 ? 0 : 1;
              const bHas = b.progress > 0 ? 0 : 1;
              if (aHas !== bHas) return aHas - bHas;
              if (a.progress !== b.progress) return b.progress - a.progress;
              const aOrder = statusOrderMap[a.status] ?? 99;
              const bOrder = statusOrderMap[b.status] ?? 99;
              return aOrder - bOrder;
            });
            const circles = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
            sortedSubtasks.forEach((sub, i) => {
              const num = i < 20 ? circles[i] : `(${i + 1})`;
              let subLine = `  ${num} ${sub.title}（${statusLabels[sub.status]}`;
              if (sub.progress > 0 && sub.status !== 'daily') subLine += `，${sub.progress}%`;
              if (sub.assignee) subLine += `，${sub.assignee}`;
              subLine += '）';
              report += subLine + '\n';
            });
          }
          report += '\n';
        });
      });

      return report;
    },
    [tasks, weekTasks, projects, people]
  );

  const allTags = useMemo(() => {
    const taskTags = [...tasks, ...weekTasks].flatMap(task => task.tags);
    return Array.from(new Set([...predefinedTags, ...taskTags])).sort();
  }, [tasks, weekTasks, predefinedTags]);

  // 从全量任务中勾选一组，拷贝创建为周工作待办
  const addToWeekTasks = useCallback(
    (taskIds: string[]): { added: number; skipped: number } => {
      let added = 0;
      let skipped = 0;
      const next = [...weekTasks];
      for (const id of taskIds) {
        const master = tasks.find(t => t.id === id);
        if (!master) {
          skipped++;
          continue;
        }
        // 已存在的周视图任务（同一来源）跳过，避免重复
        if (next.some(t => t.sourceTaskId === id)) {
          skipped++;
          continue;
        }
        const copy: Task = {
          ...master,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          sourceTaskId: id,
          subtasks: (master.subtasks ?? []).map(s => ({
            ...s,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          })),
          updatedAt: new Date().toISOString(),
        };
        next.push(copy);
        added++;
      }
      setWeekTasks(next);
      return { added, skipped };
    },
    [tasks, weekTasks]
  );

  // 子任务合并：标题相同覆盖，多出来的新增，全量有而周视图没有的保留
  const mergeSubtasks = useCallback((masterSubs: SubTask[], weekSubs: SubTask[]): SubTask[] => {
    const result = [...masterSubs];
    for (const ws of weekSubs) {
      const idx = result.findIndex(ms => ms.title === ws.title);
      if (idx >= 0) {
        // 标题相同 → 覆盖（保留全量子任务 id）
        result[idx] = {
          ...result[idx],
          title: ws.title,
          status: ws.status,
          progress: ws.progress,
          assignee: ws.assignee,
        };
      } else {
        // 多出来的 → 新增
        result.push({
          ...ws,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        });
      }
    }
    return result;
  }, []);

  // 周视图更新进全量任务列表
  const mergeWeekToAll = useCallback((): { updated: number; added: number } => {
    let updated = 0;
    let added = 0;
    let newTasks = [...tasks];
    let newWeekTasks = [...weekTasks];

    for (const wt of weekTasks) {
      const existing = newTasks.find(t => wt.sourceTaskId && t.id === wt.sourceTaskId);
      if (existing) {
        newTasks = newTasks.map(t =>
          t.id === existing.id
            ? {
                ...t,
                title: wt.title,
                description: wt.description,
                dueDate: wt.dueDate,
                priority: wt.priority,
                tags: wt.tags,
                status: wt.status,
                projectId: wt.projectId,
                progress: wt.progress,
                notes: wt.notes,
                assigneeId: wt.assigneeId,
                relatedPersonIds: wt.relatedPersonIds,
                exportDescription: wt.exportDescription,
                subtasks: mergeSubtasks(t.subtasks ?? [], wt.subtasks ?? []),
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        updated++;
      } else {
        // 新增到全量：sourceTaskId 指向自身 id，避免再次合并时重复新增
        const newTask: Task = {
          ...wt,
          sourceTaskId: wt.id,
          updatedAt: new Date().toISOString(),
        };
        newTasks = [newTask, ...newTasks];
        newWeekTasks = newWeekTasks.map(t =>
          t.id === wt.id ? { ...t, sourceTaskId: wt.id } : t
        );
        added++;
      }
    }

    setTasks(newTasks);
    setWeekTasks(newWeekTasks);
    return { updated, added };
  }, [tasks, weekTasks, mergeSubtasks]);

  const clearWeekTasks = useCallback(() => {
    setWeekTasks([]);
  }, []);

  // 已在周视图的全量任务 ID 集合（由周视图任务的 sourceTaskId 推导）
  const weekSourceTaskIds = useMemo(
    () => new Set(weekTasks.map(t => t.sourceTaskId).filter((id): id is string => !!id)),
    [weekTasks]
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        weekTasks,
        activeTasks,
        weekSourceTaskIds,
        viewMode,
        setViewMode,
        projects,
        people,
        filters,
        selectedTaskIds,
        currentPage,
        pageSize,
        isLoaded,
        addTask,
        updateTask,
        deleteTask,
        addProject,
        deleteProject,
        updateProject,
        updateFilters,
        getFilteredTasks,
        allTags,
        addPerson,
        updatePerson,
        deletePerson,
        toggleTaskSelection,
        selectAllTasks,
        clearSelection,
        batchUpdateStatus,
        batchDelete,
        batchMoveProject,
        batchAddTags,
        batchToggleTag,
        getSelectedTasksTagStatus,
        removeTagFromSelectedTasks,
        addPredefinedTag,
        deleteTag,
        exportData,
        importData,
        generateReport,
        setCurrentPage,
        setPageSize,
        addToWeekTasks,
        mergeWeekToAll,
        clearWeekTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
}