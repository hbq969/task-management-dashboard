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
import { CalendarIcon, X, Tag as TagIcon, User, Users, ChevronsUpDown, Check, Search } from 'lucide-react';
import type { Task, Priority, TaskStatus } from '../types/task';
import { priorityColors, priorityLabels, statusLabels, getProgressColor } from '../constants/taskLabels';
import { cn } from './ui/utils';

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
  });

  const [tagInput, setTagInput] = useState('');
  const [relatedPersonsOpen, setRelatedPersonsOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [relatedPersonSearch, setRelatedPersonSearch] = useState('');

  // 搜索过滤人员列表
  const filteredAssigneePeople = people.filter(person =>
    person.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    (person.department && person.department.toLowerCase().includes(assigneeSearch.toLowerCase()))
  );

  const filteredRelatedPeople = people.filter(person =>
    person.name.toLowerCase().includes(relatedPersonSearch.toLowerCase()) ||
    (person.department && person.department.toLowerCase().includes(relatedPersonSearch.toLowerCase()))
  );

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
                onValueChange={(value: TaskStatus) => {
                  setFormData(prev => {
                    let newProgress = prev.progress;
                    if (value === 'completed') {
                      newProgress = 100;
                    } else if (value === 'todo') {
                      newProgress = 0;
                    }
                    return { ...prev, status: value, progress: newProgress };
                  });
                }}
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
                  <SelectItem value="urgent">
                    <Badge variant={priorityColors.urgent}>
                      {priorityLabels.urgent}
                    </Badge>
                  </SelectItem>
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

          {/* 进度百分比 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>进度</Label>
              <span className={`text-sm font-medium ${getProgressColor(formData.progress).replace('bg-', 'text-')}`}>
                {formData.progress}%
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[formData.progress]}
                onValueChange={([value]) => {
                  setFormData(prev => {
                    let newStatus = prev.status;
                    if (value === 100) {
                      newStatus = 'completed';
                    } else if (value === 0) {
                      newStatus = 'todo';
                    } else if (value > 0 && value < 100 && prev.status !== 'in-progress') {
                      // 进度在 1-99 之间时，如果当前状态不是"进行中"，则改为"进行中"
                      newStatus = 'in-progress';
                    }
                    return { ...prev, progress: value, status: newStatus };
                  });
                }}
                max={100}
                step={5}
                className="w-full"
              />
              {/* 进度颜色条 */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(formData.progress)}`}
                  style={{ width: `${formData.progress}%`, opacity: 0.2 }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>未开始</span>
              <span>已完成</span>
            </div>
          </div>

          {/* 负责人 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              负责人
            </Label>
            <Popover open={assigneeOpen} onOpenChange={(open) => {
              setAssigneeOpen(open);
              if (!open) setAssigneeSearch('');
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {formData.assigneeId ? (
                    (() => {
                      const person = people.find(p => p.id === formData.assigneeId);
                      return person ? (
                        <span>
                          {person.name}
                          {person.department && <span className="text-muted-foreground"> ({person.department})</span>}
                        </span>
                      ) : '选择负责人';
                    })()
                  ) : (
                    <span className="text-muted-foreground">选择负责人</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onWheel={e => e.stopPropagation()}>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索负责人..."
                      value={assigneeSearch}
                      onChange={e => setAssigneeSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredAssigneePeople.length > 0 ? (
                    <div className="space-y-0.5 p-1">
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded text-sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, assigneeId: '' }));
                          setAssigneeOpen(false);
                        }}
                      >
                        <div className="w-4 h-4" />
                        <span>无</span>
                      </div>
                      {filteredAssigneePeople.map(person => (
                        <div
                          key={person.id}
                          className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded text-sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, assigneeId: person.id }));
                            setAssigneeOpen(false);
                          }}
                        >
                          <Check className={cn("w-4 h-4", formData.assigneeId === person.id ? "opacity-100" : "opacity-0")} />
                          <span>
                            {person.name}
                            {person.department && (
                              <span className="text-muted-foreground"> ({person.department})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      未找到匹配的人员
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 关联人 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              关联人
            </Label>
            <Popover open={relatedPersonsOpen} onOpenChange={(open) => {
              setRelatedPersonsOpen(open);
              if (!open) setRelatedPersonSearch('');
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-auto min-h-9"
                >
                  {formData.relatedPersonIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1 py-0.5">
                      {formData.relatedPersonIds.map(id => {
                        const person = people.find(p => p.id === id);
                        return person ? (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="gap-1 text-xs"
                          >
                            {person.name}
                            <span
                              role="button"
                              tabIndex={0}
                              className="ml-0.5 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({
                                  ...prev,
                                  relatedPersonIds: prev.relatedPersonIds.filter(rid => rid !== id),
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  setFormData(prev => ({
                                    ...prev,
                                    relatedPersonIds: prev.relatedPersonIds.filter(rid => rid !== id),
                                  }));
                                }
                              }}
                            >
                              <X className="w-3 h-3" />
                            </span>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">选择关联人</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onWheel={e => e.stopPropagation()}>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索关联人..."
                      value={relatedPersonSearch}
                      onChange={e => setRelatedPersonSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredRelatedPeople.length > 0 ? (
                    <div className="space-y-0.5 p-1">
                      {filteredRelatedPeople.map(person => (
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
                          <Checkbox
                            checked={formData.relatedPersonIds.includes(person.id)}
                            onChange={() => {}}
                          />
                          <span>
                            {person.name}
                            {person.department && (
                              <span className="text-muted-foreground"> ({person.department})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {people.length === 0 ? '暂无人员，请先在人员管理中添加' : '未找到匹配的人员'}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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