import api from './api';
import type { KeyStatus, TimeEntry } from '../types';

export const keyService = {
  async activate(taskId: number) {
    const { data } = await api.post('/key/activate', { taskId });
    return data;
  },

  async deactivate() {
    const { data } = await api.post('/key/deactivate');
    return data;
  },

  async pause() {
    const { data } = await api.post('/key/pause');
    return data;
  },

  async resume() {
    const { data } = await api.post('/key/resume');
    return data;
  },

  async getStatus(): Promise<KeyStatus> {
    const { data } = await api.get<KeyStatus>('/key/status');
    return data;
  },

  async getHistory(): Promise<TimeEntry[]> {
    const { data } = await api.get<TimeEntry[]>('/key/history');
    return data;
  },
};
