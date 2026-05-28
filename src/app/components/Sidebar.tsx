import { useMemo, useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  ListTodo,
  Clock,
  BookOpen,
  CheckCircle2,
  Folder,
  Tag,
  Plus,
  Circle,
  Users,
  Calendar as CalendarIcon,
  MoreVertical,
  Trash2,
  X,
  Pencil,
  Hourglass,
  Eye,
  Loader2,
  Activity,
  Search,
  Wrench,
  GitBranch,
  Palette,
  Code,
  FlaskConical,
  RefreshCw,
  CircleDot,
  CircleDashed,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TaskStatus, TimeRangeFilter, Project } from '../types/task';
import { statusLabels, timeRangeLabels, filterStatusLabels } from '../constants/taskLabels';
import { ProjectDialog } from './ProjectDialog';

// 状态图标映射
const statusIcons: Record<TaskStatus, React.ElementType> = {
  todo: CircleDashed,
  'pending-apply': Hourglass,
  review: Eye,
  researching: BookOpen,
  'in-progress': Loader2,
  processing: Activity,
  investigating: Search,
  fixing: Wrench,
  'in-flow': GitBranch,
  designing: Palette,
  developing: Code,
  testing: FlaskConical,
  'pending-change': RefreshCw,
  completed: CheckCircle2,
};

// 状态图标颜色映射
const statusIconColors: Record<TaskStatus, string> = {
  todo: 'text-slate-400',
  'pending-apply': 'text-slate-400',
  review: 'text-blue-500',
  researching: 'text-cyan-500',
  'in-progress': 'text-blue-500',
  processing: 'text-sky-500',
  investigating: 'text-amber-500',
  fixing: 'text-red-500',
  'in-flow': 'text-indigo-500',
  designing: 'text-purple-500',
  developing: 'text-indigo-500',
  testing: 'text-teal-500',
  'pending-change': 'text-orange-500',
  completed: 'text-green-500',
};

interface SidebarProps {
  onCreateProject: () => void;
  onOpenPersonManager: () => void;
}

export function Sidebar({ onCreateProject, onOpenPersonManager }: SidebarProps) {
  const { tasks, projects, filters, updateFilters, allTags, people, deleteProject, addPredefinedTag, deleteTag } = useTaskContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    (Object.keys(statusLabels) as TaskStatus[]).forEach(key => {
      counts[key] = tasks.filter(t => t.status === key).length;
    });
    // 添加"未完成"计数（排除已完成）
    counts.incomplete = tasks.filter(t => t.status !== 'completed').length;
    return counts;
  }, [tasks]);

  const handleStatusFilter = (status: TaskStatus | 'all' | 'incomplete') => {
    updateFilters({ status });
  };

  const handleProjectFilter = (projectId: string) => {
    updateFilters({ projectId });
  };

  const handleTagFilter = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleEditClick = (project: Project) => {
    setProjectToEdit(project);
    setEditProjectDialogOpen(true);
  };

  const handleAddTag = () => {
    setNewTagName('');
    setAddTagDialogOpen(true);
  };

  const handleAddTagConfirm = () => {
    const trimmedName = newTagName.trim();
    if (trimmedName && !allTags.includes(trimmedName)) {
      addPredefinedTag(trimmedName);
    }
    setAddTagDialogOpen(false);
    setNewTagName('');
  };

  const handleDeleteTagClick = (tag: string) => {
    setTagToDelete(tag);
    setDeleteTagDialogOpen(true);
  };

  const handleDeleteTagConfirm = () => {
    if (tagToDelete) {
      deleteTag(tagToDelete);
      // 如果当前筛选包含被删除的标签，清除该筛选
      if (filters.tags.includes(tagToDelete)) {
        updateFilters({ tags: filters.tags.filter(t => t !== tagToDelete) });
      }
      setDeleteTagDialogOpen(false);
      setTagToDelete(null);
    }
  };

  return (
    <>
      <div className="w-64 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-4 border-b h-16">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          任务管理
        </h1>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* 状态筛选 - 紧凑网格布局 */}
          <div>
            <h2 className="text-xs font-medium mb-3 text-muted-foreground">状态</h2>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant={filters.status === 'all' ? 'secondary' : 'ghost'}
                className="grid grid-cols-[20px_1fr_28px] items-center h-8 text-xs w-full"
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                <Circle className="w-3.5 h-3.5 justify-self-center text-muted-foreground" />
                <span className="text-left">{filterStatusLabels.all}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1 justify-self-center">
                  {statusCounts.all}
                </Badge>
              </Button>
              <Button
                variant={filters.status === 'incomplete' ? 'secondary' : 'ghost'}
                className="grid grid-cols-[20px_1fr_28px] items-center h-8 text-xs w-full"
                size="sm"
                onClick={() => handleStatusFilter('incomplete')}
              >
                <CircleDot className="w-3.5 h-3.5 justify-self-center text-amber-500" />
                <span className="text-left">{filterStatusLabels.incomplete}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1 justify-self-center">
                  {statusCounts.incomplete}
                </Badge>
              </Button>
              {(Object.keys(statusLabels) as TaskStatus[]).map(key => {
                const IconComponent = statusIcons[key];
                return (
                  <Button
                    key={key}
                    variant={filters.status === key ? 'secondary' : 'ghost'}
                    className="grid grid-cols-[20px_1fr_28px] items-center h-8 text-xs w-full"
                    size="sm"
                    onClick={() => handleStatusFilter(key)}
                  >
                    <IconComponent className={`w-3.5 h-3.5 justify-self-center ${statusIconColors[key]}`} />
                    <span className="text-left">{statusLabels[key]}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 justify-self-center">
                      {statusCounts[key]}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 项目分类 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-muted-foreground">项目</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onCreateProject}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Button
                variant={filters.projectId === 'all' ? 'secondary' : 'ghost'}
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => handleProjectFilter('all')}
              >
                <Folder className="w-4 h-4 mr-2" />
                全部项目
              </Button>
              {projects.map(project => (
                <div
                  key={project.id}
                  className="flex items-center group"
                >
                  <Button
                    variant={filters.projectId === project.id ? 'secondary' : 'ghost'}
                    className="flex-1 justify-start text-xs"
                    size="sm"
                    onClick={() => handleProjectFilter(project.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {project.taskCount}
                    </Badge>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(project)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        编辑项目
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(project)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除项目
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>

          {/* 标签管理 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-muted-foreground">标签</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleAddTag}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center group"
                  >
                    <Badge
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/80 pr-1 text-xs"
                      onClick={() => handleTagFilter(tag)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                    <button
                      className="ml-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTagClick(tag);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">暂无标签，点击 + 添加</p>
            )}
          </div>

          <Separator />

          {/* 时间筛选 */}
          <div>
            <h2 className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              时间范围
            </h2>
            <Select
              value={filters.timeRange}
              onValueChange={value =>
                updateFilters({ timeRange: value as TimeRangeFilter })
              }
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeRangeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 自定义时间日期选择器 */}
            {filters.timeRange === 'custom' && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">开始日期</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left text-xs h-8">
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {filters.customDateStart
                            ? format(new Date(filters.customDateStart), 'MM/dd', { locale: zhCN })
                            : '选择'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateStart ? new Date(filters.customDateStart) : undefined}
                          onSelect={date =>
                            updateFilters({ customDateStart: date ? date.toISOString() : undefined })
                          }
                          locale={zhCN}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">结束日期</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left text-xs h-8">
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {filters.customDateEnd
                            ? format(new Date(filters.customDateEnd), 'MM/dd', { locale: zhCN })
                            : '选择'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateEnd ? new Date(filters.customDateEnd) : undefined}
                          onSelect={date =>
                            updateFilters({ customDateEnd: date ? date.toISOString() : undefined })
                          }
                          locale={zhCN}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 底部操作区 */}
      <div className="shrink-0 p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onOpenPersonManager}
        >
          <Users className="w-4 h-4 mr-2" />
          人员管理
          <Badge variant="secondary" className="ml-auto">
            {people.length}
          </Badge>
        </Button>
      </div>
    </div>

      {/* 删除项目确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除项目 "{projectToDelete?.name}" 及其下的所有任务（共 {projectToDelete?.taskCount} 个）。
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新增标签对话框 */}
      <AlertDialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>添加新标签</AlertDialogTitle>
            <AlertDialogDescription>
              <input
                type="text"
                className="w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入标签名称"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTagConfirm();
                  }
                }}
                autoFocus
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewTagName('')}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddTagConfirm} disabled={!newTagName.trim() || allTags.includes(newTagName.trim())}>
              添加
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除标签确认对话框 */}
      <AlertDialog open={deleteTagDialogOpen} onOpenChange={setDeleteTagDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将从所有任务中移除标签 "{tagToDelete}"。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTagConfirm}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 编辑项目对话框 */}
      <ProjectDialog
        open={editProjectDialogOpen}
        onClose={() => {
          setEditProjectDialogOpen(false);
          setProjectToEdit(null);
        }}
        project={projectToEdit}
      />
    </>
  );
}