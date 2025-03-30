
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define TypeScript types for the user roles and statuses
type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT' | 'OBSERVER';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type AuditAction = 'UPDATE' | 'DELETE';
type AuditResource = 'USER';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  clientId?: string;
  securityVersion?: number;
  client?: {
    companyName: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface UserFormData {
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  clientId?: string;
}

export const useUsers = (searchQuery: string = '') => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('User')
        .select(`
          id, 
          email, 
          firstName, 
          lastName, 
          role, 
          status, 
          emailVerified,
          clientId,
          securityVersion,
          createdAt,
          updatedAt,
          client:clientId (
            companyName
          )
        `)
        .order('createdAt', { ascending: false });
      
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,firstName.ilike.%${searchQuery}%,lastName.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setUsers(data || []);
      }
    } catch (error: any) {
      console.error('Error in users fetch operation:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast]);

  const deleteUser = async (userId: string) => {
    try {
      // First check if this is a client user with related data
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('role, clientId')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      // If user is a client with assigned client ID, we may want to warn or handle differently
      if (userData.role === 'CLIENT' && userData.clientId) {
        // Option: Create an audit log entry
        await supabase
          .from('AuditLog')
          .insert({
            action: 'DELETE' as AuditAction,
            resource: 'USER' as AuditResource,
            details: { clientId: userData.clientId },
            userId: userId
          });
      }
      
      // Delete the user
      const { error } = await supabase
        .from('User')
        .delete()
        .eq('id', userId);
        
      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user: " + error.message,
          variant: "destructive"
        });
        return false;
      } else {
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "default"
        });
        await fetchUsers(); // Refresh the user list
        return true;
      }
    } catch (error: any) {
      console.error('Error in delete operation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred: " + error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const addUser = async (userData: UserFormData) => {
    try {
      // First, create auth record
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: userData.emailVerified,
        user_metadata: {
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      });
      
      if (authError) throw authError;
      
      // The user record in the `User` table will be created automatically by the `handle_new_user` trigger
      // We just need to update it with additional data
      const { error: updateError } = await supabase
        .from('User')
        .update({
          role: userData.role,
          status: userData.status,
          emailVerified: userData.emailVerified,
          clientId: userData.clientId || null
        })
        .eq('id', authData.user.id);
      
      if (updateError) throw updateError;
      
      // If role is STAFF, create a staff record
      if (userData.role === 'STAFF') {
        const { error: staffError } = await supabase
          .from('Staff')
          .insert({
            userId: authData.user.id,
            title: 'Staff Member',
            department: 'Default'
          });
        
        if (staffError) {
          console.error('Error creating staff record:', staffError);
          // Continue anyway, as the user has been created
        }
      }
      
      await fetchUsers(); // Refresh user list
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user: " + error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const editUser = async (userId: string, userData: Partial<UserFormData>) => {
    try {
      // Update the user record
      const { error } = await supabase
        .from('User')
        .update({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          status: userData.status,
          emailVerified: userData.emailVerified,
          clientId: userData.clientId
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // If updating password, we would use Auth API
      if (userData.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: userData.password }
        );
        
        if (passwordError) throw passwordError;
        
        // Increment security version to invalidate sessions
        await supabase.rpc('increment_security_version', { user_id: userId });
      }
      
      await fetchUsers(); // Refresh user list
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user: " + error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const changeRole = async (userId: string, newRole: UserRole) => {
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('User')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const oldRole = userData.role;
      
      // Update role in User table
      const { error: updateError } = await supabase
        .from('User')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // If new role is STAFF and wasn't before, create Staff record
      if (newRole === 'STAFF' && oldRole !== 'STAFF') {
        const { error: staffError } = await supabase
          .from('Staff')
          .insert({
            userId: userId,
            title: 'Staff Member',
            department: 'Default'
          });
        
        if (staffError) {
          console.warn('Error creating staff record:', staffError);
          // Continue anyway as role has been updated
        }
      }

      // Create audit log entry for the role change
      await supabase
        .from('AuditLog')
        .insert({
          action: 'UPDATE' as AuditAction,
          resource: 'USER' as AuditResource,
          details: { oldRole, newRole },
          userId: userId
        });
      
      await fetchUsers(); // Refresh user list
      return true;
    } catch (error: any) {
      console.error('Error changing user role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role: " + error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    fetchUsers,
    deleteUser,
    addUser,
    editUser,
    changeRole
  };
};
