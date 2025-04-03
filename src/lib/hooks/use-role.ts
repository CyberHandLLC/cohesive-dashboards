import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole as Role } from '@/types/user';

export type UserRole = Role | null;

export const useRole = (): { role: UserRole, userId: string | null, isLoading: boolean } => {
  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setRole(null);
        setUserId(null);
        setIsLoading(false);
        return;
      }
      
      // Set the userId from the session
      setUserId(session.user.id);
      
      const { data, error } = await supabase
        .from('User')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else {
        // Keep the role in its original case from the database
        setRole(data.role);
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
  
  return { role, userId, isLoading };
};
