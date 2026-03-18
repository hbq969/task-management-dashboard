export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  tags: string[];
  status: TaskStatus;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

export interface FilterOptions {
  status: TaskStatus | 'all';
  priority: Priority | 'all';
  projectId: string | 'all';
  tags: string[];
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}