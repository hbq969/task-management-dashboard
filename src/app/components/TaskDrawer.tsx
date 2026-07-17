import { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
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
import { CalendarIcon, X, Tag as TagIcon, Users, Check } from 'lucide-react';
import type { Task, Priority, TaskStatus, SubTask } from '../types/task';
import { priorityLabels, statusLabels } from '../constants/taskLabels';

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
}

export function TaskDrawer({ open, onClose, task }: TaskDrawerProps) {
  const { addTask, updateTask, projects, people, allTags } = useTaskContext();
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
    progress: 0,
    assigneeId: '' as string,
    relatedPersonIds: [] as string[],
    subtasks: [] as SubTask[],
  });

  const [tagInput, setTagInput] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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
        progress: task.progress ?? 0,
        assigneeId: task.assigneeId || '',
        relatedPersonIds: task.relatedPersonIds ?? [],
        subtasks: task.subtasks ?? [],
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
        progress: 0,
        assigneeId: '',
        relatedPersonIds: [],
        subtasks: [],
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
      progress: formData.progress,
      assigneeId: formData.assigneeId || undefined,
      relatedPersonIds: formData.relatedPersonIds,
      subtasks: formData.subtasks,
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

  const handleToggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    const newSubtask: SubTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      status: 'todo' as TaskStatus,
      progress: 0,
    };
    setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }));
    setNewSubtaskTitle('');
  };

  const handleUpdateSubtask = (id: string, updates: Partial<SubTask>) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const handleDeleteSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(s => s.id !== id),
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="!max-w-[50%] overflow-y-auto px-6">
        <SheetHeader className="px-0 pt-4">
          <SheetTitle>{isEdit ? '编辑任务' : '创建新任务'}</SheetTitle>
          <SheetDescription>
            {isEdit ? '修改任务详情和进度备注' : '填写任务信息，点击保存创建新任务'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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

          {/* 属性行：项目、状态、优先级、截止日期、负责人、关联人 */}
          <div className="flex items-center gap-1.5 border rounded-md p-1.5">
            <Select
              value={formData.projectId}
              onValueChange={value => setFormData(prev => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger className="h-7 text-xs flex-[1.6] min-w-0">
                <SelectValue placeholder="项目" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      <span className="truncate">{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.status}
              onValueChange={(value: TaskStatus) => {
                setFormData(prev => {
                  let newProgress = prev.progress;
                  if (value === 'completed') newProgress = 100;
                  else if (value === 'todo') newProgress = 0;
                  return { ...prev, status: value, progress: newProgress };
                });
              }}
            >
              <SelectTrigger className="h-7 text-xs flex-[0.8] min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabels) as TaskStatus[]).map(key => (
                  <SelectItem key={key} value={key}>{statusLabels[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.priority}
              onValueChange={value => setFormData(prev => ({ ...prev, priority: value as Priority }))}
            >
              <SelectTrigger className="h-7 text-xs flex-[0.6] min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">{priorityLabels.urgent}</SelectItem>
                <SelectItem value="high">{priorityLabels.high}</SelectItem>
                <SelectItem value="medium">{priorityLabels.medium}</SelectItem>
                <SelectItem value="low">{priorityLabels.low}</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-7 text-xs px-1.5 flex-[0.8] min-w-0 gap-0.5 justify-start">
                  <CalendarIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{formData.dueDate ? format(formData.dueDate, 'MM/dd') : '日期'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate || undefined}
                  onSelect={date => setFormData(prev => ({ ...prev, dueDate: date || null }))}
                  locale={zhCN}
                />
                {formData.dueDate && (
                  <div className="p-2 border-t">
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => setFormData(prev => ({ ...prev, dueDate: null }))}>
                      清除
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Select
              value={formData.assigneeId || '__none__'}
              onValueChange={value => setFormData(prev => ({ ...prev, assigneeId: value === '__none__' ? '' : value }))}
            >
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                <SelectValue placeholder="负责人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">无</SelectItem>
                {people.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-7 text-xs px-1.5 flex-1 min-w-0 gap-0.5 justify-start">
                  <Users className="w-3 h-3 shrink-0" />
                  <span className="truncate">{formData.relatedPersonIds.length > 0 ? `${formData.relatedPersonIds.length}人` : '关联'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <div className="max-h-48 overflow-y-auto">
                  {people.length > 0 ? (
                    <div className="space-y-0.5 p-1">
                      {people.map(person => (
                        <div
                          key={person.id}
                          className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded text-sm"
                          onClick={() => {
                            const isSelected = formData.relatedPersonIds.includes(person.id);
                            setFormData(prev => ({
                              ...prev,
                              relatedPersonIds: isSelected
                                ? prev.relatedPersonIds.filter(id => id !== person.id)
                                : [...prev.relatedPersonIds, person.id],
                            }));
                          }}
                        >
                          <Checkbox checked={formData.relatedPersonIds.includes(person.id)} onChange={() => {}} />
                          <span>{person.name}{person.department && <span className="text-muted-foreground"> ({person.department})</span>}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">暂无人员</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 进度行 */}
          <div className="flex items-center gap-1.5 border rounded-md px-1.5 py-0.5">
            <Slider
              value={[formData.progress]}
              onValueChange={([value]) => {
                setFormData(prev => {
                  let newStatus = prev.status;
                  if (value === 100) newStatus = 'completed';
                  else if (value === 0 && prev.status === 'completed') newStatus = 'todo';
                  return { ...prev, progress: value, status: newStatus };
                });
              }}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{formData.progress}%</span>
          </div>

          {/* 子任务 */}
          <div className="space-y-2">
            <Label>子任务</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入子任务标题，回车添加"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <Button type="button" onClick={handleAddSubtask} variant="outline" size="sm">
                添加
              </Button>
            </div>

            {formData.subtasks.length > 0 && (
              <div className="space-y-1">
                {formData.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-1.5 border rounded-md p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newStatus = subtask.status === 'completed' ? 'todo' as TaskStatus : 'completed' as TaskStatus;
                        handleUpdateSubtask(subtask.id, {
                          status: newStatus,
                          progress: newStatus === 'completed' ? 100 : 0,
                        });
                      }}
                      className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        subtask.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {subtask.status === 'completed' && <Check className="size-2.5" />}
                    </button>
                    <Input
                      value={subtask.title}
                      onChange={e => handleUpdateSubtask(subtask.id, { title: e.target.value })}
                      className="h-7 text-xs flex-1 min-w-0"
                      placeholder="子任务标题"
                    />
                    <Select
                      value={subtask.status}
                      onValueChange={(value: TaskStatus) => {
                        let newProgress = subtask.progress;
                        if (value === 'completed') newProgress = 100;
                        else if (value === 'todo') newProgress = 0;
                        handleUpdateSubtask(subtask.id, { status: value, progress: newProgress });
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-[88px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as TaskStatus[]).map(key => (
                          <SelectItem key={key} value={key}>{statusLabels[key]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-0.5 shrink-0 w-[72px]">
                      <Slider
                        value={[subtask.progress]}
                        onValueChange={([value]) => {
                          let newStatus = subtask.status;
                          if (value === 100) newStatus = 'completed';
                          else if (value === 0 && subtask.status === 'completed') newStatus = 'todo';
                          handleUpdateSubtask(subtask.id, { progress: value, status: newStatus });
                        }}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground w-6 text-right">{subtask.progress}%</span>
                    </div>
                    <Input
                      value={subtask.assignee || ''}
                      onChange={e => handleUpdateSubtask(subtask.id, { assignee: e.target.value || undefined })}
                      className="h-7 text-xs w-[68px] shrink-0"
                      placeholder="负责人"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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

            {/* 快速选择标签 */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(label => (
                  <Badge
                    key={label}
                    variant={formData.tags.includes(label) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs px-2 py-0.5"
                    onClick={() => handleToggleTag(label)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            {/* 已添加的标签 */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
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