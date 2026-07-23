import api from './api';
import type { DashboardStats, ActiveCollaborator, AIPrediction, TeamMember, WorkloadItem } from '../types';

export const dashboardService = {
  async getDirectionDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/direction');
    return data;
  },

  async getRTDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/rt');
    return data;
  },

  async getActiveCollaborators(): Promise<ActiveCollaborator[]> {
    const { data } = await api.get<ActiveCollaborator[]>('/dashboard/active-collaborators');
    return data;
  },

  async getAIPredictions(): Promise<AIPrediction> {
    const { data } = await api.get<AIPrediction>('/ai/predictions');
    return data;
  },

  async getTeamMembers(): Promise<TeamMember[]> {
    const { data } = await api.get<TeamMember[]>('/team/members');
    return data;
  },

  async getWorkload(): Promise<WorkloadItem[]> {
    const { data } = await api.get<WorkloadItem[]>('/dashboard/workload');
    return data;
  },
};
