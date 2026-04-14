import api from './axios';
import type { AuthResponse, ServiceRequest, Notification } from '../types';

export const register = (email: string, password: string, name: string) =>
  api.post<AuthResponse>('/auth/register', { email, password, name });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password });

export const getRequests = () =>
  api.get<ServiceRequest[]>('/requests');

export const createRequest = (data: { category: string; title: string; description: string }) =>
  api.post<ServiceRequest>('/requests', data);

export const updateRequestStatus = (id: string, status: string, admin_note?: string) =>
  api.patch<ServiceRequest>(`/requests/${id}/status`, { status, admin_note });

export const getNotifications = () =>
  api.get<Notification[]>('/notifications');

export const markAllRead = () =>
  api.patch('/notifications/read-all');

export const getAdminStats = () =>
  api.get<{
    total: number;
    byStatus: { status: string; count: string }[];
    byCategory: { category: string; count: string }[];
  }>('/admin/stats');