export const priorityColors = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'success',
} as const;

export const priorityLabels = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const statusLabels = {
  todo: '待办',
  'in-progress': '进行中',
  completed: '已完成',
};

export const timeRangeLabels = {
  all: '全部时间',
  last1Day: '最近1天',
  last3Days: '最近3天',
  last1Week: '最近1周',
  thisWeek: '本周',
  thisMonth: '本月',
  thisQuarter: '本季度',
  thisYear: '本年',
  custom: '自定义时间',
} as const;

// 预定义标签供快速选择
export const TASK_LABELS = [
  '重要',
  '紧急',
  '设计',
  '开发',
  '测试',
  '会议',
  '学习',
  '前端',
  '后端',
  '文档',
] as const;

// 进度颜色渐变工具函数
export const getProgressColor = (progress: number): string => {
  if (progress <= 20) return 'bg-red-500';
  if (progress <= 40) return 'bg-orange-500';
  if (progress <= 60) return 'bg-yellow-500';
  if (progress <= 80) return 'bg-blue-500';
  return 'bg-green-500';
};