
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
  const { userId, role } = useRole();
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
        if (role === 'CLIENT') {
          // Fetch clientId for client role
          const { data: userData, error: userError } = await supabase
            .from('User')
            .select('clientId')
            .eq('id', userId)
            .single();

          if (userError) throw new Error('Could not fetch client information');
          
          setClientId(userData?.clientId || null);
        } else if (role === 'STAFF') {
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

    if (userId) {
      fetchIdData();
    } else {
      setIsLoading(false);
    }
  }, [userId, role]);

  return { userId, clientId, staffId, isLoading, error };
}
