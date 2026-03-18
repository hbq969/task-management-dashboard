import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project, FilterOptions } from '../types/task';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  filters: FilterOptions;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'taskCount'>) => void;
  updateFilters: (filters: Partial<FilterOptions>) => void;
  getFilteredTasks: () => Task[];
  allTags: string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const STORAGE_KEY = 'todo-tasks';
const PROJECTS_KEY = 'todo-projects';

const defaultProjects: Project[] = [
  { id: '1', name: '工作项目', color: '#3b82f6', taskCount: 0 },
  { id: '2', name: '个人事务', color: '#8b5cf6', taskCount: 0 },
  { id: '3', name: '学习计划', color: '#10b981', taskCount: 0 },
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
    },
  ];
};

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // 首次访问时提供示例数据
    const sampleTasks = getSampleTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTasks));
    return sampleTasks;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : defaultProjects;
  });

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    projectId: 'all',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateProjectTaskCounts();
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);

  const updateProjectTaskCounts = () => {
    setProjects(prev =>
      prev.map(project => ({
        ...project,
        taskCount: tasks.filter(task => task.projectId === project.id).length,
      }))
    );
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const addProject = (projectData: Omit<Project, 'id' | 'taskCount'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      taskCount: 0,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getFilteredTasks = () => {
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
          const priorityOrder = { high: 0, medium: 1, low: 2 };
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
  };

  const allTags = Array.from(
    new Set(tasks.flatMap(task => task.tags))
  ).sort();

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        filters,
        addTask,
        updateTask,
        deleteTask,
        addProject,
        updateFilters,
        getFilteredTasks,
        allTags,
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