
import { Json } from './supabase';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'REGISTER' 
  | 'PASSWORD_RESET' 
  | 'PASSWORD_CHANGE' 
  | 'PROFILE_UPDATE' 
  | 'CREATE' 
  | 'READ' 
  | 'UPDATE' 
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT';

export type AuditResource = 
  | 'USER' 
  | 'CLIENT' 
  | 'STAFF' 
  | 'SERVICE' 
  | 'SERVICE_TIER' 
  | 'PACKAGE' 
  | 'SESSION' 
  | 'STATE_TRANSFER' 
  | 'CONTACT'
  | 'LEAD'
  | 'INVOICE'
  | 'SUPPORT_TICKET'
  | 'CATEGORY';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  details?: Json;
  ipAddress?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE';
}

export interface CreateAuditLogEntry {
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  details?: Record<string, any>;
  ipAddress?: string;
  status?: 'SUCCESS' | 'FAILURE';
}
