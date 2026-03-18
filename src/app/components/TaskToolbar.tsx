import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, ArrowUpDown } from 'lucide-react';
import type { Priority } from '../types/task';

interface TaskToolbarProps {
  onCreateTask: () => void;
}

export function TaskToolbar({ onCreateTask }: TaskToolbarProps) {
  const { filters, updateFilters, getFilteredTasks } = useTaskContext();
  const taskCount = getFilteredTasks().length;

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    updateFilters({
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  };

  const currentSort = `${filters.sortBy}-${filters.sortOrder}`;

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">任务列表</h2>
          <p className="text-sm text-muted-foreground mt-1">
            共 {taskCount} 个任务
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 优先级筛选 */}
          <Select
            value={filters.priority}
            onValueChange={value =>
              updateFilters({ priority: value as Priority | 'all' })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              <SelectItem value="high">高优先级</SelectItem>
              <SelectItem value="medium">中优先级</SelectItem>
              <SelectItem value="low">低优先级</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序 */}
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">最新创建</SelectItem>
              <SelectItem value="createdAt-asc">最早创建</SelectItem>
              <SelectItem value="dueDate-asc">截止日期 ↑</SelectItem>
              <SelectItem value="dueDate-desc">截止日期 ↓</SelectItem>
              <SelectItem value="priority-asc">优先级 ↑</SelectItem>
              <SelectItem value="priority-desc">优先级 ↓</SelectItem>
              <SelectItem value="title-asc">标题 A-Z</SelectItem>
              <SelectItem value="title-desc">标题 Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* 创建任务按钮 */}
          <Button onClick={onCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            创建任务
          </Button>
        </div>
      </div>
    </div>
  );
}