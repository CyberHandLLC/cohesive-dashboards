
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useClientId = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientId = async () => {
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
        
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('clientId')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching client ID:', userError);
          setError('Could not fetch client information');
          toast({
            title: "Error",
            description: "Could not fetch client information",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

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

    fetchClientId();
  }, [toast]);

  return { clientId, userId, isLoading, error };
};
