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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportExportProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'markdown' | 'plaintext';

const markdownToPlainText = (md: string): string => {
  return md
    .replace(/^#{1,6}\s+/gm, '')      // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1')  // 移除粗体
    .replace(/\*(.+?)\*/g, '$1')      // 移除斜体
    .replace(/^[-*]\s+/gm, '• ')      // 列表标记转换为圆点
    .replace(/`(.+?)`/g, '$1')        // 移除代码标记
    .trim();
};

export function ReportExport({ open, onClose }: ReportExportProps) {
  const { generateReport } = useTaskContext();
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const handleGenerateReport = () => {
    const generatedReport = generateReport(reportType);
    setReport(generatedReport);
  };

  const displayContent = useMemo(() => {
    if (!report) return '';
    return format === 'plaintext' ? markdownToPlainText(report) : report;
  }, [report, format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reportTypeLabels = {
    weekly: '周报',
    monthly: '月报',
    quarterly: '季报',
  };

  const formatLabels = {
    markdown: 'Markdown',
    plaintext: '纯文本',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            报告导出
          </DialogTitle>
          <DialogDescription>生成任务报告并导出</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>报告类型</Label>
              <Select
                value={reportType}
                onValueChange={value =>
                  setReportType(value as 'weekly' | 'monthly' | 'quarterly')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">周报</SelectItem>
                  <SelectItem value="monthly">月报</SelectItem>
                  <SelectItem value="quarterly">季报</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>导出格式</Label>
              <Select
                value={format}
                onValueChange={value => setFormat(value as ExportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="plaintext">纯文本</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport}>生成报告</Button>
          </div>

          <Separator />

          {report && (
            <div className="space-y-3 flex-1 min-h-0">
              <div className="flex items-center justify-between">
                <Label>{reportTypeLabels[reportType]} ({formatLabels[format]})</Label>
              </div>

              {/* Preview Area */}
              <ScrollArea className="h-[350px] border rounded-md bg-muted/30">
                <div className="p-4">
                  {format === 'markdown' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                      {displayContent}
                    </pre>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
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
            </div>
          )}

          {!report && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>选择报告类型并点击"生成报告"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}