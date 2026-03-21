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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Plus, ArrowUpDown, Search, X, Database, FileText, Tag, Trash2, Flag } from 'lucide-react';
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
  const {
    filters,
    updateFilters,
    getFilteredTasks,
    selectedTaskIds,
    allTags,
    batchToggleTag,
    getSelectedTasksTagStatus,
    removeTagFromSelectedTasks,
    batchDelete,
  } = useTaskContext();
  const taskCount = getFilteredTasks().length;
  const [showTagInput, setShowTagInput] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [tagToRemove, setTagToRemove] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const tagInputRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭标签输入
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 确认对话框打开时不关闭面板
      if (removeConfirmOpen) return;
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
  }, [showTagInput, removeConfirmOpen]);

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
    const status = getSelectedTasksTagStatus(tag);
    if (status === 'all') {
      // 所有选中任务都有该标签，需要确认后移除
      setTagToRemove(tag);
      setRemoveConfirmOpen(true);
    } else {
      // 部分有或都没有，直接添加
      batchToggleTag(tag);
    }
  };

  const currentSort = `${filters.sortBy}-${filters.sortOrder}`;

  return (
    <TooltipProvider>
    <div className="border-b bg-background p-4">
      {/* 移除标签确认对话框 */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除标签？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将从所有选中的 {selectedTaskIds.length} 个任务中移除标签 "{tagToRemove}"。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (tagToRemove) {
                removeTagFromSelectedTasks(tagToRemove);
              }
              setRemoveConfirmOpen(false);
              setTagToRemove(null);
            }}>
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除选中的 {selectedTaskIds.length} 个任务，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                batchDelete();
                setDeleteConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="shrink-0">
            <h2 className="text-xl font-semibold whitespace-nowrap">任务列表</h2>
            <p className="text-sm text-muted-foreground mt-1">
              共 {taskCount} 个任务
            </p>
          </div>

          {/* 搜索框 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索任务..."
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

        <div className="flex items-center gap-2 shrink-0">
          {/* 批量操作 */}
          {selectedTaskIds.length > 0 && (
            <>
              <div className="relative" ref={tagInputRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowTagInput(!showTagInput)}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>打标签 ({selectedTaskIds.length})</TooltipContent>
                </Tooltip>
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>删除选中 ({selectedTaskIds.length})</TooltipContent>
              </Tooltip>
            </>
          )}

          {/* 优先级筛选 */}
          <Select
            value={filters.priority}
            onValueChange={value =>
              updateFilters({ priority: value as Priority | 'all' })
            }
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-auto min-w-[40px] h-9 px-2">
                  <Flag className="w-4 h-4" />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>优先级筛选</TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-auto min-w-[40px] h-9 px-2">
                  <ArrowUpDown className="w-4 h-4" />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>排序方式</TooltipContent>
            </Tooltip>
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
          <Button onClick={onCreateTask} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            创建任务
          </Button>

          {/* 数据管理 */}
          {onOpenDataManager && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenDataManager}>
                  <Database className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>数据管理</TooltipContent>
            </Tooltip>
          )}

          {/* 报告导出 */}
          {onOpenReportExport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenReportExport}>
                  <FileText className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>导出报告</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}