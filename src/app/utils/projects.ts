import type { Project } from '../types/task';

export function sortProjectsByOrder(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function swapProjectOrder(
  projects: Project[],
  draggedProjectId: string,
  targetProjectId: string,
): Project[] {
  const draggedProject = projects.find(project => project.id === draggedProjectId);
  const targetProject = projects.find(project => project.id === targetProjectId);

  if (!draggedProject || !targetProject || draggedProjectId === targetProjectId) {
    return [...projects];
  }

  const draggedOrder = draggedProject.order ?? 0;
  const targetOrder = targetProject.order ?? 0;

  return projects.map(project => {
    if (project.id === draggedProjectId) {
      return { ...project, order: targetOrder };
    }
    if (project.id === targetProjectId) {
      return { ...project, order: draggedOrder };
    }
    return project;
  });
}
