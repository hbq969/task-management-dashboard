import { useState, useMemo, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FileText, Copy, Check, X } from 'lucide-react';

interface ReportExportProps {
  open: boolean;
  onClose: () => void;
}

const markdownToPlainText = (md: string): string => {
  const lines = md.split('\n');
  const result: string[] = [];
  let currentProject = '';
  let projectIndex = 0;
  let taskIndex = 0;

  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过空行
    if (!line) continue;

    // 一级标题 - 报告类型，跳过
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      continue;
    }

    // 时间范围和统计信息 - 跳过
    if (line.startsWith('**时间范围**') || line.startsWith('**任务统计**')) {
      continue;
    }

    // 二级标题 - 项目名
    if (line.startsWith('## ')) {
      currentProject = line.replace(/^##\s+/, '').replace(/\*\*/g, '');
      projectIndex++;
      taskIndex = 0;
      // 第一个项目前不添加空行，后续项目前添加空行间隔
      if (projectIndex > 1) {
        result.push('');
      }
      const prefix = projectIndex <= 10 ? chineseNumbers[projectIndex - 1] : projectIndex.toString();
      result.push(`${prefix}、${currentProject}`);
      continue;
    }

    // 三级标题 - 任务名
    if (line.startsWith('### ')) {
      taskIndex++;
      const taskName = line.replace(/^###\s+/, '').replace(/\*\*/g, '');

      // 收集状态和进度信息
      let status = '';
      let progress = '';
      let j = i + 1;
      for (; j < lines.length && lines[j].trim().startsWith('- '); j++) {
        const detail = lines[j].trim();
        if (detail.includes('状态：')) {
          status = detail.replace(/- 状态：/, '').trim();
        }
        if (detail.includes('进度：')) {
          progress = detail.replace(/- 进度：/, '').trim();
        }
      }

      // 收集子任务（`  1. title...` 格式）
      const subtasks: string[] = [];
      for (; j < lines.length; j++) {
        if (/^  \d/.test(lines[j])) {
          subtasks.push(lines[j].trim());
        } else {
          break;
        }
      }

      // 构建任务行
      let taskLine = `${taskIndex}. ${taskName}`;
      const details: string[] = [];
      if (status) details.push(status);
      if (progress) details.push(progress);
      if (details.length > 0) {
        taskLine += `（${details.join('，')}）`;
      }
      result.push(taskLine);

      // 输出子任务
      for (const sub of subtasks) {
        result.push(`  ${sub}`);
      }

      continue;
    }
  }

  return result.join('\n');
};

export function ReportExport({ open, onClose }: ReportExportProps) {
  const { generateReport, allTags } = useTaskContext();
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const handleGenerateReport = () => {
    const tags = filterTags.length > 0 ? filterTags : undefined;
    const generatedReport = generateReport('weekly', undefined, tags);
    setReport(generatedReport);
  };

  // 标签变化时自动生成报告
  useEffect(() => {
    handleGenerateReport();
  }, [filterTags]);

  const handleToggleTag = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRemoveTag = (tag: string) => {
    setFilterTags(prev => prev.filter(t => t !== tag));
  };

  const displayContent = useMemo(() => {
    if (!report) return '';
    return markdownToPlainText(report);
  }, [report]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col" style={{ width: 900, maxWidth: 900, height: 650 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            报告导出
          </DialogTitle>
          <DialogDescription>生成任务报告并导出</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[220px_1fr] gap-4 min-h-0 flex-1 mt-4">
          {/* 左侧控制区 */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button onClick={handleGenerateReport} className="flex-1">生成报告</Button>
              {report && (
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* 标签筛选 */}
            <div className="space-y-2">
              <Label>标签筛选（可选）</Label>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                      filterTags.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {filterTags.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-sm text-muted-foreground">已选择：</span>
                  <div className="flex flex-wrap gap-1">
                    {filterTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-primary/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 右侧预览区 */}
          <div className="min-h-0 flex flex-col">
            {report ? (
              <div className="min-h-0 flex-1 overflow-auto border rounded-md bg-muted/30">
                  <div className="p-4">
                    <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                      {displayContent}
                    </pre>
                  </div>
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>点击"生成报告"查看本周任务</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}