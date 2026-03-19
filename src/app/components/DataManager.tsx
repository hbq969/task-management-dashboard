import { useState, useRef } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Separator } from './ui/separator';
import { Download, Upload, AlertCircle } from 'lucide-react';

interface DataManagerProps {
  open: boolean;
  onClose: () => void;
}

export function DataManager({ open, onClose }: DataManagerProps) {
  const { exportData, importData } = useTaskContext();
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const result = importData(data);
      setImportMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
      if (result.success) {
        setTimeout(() => setImportMessage(null), 3000);
      }
    };
    reader.onerror = () => {
      setImportMessage({
        type: 'error',
        text: '读取文件失败，请重试',
      });
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>数据管理</DialogTitle>
          <DialogDescription>导入或导出任务数据</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 导出 */}
          <div className="space-y-3">
            <h3 className="font-medium">导出数据</h3>
            <p className="text-sm text-muted-foreground">
              将所有任务、项目和人员数据导出为 JSON 文件，用于备份或迁移。
            </p>
            <Button onClick={handleExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>

          <Separator />

          {/* 导入 */}
          <div className="space-y-3">
            <h3 className="font-medium">导入数据</h3>
            <p className="text-sm text-muted-foreground">
              从 JSON 文件导入数据。注意：导入将覆盖现有数据。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              选择文件导入
            </Button>

            {importMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  importMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                }`}
              >
                {importMessage.type === 'error' && (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{importMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}