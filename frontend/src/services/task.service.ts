import api from './api';
import { TaskStatus } from '../types';
import type { Task } from '../types';

export const taskService = {
  async getByProject(projectId: number): Promise<Task[]> {
    const { data } = await api.get<Task[]>(`/tasks/project/${projectId}`);
    return data;
  },

  async getByUser(userId: number): Promise<Task[]> {
    const { data } = await api.get<Task[]>(`/tasks/user/${userId}`);
    return data;
  },

  async create(task: Partial<Task>): Promise<Task> {
    const { data } = await api.post<Task>('/tasks', task);
    return data;
  },

  async updateProgress(taskId: number, progressPercent: number, status?: TaskStatus, technicalComment?: string): Promise<Task> {
    const { data } = await api.put<Task>('/tasks/progress', {
      taskId,
      progressPercent,
      status,
      technicalComment,
    });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
