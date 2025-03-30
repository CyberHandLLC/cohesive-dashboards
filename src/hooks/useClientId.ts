
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useClientId = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('You must be logged in to view this page');
          toast({
            title: "Authentication Error",
            description: "You must be logged in to view this page",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setUserId(user.id);
        
        // Get user role and associated IDs
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('role, clientId')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          setError('Could not fetch user information');
          toast({
            title: "Error",
            description: "Could not fetch user information",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setUserRole(userData.role);

        // If client role, set clientId
        if (userData.role === 'CLIENT') {
          if (!userData?.clientId) {
            setError('User is not associated with a client');
            toast({
              title: "Access Error",
              description: "Your user account is not associated with a client",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          setClientId(userData.clientId);
        }

        // If staff role, get staff ID
        if (userData.role === 'STAFF') {
          const { data: staffData, error: staffError } = await supabase
            .from('Staff')
            .select('id')
            .eq('userId', user.id)
            .single();

          if (staffError) {
            console.error('Error fetching staff ID:', staffError);
            setError('Could not fetch staff information');
            toast({
              title: "Error", 
              description: "Could not fetch staff information",
              variant: "destructive",
            });
          } else if (staffData) {
            setStaffId(staffData.id);
          }
        }

      } catch (err) {
        console.error("Error fetching user data:", err);
        setError('Failed to load user information');
        toast({
          title: "Error",
          description: "Failed to load user information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  return { clientId, userId, staffId, userRole, isLoading, error };
};
