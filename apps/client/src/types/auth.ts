export type UserRole = 'USER' | 'MANAGER' | 'SUPER_ADMIN';

export interface User {
  id: number;
  email: string;
  name: string | null;
  organisationId: number;
  organisationName: string;
  role: UserRole;
  createdAt: string;
} 