import { useState, useEffect } from 'react';
import { useRole } from '@/lib/hooks/use-role';
import { supabase } from '@/integrations/supabase/client';

interface ClientIdData {
  userId: string | null;
  clientId: string | null;
  staffId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useClientId(): ClientIdData {
  const { userId, role, isLoading: roleIsLoading } = useRole();
  const [clientId, setClientId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIdData() {
      if (!userId) {
        setIsLoading(false);
        setError('No user ID found');
        return;
      }

      try {
        // First try to get user data regardless of role to ensure we have clientId
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('clientId, role')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw new Error('Could not fetch user information');
        }
        
        // Set clientId from user data if available
        if (userData?.clientId) {
          setClientId(userData.clientId);
        }
        
        // Check role (case-insensitive)
        const userRole = userData?.role?.toUpperCase() || role?.toUpperCase();
        
        if (userRole === 'CLIENT') {
          // We already set clientId from the userData above
          if (!userData?.clientId) {
            // Log this issue but don't throw an error
            console.warn('Client user without clientId association:', userId);
          }
        } else if (userRole === 'STAFF') {
          // Fetch staffId for staff role
          const { data: staffData, error: staffError } = await supabase
            .from('Staff')
            .select('id')
            .eq('userId', userId)
            .single();

          if (staffError) {
            console.error('Error fetching staff record:', staffError);
            // Don't throw an error as the user might be staff without a staff record
          } else {
            setStaffId(staffData?.id || null);
          }
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error in useClientId:', err);
        setError(err.message || 'An unknown error occurred');
        setIsLoading(false);
      }
    }

    if (userId && !roleIsLoading) {
      fetchIdData();
    } else if (!roleIsLoading) {
      setIsLoading(false);
    }
  }, [userId, role, roleIsLoading]);

  return { userId, clientId, staffId, isLoading, error };
}
