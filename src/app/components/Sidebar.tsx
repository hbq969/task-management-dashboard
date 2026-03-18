import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  Folder,
  Tag,
  Plus,
  Circle,
} from 'lucide-react';
import type { TaskStatus } from '../types/task';

interface SidebarProps {
  onCreateProject: () => void;
}

export function Sidebar({ onCreateProject }: SidebarProps) {
  const { tasks, projects, filters, updateFilters, allTags } = useTaskContext();

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const handleStatusFilter = (status: TaskStatus | 'all') => {
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

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          任务管理
        </h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 状态筛选 */}
          <div>
            <h2 className="text-sm font-medium mb-2 text-muted-foreground">状态</h2>
            <div className="space-y-1">
              <Button
                variant={filters.status === 'all' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                <Circle className="w-4 h-4 mr-2" />
                全部任务
                <Badge variant="outline" className="ml-auto">
                  {statusCounts.all}
                </Badge>
              </Button>
              <Button
                variant={filters.status === 'todo' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => handleStatusFilter('todo')}
              >
                <ListTodo className="w-4 h-4 mr-2" />
                待办
                <Badge variant="outline" className="ml-auto">
                  {statusCounts.todo}
                </Badge>
              </Button>
              <Button
                variant={filters.status === 'in-progress' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => handleStatusFilter('in-progress')}
              >
                <Clock className="w-4 h-4 mr-2" />
                进行中
                <Badge variant="outline" className="ml-auto">
                  {statusCounts['in-progress']}
                </Badge>
              </Button>
              <Button
                variant={filters.status === 'completed' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => handleStatusFilter('completed')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                已完成
                <Badge variant="outline" className="ml-auto">
                  {statusCounts.completed}
                </Badge>
              </Button>
            </div>
          </div>

          <Separator />

          {/* 项目分类 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">项目</h2>
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
                className="w-full justify-start"
                size="sm"
                onClick={() => handleProjectFilter('all')}
              >
                <Folder className="w-4 h-4 mr-2" />
                全部项目
              </Button>
              {projects.map(project => (
                <Button
                  key={project.id}
                  variant={filters.projectId === project.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => handleProjectFilter(project.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                  <Badge variant="outline" className="ml-auto">
                    {project.taskCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          {allTags.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-medium mb-2 text-muted-foreground">标签</h2>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => handleTagFilter(tag)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}