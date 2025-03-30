
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole as Role } from '@/types/user';

export type UserRole = Role | null;

export const useRole = (): { role: UserRole, isLoading: boolean } => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setRole(null);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('User')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else {
        // Convert the role to lowercase for our component props
        setRole(data.role.toLowerCase() as UserRole);
      }
      
      setIsLoading(false);
    };
    
    fetchUserRole();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { role, isLoading };
};
