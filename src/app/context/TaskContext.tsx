import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Task,
  Project,
  FilterOptions,
  Person,
  getTimeRangeBounds,
} from '../types/task';
import { readData, writeData, migrateFromLocalStorage, StorageData } from '../services/storage';

interface TaskContextType {
  tasks: Task[];
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [predefinedTags, setPredefinedTags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    projectId: 'all',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
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
        const migratedTasks = data.tasks.map((task: Task) => ({
          ...task,
          progress: task.progress ?? 0,
          relatedPersonIds: task.relatedPersonIds ?? [],
        }));
        setTasks(migratedTasks);
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

  // 统一数据持久化
  useEffect(() => {
    if (isLoaded) {
      writeData({ tasks, projects, people, predefinedTags });
    }
  }, [tasks, projects, people, predefinedTags, isLoaded]);

  // Update project task counts when tasks change
  useEffect(() => {
    setProjects(prev =>
      prev.map(project => ({
        ...project,
        taskCount: tasks.filter(task => task.projectId === project.id).length,
      }))
    );
  }, [tasks]);

  // Task CRUD operations
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setSelectedTaskIds(prev => prev.filter(taskId => taskId !== id));
  }, []);

  // Project operations
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'taskCount'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
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
    // Delete project and its tasks
    setProjects(prev => prev.filter(project => project.id !== id));
    setTasks(prev => prev.filter(task => task.projectId !== id));
    // Clear project filter if deleted project was selected
    setFilters(prev => prev.projectId === id ? { ...prev, projectId: 'all' } : prev);
  }, []);

  // Filter operations
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const getFilteredTasks = useCallback(() => {
    let filtered = [...tasks];

    // Filter by status
    if (filters.status !== 'all') {
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
  }, [tasks, filters]);

  // People management
  const addPerson = useCallback((personData: Omit<Person, 'id' | 'createdAt'>) => {
    const newPerson: Person = {
      ...personData,
      id: Date.now().toString(),
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
    // Clear this person from tasks
    setTasks(prev =>
      prev.map(task => ({
        ...task,
        assigneeId: task.assigneeId === id ? undefined : task.assigneeId,
        relatedPersonIds: task.relatedPersonIds.filter(pid => pid !== id),
      }))
    );
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

  // Batch operations
  const batchUpdateStatus = useCallback(
    (status: Task['status']) => {
      setTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task
        )
      );
      clearSelection();
    },
    [selectedTaskIds, clearSelection]
  );

  const batchDelete = useCallback(() => {
    setTasks(prev => prev.filter(task => !selectedTaskIds.includes(task.id)));
    clearSelection();
  }, [selectedTaskIds, clearSelection]);

  const batchMoveProject = useCallback(
    (projectId: string) => {
      setTasks(prev =>
        prev.map(task =>
          selectedTaskIds.includes(task.id)
            ? { ...task, projectId, updatedAt: new Date().toISOString() }
            : task
        )
      );
      clearSelection();
    },
    [selectedTaskIds, clearSelection]
  );

  const batchAddTags = useCallback(
    (tags: string[]) => {
      setTasks(prev =>
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
    [selectedTaskIds, clearSelection]
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
      setTasks(prev =>
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
    [selectedTaskIds, getSelectedTasksTagStatus]
  );

  // Tag management
  const addPredefinedTag = useCallback((tag: string) => {
    setPredefinedTags(prev => {
      if (prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  }, []);

  const deleteTag = useCallback((tag: string) => {
    // 从任务中移除
    setTasks(prev =>
      prev.map(task => ({
        ...task,
        tags: task.tags.filter(t => t !== tag),
        updatedAt: new Date().toISOString(),
      }))
    );
    // 从预定义中移除
    setPredefinedTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Data import/export
  const exportData = useCallback(() => {
    const data = {
      tasks,
      projects,
      people,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }, [tasks, projects, people]);

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
        const migratedTasks = data.tasks.map((task: Task) => ({
          ...task,
          progress: task.progress ?? 0,
          relatedPersonIds: task.relatedPersonIds ?? [],
        }));

        setTasks(migratedTasks);
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
    (type: 'weekly' | 'monthly' | 'quarterly', startDate?: Date, filterTags?: string[]): string => {
      const now = startDate || new Date();
      let reportStartDate: Date;
      let reportEndDate: Date;

      switch (type) {
        case 'weekly':
          reportStartDate = new Date(now);
          reportStartDate.setDate(now.getDate() - 7);
          reportEndDate = now;
          break;
        case 'monthly':
          reportStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          reportEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3);
          reportStartDate = new Date(now.getFullYear(), quarter * 3, 1);
          reportEndDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
      }

      const formatDate = (date: Date) =>
        date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

      const typeLabels = {
        weekly: '周报',
        monthly: '月报',
        quarterly: '季报',
      };

      // Filter tasks by date range
      let reportTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= reportStartDate && taskDate <= reportEndDate;
      });

      // Filter by tags if specified
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
      let report = `# ${typeLabels[type]}\n\n`;
      report += `**时间范围**: ${formatDate(reportStartDate)} ~ ${formatDate(reportEndDate)}\n\n`;
      report += `**任务统计**: 共 ${reportTasks.length} 个任务\n\n`;

      const statusLabels = {
        todo: '待办',
        'in-progress': '进行中',
        completed: '已完成',
      };

      const priorityLabels = {
        urgent: '紧急',
        high: '高',
        medium: '中',
        low: '低',
      };

      const statusOrder = { completed: 0, 'in-progress': 1, todo: 2 };

      sortedProjectGroups.forEach(([projectName, { tasks: projectTasks }]) => {
        report += `## ${projectName}\n\n`;

        // 按状态排序：已完成 -> 进行中 -> 待办
        const sortedTasks = [...projectTasks].sort(
          (a, b) => statusOrder[a.status] - statusOrder[b.status]
        );

        sortedTasks.forEach(task => {
          const assignee = task.assigneeId
            ? people.find(p => p.id === task.assigneeId)?.name
            : undefined;

          report += `### ${task.title}\n`;
          report += `- 状态：${statusLabels[task.status]}\n`;
          if (assignee) {
            report += `- 负责人：${assignee}\n`;
          }
          if (task.progress > 0) {
            report += `- 进度：${task.progress}%\n`;
          }
          // 只有进行中和待办状态才显示截止时间
          if (task.dueDate && (task.status === 'in-progress' || task.status === 'todo')) {
            report += `- 截止日期：${formatDate(new Date(task.dueDate))}\n`;
          }
          if (task.priority !== 'medium') {
            report += `- 优先级：${priorityLabels[task.priority]}\n`;
          }
          if (task.notes) {
            report += `- 备注：${task.notes}\n`;
          }
          report += '\n';
        });
      });

      return report;
    },
    [tasks, projects, people]
  );

  const allTags = useMemo(() => {
    const taskTags = tasks.flatMap(task => task.tags);
    return Array.from(new Set([...predefinedTags, ...taskTags])).sort();
  }, [tasks, predefinedTags]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
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
        addPredefinedTag,
        deleteTag,
        exportData,
        importData,
        generateReport,
        setCurrentPage,
        setPageSize,
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