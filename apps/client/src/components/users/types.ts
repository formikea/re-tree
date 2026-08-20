import { UserRole } from '../../../types/auth';

export interface CreateUserFormData {
  email: string;
  name: string;
  role: UserRole;
  notes?: string;
}

export interface UpdateUserFormData {
  name: string;
  notes?: string;
}
