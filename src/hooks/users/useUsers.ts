
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdAt: string;
}

export const useUsers = (searchQuery: string = '') => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('User')
        .select('id, email, firstName, lastName, role, status, createdAt')
        .order('createdAt', { ascending: false });
      
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,firstName.ilike.%${searchQuery}%,lastName.ilike.%${searchQuery}%`);
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
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('User')
        .delete()
        .eq('id', userId);
        
      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user",
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
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  return {
    users,
    isLoading,
    fetchUsers,
    deleteUser
  };
};
