export type UserRole = 'citizen' | 'admin';

export type RequestStatus = 'submitted' | 'in_review' | 'resolved' | 'rejected';

export type RequestCategory = 'pothole' | 'permit' | 'noise' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: Date;
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  category: RequestCategory;
  title: string;
  description: string;
  status: RequestStatus;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: Date;
}

export interface StatusUpdatedPayload {
  requestId: string;
  userId: string;
  newStatus: RequestStatus;
  adminNote?: string;
}

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: UserRole };
    }
  }
}
