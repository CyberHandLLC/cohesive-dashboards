
import { supabase } from './client';
import { AuditAction, AuditResource, CreateAuditLogEntry } from '@/types/audit';
import { Json } from '@/types/supabase';

// Helper function to log actions to AuditLog
export async function logAction(entry: CreateAuditLogEntry) {
  try {
    const { error } = await supabase
      .from('AuditLog')
      .insert({
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details || {},
        ipAddress: entry.ipAddress,
        status: entry.status || 'SUCCESS'
      });
      
    if (error) {
      console.error('Error logging action:', error);
    }
    
    return { error };
  } catch (err) {
    console.error('Error in logAction:', err);
    return { error: err };
  }
}

// Type-safe versions of the most commonly used Supabase query patterns
export async function fetchById<T>(table: string, id: string): Promise<{ data: T | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
      
    return { data: data as T, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function insertRecord<T>(table: string, record: any): Promise<{ data: T | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single();
      
    return { data: data as T, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateRecord<T>(table: string, id: string, updates: any): Promise<{ data: T | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    return { data: data as T, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
