
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, UserFormData, UserRole } from '@/types/user';
import { useUserRoles } from './useUserRoles';
import { useUserDetails } from './useUserDetails';

export type { User, UserRole, UserStatus, UserFormData } from '@/types/user';

export const useUsers = (searchQuery = '') => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { changeRole } = useUserRoles();
  const { getUserById } = useUserDetails();

  // Add useEffect to call fetchUsers on initialization and when searchQuery changes
  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
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
          client:clientId (
            companyName
          ),
          createdAt,
          updatedAt
        `);
      
      if (searchQuery) {
        query = query.or(
          `email.ilike.%${searchQuery}%,firstName.ilike.%${searchQuery}%,lastName.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%`
        );
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (userData: UserFormData): Promise<boolean> => {
    try {
      // First create the auth user if password is provided
      if (userData.password) {
        const { error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: userData.emailVerified || false,
          user_metadata: {
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        });
        
        if (authError) throw authError;
      }
      
      // Then update the user record with additional data
      const { error } = await supabase
        .from('User')
        .update({
          role: userData.role,
          status: userData.status,
          emailVerified: userData.emailVerified || false,
          clientId: userData.clientId || null
        })
        .eq('email', userData.email);
      
      if (error) throw error;
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const editUser = async (userId: string, userData: Partial<UserFormData>): Promise<boolean> => {
    try {
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
      
      // Update auth user email if changed
      if (userData.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          { email: userData.email }
        );
        
        if (authError) throw authError;
      }
      
      // Log the edit action
      await supabase
        .from('AuditLog')
        .insert({
          userId: userId, 
          action: 'UPDATE',
          resource: 'USER',
          details: { changes: userData },
          status: 'SUCCESS'
        });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error editing user:', error);
      
      // Log failed edit attempt
      await supabase
        .from('AuditLog')
        .insert({
          userId: userId, 
          action: 'UPDATE',
          resource: 'USER',
          details: { changes: userData, error: error.message },
          status: 'FAILED'
        });
      
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Delete the user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
      // The user record in the User table will be deleted via trigger
      
      // Log the deletion
      await supabase
        .from('AuditLog')
        .insert({
          userId: userId, 
          action: 'DELETE',
          resource: 'USER',
          status: 'SUCCESS'
        });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Log failed deletion
      await supabase
        .from('AuditLog')
        .insert({
          userId: userId, 
          action: 'DELETE',
          resource: 'USER',
          details: { error: error.message },
          status: 'FAILED'
        });
      
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    users,
    isLoading,
    fetchUsers,
    addUser,
    editUser,
    deleteUser,
    changeRole,
    getUserById
  };
};
