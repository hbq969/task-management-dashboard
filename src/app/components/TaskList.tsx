import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Card,
  CardContent,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
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
  User,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Task } from '../types/task';
import { priorityColors, priorityLabels, statusLabels } from '../constants/taskLabels';

interface TaskListProps {
  onEditTask: (task: Task) => void;
}

export function TaskList({ onEditTask }: TaskListProps) {
  const { getFilteredTasks, updateTask, deleteTask, projects, people, currentPage, pageSize, setCurrentPage, setPageSize } = useTaskContext();
  const tasks = getFilteredTasks();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Pagination
  const totalPages = pageSize === Infinity ? 1 : Math.ceil(tasks.length / pageSize);
  const paginatedTasks = pageSize === Infinity ? tasks : tasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 if current page exceeds total
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

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

  // Memoized lookup maps for performance
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const personMap = useMemo(() => new Map(people.map(p => [p.id, p])), [people]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -50 },
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
    <TooltipProvider>
      <motion.div
        className="space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {paginatedTasks.map(task => {
            const project = projectMap.get(task.projectId);
            const assignee = task.assigneeId ? personMap.get(task.assigneeId) : null;
            const relatedPersons = task.relatedPersonIds
              .map(id => personMap.get(id))
              .filter(Boolean);
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== 'completed';

            return (
              <motion.div
                key={task.id}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <Card
                  className={`transition-all hover:shadow-sm ${
                    task.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="py-2.5 px-3">
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => handleStatusToggle(task)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`text-sm font-medium cursor-pointer hover:text-primary flex-1 ${
                                  task.status === 'completed'
                                    ? 'line-through text-muted-foreground'
                                    : ''
                                }`}
                                onClick={() => onEditTask(task)}
                              >
                                {task.title}
                              </div>
                            </TooltipTrigger>
                            {task.description && (
                              <TooltipContent side="top" className="max-w-sm">
                                {task.description}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
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

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {/* 项目 */}
                          {project && (
                            <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-4">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
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
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {statusLabels[task.status]}
                          </Badge>

                          {/* 优先级 */}
                          <Badge variant={priorityColors[task.priority]} className="text-[10px] px-1.5 py-0 h-4">
                            {priorityLabels[task.priority]}
                          </Badge>

                          {/* 进度 */}
                          {(task.progress ?? 0) > 0 && (
                            <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-4">
                              <div className="w-8 h-1 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              {task.progress}%
                            </Badge>
                          )}

                          {/* 负责人 */}
                          {assignee && (
                            <Badge variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0 h-4">
                              <User className="w-2.5 h-2.5" />
                              {assignee.name}
                            </Badge>
                          )}

                          {/* 截止日期 */}
                          {task.dueDate && (
                            <Badge
                              variant={isOverdue ? 'destructive' : 'outline'}
                              className="gap-0.5 text-[10px] px-1.5 py-0 h-4"
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              {format(new Date(task.dueDate), 'MM/dd', { locale: zhCN })}
                            </Badge>
                          )}

                          {/* 标签 */}
                          {task.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0 h-4">
                              <TagIcon className="w-2.5 h-2.5" />
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* 关联人 */}
                        {relatedPersons.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Users className="w-2.5 h-2.5" />
                            <span>{relatedPersons.map(p => p?.name).join('、')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Pagination Controls */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
          {pageSize !== Infinity && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            variant={pageSize === Infinity ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPageSize(pageSize === Infinity ? 10 : Infinity)}
          >
            {pageSize === Infinity ? '分页' : '全部'}
          </Button>

          <span className="text-xs text-muted-foreground ml-2">
            共 {tasks.length} 条
          </span>
        </div>
      )}

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
    </TooltipProvider>
  );
}