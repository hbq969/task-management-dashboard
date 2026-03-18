import { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, X, Tag as TagIcon } from 'lucide-react';
import type { Task, Priority, TaskStatus } from '../types/task';

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
}

export function TaskDrawer({ open, onClose, task }: TaskDrawerProps) {
  const { addTask, updateTask, projects } = useTaskContext();
  const isEdit = !!task;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: null as Date | null,
    priority: 'medium' as Priority,
    projectId: projects[0]?.id || '',
    status: 'todo' as TaskStatus,
    tags: [] as string[],
    notes: '',
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: task.priority,
        projectId: task.projectId,
        status: task.status,
        tags: task.tags,
        notes: task.notes,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: null,
        priority: 'medium',
        projectId: projects[0]?.id || '',
        status: 'todo',
        tags: [],
        notes: '',
      });
    }
    setTagInput('');
  }, [task, open, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
      priority: formData.priority,
      projectId: formData.projectId,
      status: formData.status,
      tags: formData.tags,
      notes: formData.notes,
    };

    if (isEdit) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const statusLabels = {
    todo: '待办',
    'in-progress': '进行中',
    completed: '已完成',
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '编辑任务' : '创建新任务'}</SheetTitle>
          <SheetDescription>
            {isEdit ? '修改任务详情和进度备注' : '填写任务信息，点击保存创建新任务'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* 任务标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              placeholder="输入任务标题..."
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* 任务描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">任务描述</Label>
            <Textarea
              id="description"
              placeholder="详细描述任务内容..."
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              rows={4}
            />
          </div>

          {/* 项目和状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>所属项目</Label>
              <Select
                value={formData.projectId}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, projectId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, status: value as TaskStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{statusLabels.todo}</SelectItem>
                  <SelectItem value="in-progress">{statusLabels['in-progress']}</SelectItem>
                  <SelectItem value="completed">{statusLabels.completed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 优先级和截止日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, priority: value as Priority }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <Badge variant={priorityColors.high}>
                      {priorityLabels.high}
                    </Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge variant={priorityColors.medium}>
                      {priorityLabels.medium}
                    </Badge>
                  </SelectItem>
                  <SelectItem value="low">
                    <Badge variant={priorityColors.low}>
                      {priorityLabels.low}
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>截止日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(formData.dueDate, 'PPP', { locale: zhCN })
                    ) : (
                      <span className="text-muted-foreground">选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate || undefined}
                    onSelect={date =>
                      setFormData(prev => ({ ...prev, dueDate: date || null }))
                    }
                    locale={zhCN}
                  />
                  {formData.dueDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setFormData(prev => ({ ...prev, dueDate: null }))
                        }
                      >
                        清除日期
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex gap-2">
              <Input
                placeholder="添加标签..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <TagIcon className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 进度备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">进度备注</Label>
            <Textarea
              id="notes"
              placeholder="记录任务进展、遇到的问题等..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEdit ? '保存修改' : '创建任务'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}