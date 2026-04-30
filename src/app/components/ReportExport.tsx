import { useState, useMemo } from 'react';
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
import { Separator } from './ui/separator';
import { FileText, Copy, Check, X } from 'lucide-react';

interface ReportExportProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'markdown' | 'plaintext';

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

      // 收集描述行（以空格开头但不以 '- ' 开头的缩进行）
      const descriptions: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const rawLine = lines[j];
        if (rawLine.startsWith('  ') && !rawLine.trim().startsWith('- ')) {
          descriptions.push(rawLine.trim());
          j++;
        } else {
          break;
        }
      }

      // 收集状态和进度信息
      let status = '';
      let progress = '';
      for (; j < lines.length && lines[j].trim().startsWith('- '); j++) {
        const detail = lines[j].trim();
        if (detail.includes('状态：')) {
          status = detail.replace(/- 状态：/, '').trim();
        }
        if (detail.includes('进度：')) {
          progress = detail.replace(/- 进度：/, '').trim();
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

      // 输出描述行
      for (const desc of descriptions) {
        result.push(`  ${desc}`);
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            报告导出
          </DialogTitle>
          <DialogDescription>生成任务报告并导出</DialogDescription>
        </DialogHeader>

        {/* 表单区域 - 固定高度 */}
        <div className="space-y-4 mt-4 flex-shrink-0">
          <div className="flex items-end gap-4">
            <Button onClick={handleGenerateReport}>生成报告</Button>
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
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted-foreground">已选择：</span>
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
            )}
          </div>
        </div>

        <Separator className="flex-shrink-0" />

        {/* 报告区域 - 自适应高度 */}
        {report && (
          <div className="grid grid-rows-[auto_1fr] min-h-0 flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label>周报</Label>
            </div>

            {/* Preview Area - 自适应高度 */}
            <div className="min-h-0 overflow-auto border rounded-md bg-muted/30">
              <div className="p-4">
                <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                  {displayContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {!report && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground flex-1">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p>点击"生成报告"查看本周任务</p>
          </div>
        )}

        {/* 复制按钮 - 固定在底部 */}
        {report && (
          <div className="flex gap-2 pt-4 border-t flex-shrink-0">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  复制到剪贴板
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}