# TODO

## 2026-03-19 已完成

### 报告导出优化与本地文件存储

- [x] 纯文本格式 - 项目间增加换行
- [x] Markdown 格式 - 增强样式
- [x] 安装文件系统依赖 (@tauri-apps/plugin-fs)
- [x] 配置 Tauri 文件系统权限
- [x] 创建存储服务层 (src/app/services/storage.ts)
- [x] 修改 TaskContext 数据持久化
- [x] 功能验证

**提交**: 41ff974 feat: 报告导出优化与本地文件存储

### 任务管理功能修复

- [x] 进度联动逻辑：进度0%时状态改为待办，进度1-99%时状态改为进行中
- [x] 下拉列表滚动修复：移除ScrollArea嵌套，添加onWheel事件处理
- [x] 功能验证通过

**提交**: 0af4dcc fix: 进度联动逻辑补充与下拉列表滚动修复