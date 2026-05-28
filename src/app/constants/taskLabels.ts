export const priorityColors = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'success',
} as const;

export const statusColors = {
  todo: 'outline',
  'pending-apply': 'outline',
  review: 'secondary',
  researching: 'info',
  'in-progress': 'secondary',
  processing: 'secondary',
  investigating: 'warning',
  fixing: 'warning',
  'in-flow': 'secondary',
  designing: 'info',
  developing: 'info',
  testing: 'info',
  'pending-change': 'warning',
  completed: 'default',
} as const;

export const priorityLabels = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const statusLabels = {
  todo: '待办',
  'pending-apply': '待申请',
  review: '评审',
  researching: '调研中',
  'in-progress': '进行中',
  processing: '处理中',
  investigating: '排查中',
  fixing: '修复中',
  'in-flow': '流程中',
  designing: '设计中',
  developing: '开发中',
  testing: '测试中',
  'pending-change': '待变更',
  completed: '已完成',
} as const;

// 筛选状态标签（包含"未完成"特殊筛选）
export const filterStatusLabels = {
  all: '全部',
  incomplete: '未完成',
  ...statusLabels,
} as const;

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