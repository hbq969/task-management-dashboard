export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface Person {
  id: string;
  name: string;
  company?: string;
  department?: string;
  group?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

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
  progress: number; // 0-100, default 0
  assigneeId?: string; // Person ID
  relatedPersonIds: string[]; // Related persons IDs
}

export interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

export type TimeRangeFilter =
  | 'all'
  | 'last1Day'
  | 'last3Days'
  | 'last1Week'
  | 'thisWeek'
  | 'thisMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export interface FilterOptions {
  status: TaskStatus | 'all';
  priority: Priority | 'all';
  projectId: string | 'all';
  tags: string[];
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  timeRange: TimeRangeFilter;
  searchQuery: string;
  customDateStart?: string; // ISO 日期字符串
  customDateEnd?: string;   // ISO 日期字符串
}

// Helper functions for time range filtering
export function getTimeRangeBounds(range: TimeRangeFilter): { start: Date; end: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'all':
      return null;

    case 'last1Day':
      return {
        start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last3Days':
      return {
        start: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last1Week':
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
      return { start: monday, end: sunday };
    }

    case 'thisMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: firstDay, end: lastDay };
    }

    case 'thisQuarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      return { start: firstDay, end: lastDay };
    }

    case 'thisYear': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { start: firstDay, end: lastDay };
    }

    default:
      return null;
  }
}