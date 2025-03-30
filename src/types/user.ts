
// Common user type definitions

export type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT' | 'OBSERVER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  clientId?: string;
  client?: {
    companyName: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface UserFormData {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  clientId?: string;
  password?: string;
}
