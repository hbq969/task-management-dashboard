import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, ArrowUpDown, Search, X, Database, FileText, Tag } from 'lucide-react';
import type { Priority } from '../types/task';
import { useState, useRef, useEffect } from 'react';

interface TaskToolbarProps {
  onCreateTask: () => void;
  onOpenDataManager?: () => void;
  onOpenReportExport?: () => void;
}

export function TaskToolbar({
  onCreateTask,
  onOpenDataManager,
  onOpenReportExport,
}: TaskToolbarProps) {
  const { filters, updateFilters, getFilteredTasks, selectedTaskIds, allTags, batchToggleTag, getSelectedTasksTagStatus } = useTaskContext();
  const taskCount = getFilteredTasks().length;
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭标签输入
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        setShowTagInput(false);
      }
    };
    if (showTagInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagInput]);

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    updateFilters({
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  };

  const handleSearchChange = (value: string) => {
    updateFilters({ searchQuery: value });
  };

  const clearSearch = () => {
    updateFilters({ searchQuery: '' });
  };

  // 点击标签即时切换
  const handleTagClick = (tag: string) => {
    batchToggleTag(tag);
  };

  const currentSort = `${filters.sortBy}-${filters.sortOrder}`;

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h2 className="text-xl font-semibold">任务列表</h2>
            <p className="text-sm text-muted-foreground mt-1">
              共 {taskCount} 个任务
            </p>
          </div>

          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索任务标题或描述..."
              value={filters.searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {filters.searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 批量操作 */}
          {selectedTaskIds.length > 0 && (
            <div className="relative" ref={tagInputRef}>
              <Button
                variant="outline"
                onClick={() => setShowTagInput(!showTagInput)}
              >
                <Tag className="w-4 h-4 mr-2" />
                打标签 ({selectedTaskIds.length})
              </Button>
              {showTagInput && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-background border rounded-lg shadow-lg p-3 z-50">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">选择标签（点击切换）</p>
                    {allTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {allTags.map(tag => {
                          const status = getSelectedTasksTagStatus(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagClick(tag)}
                              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                status === 'all'
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : status === 'some'
                                  ? 'bg-primary/50 text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无标签</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
              <SelectItem value="urgent">紧急</SelectItem>
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

          {/* 数据管理 */}
          {onOpenDataManager && (
            <Button variant="outline" onClick={onOpenDataManager}>
              <Database className="w-4 h-4 mr-2" />
              数据管理
            </Button>
          )}

          {/* 报告导出 */}
          {onOpenReportExport && (
            <Button variant="outline" onClick={onOpenReportExport}>
              <FileText className="w-4 h-4 mr-2" />
              导出报告
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}