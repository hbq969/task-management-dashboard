import { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { Project } from '../types/task';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null; // 编辑模式下传入的项目
}

const projectColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function ProjectDialog({ open, onClose, project }: ProjectDialogProps) {
  const { addProject, updateProject } = useTaskContext();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(projectColors[0]);
  const [order, setOrder] = useState(0);

  const isEditMode = !!project;

  useEffect(() => {
    if (open) {
      if (project) {
        // 编辑模式：填充现有数据
        setName(project.name);
        setSelectedColor(project.color);
        setOrder(project.order ?? 0);
      } else {
        // 创建模式：重置表单
        setName('');
        setSelectedColor(projectColors[0]);
        setOrder(0);
      }
    }
  }, [open, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditMode && project) {
      updateProject(project.id, {
        name: name.trim(),
        color: selectedColor,
        order,
      });
    } else {
      addProject({
        name: name.trim(),
        color: selectedColor,
        order,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑项目' : '创建新项目'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '修改项目信息' : '为您的任务创建一个新的项目分类'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">项目名称 *</Label>
            <Input
              id="project-name"
              placeholder="输入项目名称..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>项目颜色</Label>
            <div className="flex gap-2">
              {projectColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-order">排序顺序</Label>
            <Input
              id="project-order"
              type="number"
              placeholder="数字越小越靠前，默认为 0"
              value={order}
              onChange={e => setOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">导出报告时按此字段从小到大排序</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditMode ? '保存修改' : '创建项目'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}