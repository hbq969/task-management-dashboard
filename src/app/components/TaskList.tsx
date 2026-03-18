import { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Tag as TagIcon,
  Clock,
  FileText,
} from 'lucide-react';
import type { Task } from '../types/task';

interface TaskListProps {
  onEditTask: (task: Task) => void;
}

export function TaskList({ onEditTask }: TaskListProps) {
  const { getFilteredTasks, updateTask, deleteTask, projects } = useTaskContext();
  const tasks = getFilteredTasks();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleStatusToggle = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTask(task.id, { status: newStatus });
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const getProject = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  const priorityLabels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  const statusLabels = {
    todo: '待办',
    'in-progress': '进行中',
    completed: '已完成',
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileText className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg">暂无任务</p>
        <p className="text-sm">点击"创建任务"按钮开始添加</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map(task => {
          const project = getProject(task.projectId);
          const isOverdue =
            task.dueDate &&
            new Date(task.dueDate) < new Date() &&
            task.status !== 'completed';

          return (
            <Card
              key={task.id}
              className={`transition-all hover:shadow-md ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleStatusToggle(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle
                        className={`text-base cursor-pointer hover:text-primary ${
                          task.status === 'completed'
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                        onClick={() => onEditTask(task)}
                      >
                        {task.title}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditTask(task)}>
                            <Edit className="w-4 h-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(task)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {task.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {task.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {/* 项目 */}
                  {project && (
                    <Badge variant="outline" className="gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </Badge>
                  )}

                  {/* 状态 */}
                  <Badge
                    variant={
                      task.status === 'completed'
                        ? 'default'
                        : task.status === 'in-progress'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {statusLabels[task.status]}
                  </Badge>

                  {/* 优先级 */}
                  <Badge variant={priorityColors[task.priority]}>
                    {priorityLabels[task.priority]}
                  </Badge>

                  {/* 截止日期 */}
                  {task.dueDate && (
                    <Badge
                      variant={isOverdue ? 'destructive' : 'outline'}
                      className="gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.dueDate), 'MM月dd日', { locale: zhCN })}
                    </Badge>
                  )}

                  {/* 标签 */}
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <TagIcon className="w-3 h-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* 进度备注 */}
                {task.notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                    <p className="line-clamp-2">{task.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。任务 "{taskToDelete?.title}" 将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}