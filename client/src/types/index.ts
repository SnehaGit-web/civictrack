export type UserRole = 'citizen' | 'admin';
export type RequestStatus = 'submitted' | 'in_review' | 'resolved' | 'rejected';
export type RequestCategory = 'pothole' | 'permit' | 'noise' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  category: RequestCategory;
  title: string;
  description: string;
  status: RequestStatus;
  admin_note: string | null;
  citizen_name?: string;
  citizen_email?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}