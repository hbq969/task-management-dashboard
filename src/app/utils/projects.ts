import type { Project } from '../types/task';

export function sortProjectsByOrder(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
