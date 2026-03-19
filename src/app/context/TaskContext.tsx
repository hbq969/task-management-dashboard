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
  // Data management
  exportData: () => string;
  importData: (data: string) => { success: boolean; message: string };
  // Report generation
  generateReport: (
    type: 'weekly' | 'monthly' | 'quarterly',
    startDate?: Date
  ) => string;
  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const defaultProjects: Project[] = [
  { id: '1', name: '工作项目', color: '#3b82f6', taskCount: 0 },
  { id: '2', name: '个人事务', color: '#8b5cf6', taskCount: 0 },
  { id: '3', name: '学习计划', color: '#10b981', taskCount: 0 },
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
      writeData({ tasks, projects, people });
    }
  }, [tasks, projects, people, isLoaded]);

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
    };
    setProjects(prev => [...prev, newProject]);
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
    const timeBounds = getTimeRangeBounds(filters.timeRange);
    if (timeBounds) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= timeBounds.start && taskDate <= timeBounds.end;
      });
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
    (type: 'weekly' | 'monthly' | 'quarterly', startDate?: Date): string => {
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
      const reportTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= reportStartDate && taskDate <= reportEndDate;
      });

      // Group by project
      const projectGroups = new Map<string, Task[]>();
      reportTasks.forEach(task => {
        const project = projects.find(p => p.id === task.projectId);
        const projectName = project?.name || '未分类';
        if (!projectGroups.has(projectName)) {
          projectGroups.set(projectName, []);
        }
        projectGroups.get(projectName)!.push(task);
      });

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

      projectGroups.forEach((projectTasks, projectName) => {
        report += `## ${projectName}\n\n`;

        projectTasks.forEach(task => {
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
          if (task.dueDate) {
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

  const allTags = useMemo(() =>
    Array.from(new Set(tasks.flatMap(task => task.tags))).sort(),
    [tasks]
  );

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