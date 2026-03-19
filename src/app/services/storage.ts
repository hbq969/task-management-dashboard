import { Task, Project, Person } from '../types/task';

const STORAGE_KEY = 'todo-tasks';
const PROJECTS_KEY = 'todo-projects';
const PEOPLE_KEY = 'todo-people';

export interface StorageData {
  tasks: Task[];
  projects: Project[];
  people: Person[];
  exportedAt?: string;
}

const isTauri = () => '__TAURI__' in window;

const getDataDir = async (): Promise<string> => {
  const { appDataDir, join } = await import('@tauri-apps/plugin-fs');
  const appData = await appDataDir();
  return join(appData, 'todo-app');
};

const getDataFilePath = async (): Promise<string> => {
  const { join } = await import('@tauri-apps/plugin-fs');
  const dataDir = await getDataDir();
  return join(dataDir, 'data.json');
};

export const readData = async (): Promise<StorageData | null> => {
  if (isTauri()) {
    try {
      const { exists, readTextFile, mkdir } = await import('@tauri-apps/plugin-fs');
      const dataDir = await getDataDir();
      const filePath = await getDataFilePath();

      // 确保目录存在
      if (!(await exists(dataDir))) {
        await mkdir(dataDir, { recursive: true });
        return null;
      }

      if (!(await exists(filePath))) {
        return null;
      }

      const content = await readTextFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read data from file:', error);
      return null;
    }
  } else {
    // 浏览器环境：从 localStorage 读取
    try {
      const tasks = localStorage.getItem(STORAGE_KEY);
      const projects = localStorage.getItem(PROJECTS_KEY);
      const people = localStorage.getItem(PEOPLE_KEY);

      if (!tasks) {
        return null;
      }

      return {
        tasks: JSON.parse(tasks),
        projects: projects ? JSON.parse(projects) : [],
        people: people ? JSON.parse(people) : [],
      };
    } catch (error) {
      console.error('Failed to read data from localStorage:', error);
      return null;
    }
  }
};

export const writeData = async (data: StorageData): Promise<boolean> => {
  if (isTauri()) {
    try {
      const { writeTextFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
      const dataDir = await getDataDir();
      const filePath = await getDataFilePath();

      // 确保目录存在
      if (!(await exists(dataDir))) {
        await mkdir(dataDir, { recursive: true });
      }

      const content = JSON.stringify(
        {
          ...data,
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
      await writeTextFile(filePath, content);
      return true;
    } catch (error) {
      console.error('Failed to write data to file:', error);
      return false;
    }
  } else {
    // 浏览器环境：写入 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tasks));
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects));
      localStorage.setItem(PEOPLE_KEY, JSON.stringify(data.people));
      return true;
    } catch (error) {
      console.error('Failed to write data to localStorage:', error);
      return false;
    }
  }
};

export const migrateFromLocalStorage = async (): Promise<StorageData | null> => {
  try {
    const tasks = localStorage.getItem(STORAGE_KEY);
    const projects = localStorage.getItem(PROJECTS_KEY);
    const people = localStorage.getItem(PEOPLE_KEY);

    if (!tasks) {
      return null;
    }

    const data: StorageData = {
      tasks: JSON.parse(tasks),
      projects: projects ? JSON.parse(projects) : [],
      people: people ? JSON.parse(people) : [],
    };

    // 迁移到文件存储
    if (isTauri()) {
      const success = await writeData(data);
      if (success) {
        // 清除 localStorage 数据
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROJECTS_KEY);
        localStorage.removeItem(PEOPLE_KEY);
        console.log('Data migrated from localStorage to file storage');
      }
    }

    return data;
  } catch (error) {
    console.error('Failed to migrate data from localStorage:', error);
    return null;
  }
};

export const clearLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(PEOPLE_KEY);
};