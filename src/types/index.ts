export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export interface IProject {
  _id: string;
  name: string;
  description: string;
  admin: IUser | string;
  members: (IUser | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedTo: IUser | string | null;
  projectId: IProject | string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
