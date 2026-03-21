import { useState, useMemo, useRef } from 'react';
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
import { ScrollArea } from './ui/scroll-area';
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Building2,
  Phone,
  Mail,
  Users,
  Search,
  Download,
  Upload,
} from 'lucide-react';
import type { Person } from '../types/task';
import { generatePersonTemplate, parsePersonExcel } from '../utils/excel';

interface PersonManagerProps {
  open: boolean;
  onClose: () => void;
}

export function PersonManager({ open, onClose }: PersonManagerProps) {
  const { people, addPerson, updatePerson, deletePerson, tasks } = useTaskContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    department: '',
    group: '',
    phone: '',
    email: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      department: '',
      group: '',
      phone: '',
      email: '',
    });
    setEditingPerson(null);
  };

  // 模板下载
  const handleDownloadTemplate = () => {
    const blob = generatePersonTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '人员导入模板.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel 导入
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const people = await parsePersonExcel(file);
      const validPeople = people.filter(p => p.name);
      validPeople.forEach(p => addPerson(p));
    } catch (error) {
      console.error('导入失败:', error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenEditDialog = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name,
        company: person.company || '',
        department: person.department || '',
        group: person.group || '',
        phone: person.phone || '',
        email: person.email || '',
      });
    } else {
      resetForm();
    }
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const personData = {
      name: formData.name.trim(),
      company: formData.company.trim() || undefined,
      department: formData.department.trim() || undefined,
      group: formData.group.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    };

    if (editingPerson) {
      updatePerson(editingPerson.id, personData);
    } else {
      addPerson(personData);
    }

    handleCloseEditDialog();
  };

  const handleDeleteClick = (person: Person) => {
    setDeletingPerson(person);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingPerson) {
      deletePerson(deletingPerson.id);
      setDeleteDialogOpen(false);
      setDeletingPerson(null);
    }
  };

  const getPersonTaskCount = (personId: string) => {
    return tasks.filter(
      task =>
        task.assigneeId === personId || task.relatedPersonIds.includes(personId)
    ).length;
  };

  const filteredPeople = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return people;

    return people.filter(person => {
      return (
        person.name.toLowerCase().includes(query) ||
        person.company?.toLowerCase().includes(query) ||
        person.department?.toLowerCase().includes(query) ||
        person.group?.toLowerCase().includes(query)
      );
    });
  }, [people, searchQuery]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              人员管理
            </DialogTitle>
            <DialogDescription>管理任务相关人员信息</DialogDescription>
          </DialogHeader>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、公司、部门或小组..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => handleOpenEditDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              添加人员
            </Button>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              下载模板
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? '导入中...' : 'Excel导入'}
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {filteredPeople.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mb-4 opacity-20" />
                <p>{searchQuery ? '未找到匹配的人员' : '暂无人员'}</p>
                <p className="text-sm">{searchQuery ? '请尝试其他搜索条件' : '点击"添加人员"开始添加'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPeople.map(person => (
                  <div
                    key={person.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{person.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({getPersonTaskCount(person.id)} 个任务)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {person.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {person.company}
                            {person.department && ` - ${person.department}`}
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {person.phone}
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center gap-1 col-span-2">
                            <Mail className="w-3 h-3" />
                            {person.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditDialog(person)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(person)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? '编辑人员' : '添加人员'}
            </DialogTitle>
            <DialogDescription>填写人员基本信息</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入姓名"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">公司</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="公司名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="部门名称"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">分组</Label>
              <Input
                id="group"
                value={formData.group}
                onChange={e => setFormData(prev => ({ ...prev, group: e.target.value }))}
                placeholder="分组名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="电话号码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="邮箱地址"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingPerson ? '保存修改' : '添加人员'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
                取消
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除人员？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除 "{deletingPerson?.name}"，该人员与任务的关联也将被移除。
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