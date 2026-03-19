import { useState } from 'react';
import { TaskProvider } from '../context/TaskContext';
import { Sidebar } from './Sidebar';
import { TaskList } from './TaskList';
import { TaskDrawer } from './TaskDrawer';
import { ProjectDialog } from './ProjectDialog';
import { TaskToolbar } from './TaskToolbar';
import { PersonManager } from './PersonManager';
import { DataManager } from './DataManager';
import { ReportExport } from './ReportExport';
import type { Task } from '../types/task';

function DashboardContent() {
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [personManagerOpen, setPersonManagerOpen] = useState(false);
  const [dataManagerOpen, setDataManagerOpen] = useState(false);
  const [reportExportOpen, setReportExportOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskDrawerOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setTaskDrawerOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 左侧导航栏 */}
      <Sidebar
        onCreateProject={() => setProjectDialogOpen(true)}
        onOpenPersonManager={() => setPersonManagerOpen(true)}
      />

      {/* 右侧主工作区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 工具栏 */}
        <TaskToolbar
          onCreateTask={handleCreateTask}
          onOpenDataManager={() => setDataManagerOpen(true)}
          onOpenReportExport={() => setReportExportOpen(true)}
        />

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <TaskList onEditTask={handleEditTask} />
        </div>
      </div>

      {/* 任务抽屉 */}
      <TaskDrawer
        open={taskDrawerOpen}
        onClose={handleCloseDrawer}
        task={editingTask}
      />

      {/* 项目创建对话框 */}
      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
      />

      {/* 人员管理对话框 */}
      <PersonManager
        open={personManagerOpen}
        onClose={() => setPersonManagerOpen(false)}
      />

      {/* 数据管理对话框 */}
      <DataManager
        open={dataManagerOpen}
        onClose={() => setDataManagerOpen(false)}
      />

      {/* 报告导出对话框 */}
      <ReportExport
        open={reportExportOpen}
        onClose={() => setReportExportOpen(false)}
      />
    </div>
  );
}

export function Dashboard() {
  return (
    <TaskProvider>
      <DashboardContent />
    </TaskProvider>
  );
}