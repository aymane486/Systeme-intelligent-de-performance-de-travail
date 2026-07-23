import api from './api';
import type { Project } from '../types';

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data } = await api.get<Project[]>('/projects');
    return data;
  },

  async getById(id: number): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  async getByTeam(teamId: number): Promise<Project[]> {
    const { data } = await api.get<Project[]>(`/projects/team/${teamId}`);
    return data;
  },

  async create(project: Partial<Project>): Promise<Project> {
    const { data } = await api.post<Project>('/projects', project);
    return data;
  },

  async update(id: number, project: Partial<Project>): Promise<Project> {
    const { data } = await api.put<Project>(`/projects/${id}`, project);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
