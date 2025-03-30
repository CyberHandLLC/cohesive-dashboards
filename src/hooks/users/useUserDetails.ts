
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/user';

export const useUserDetails = () => {
  const { toast } = useToast();

  const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
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
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error loading user details",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    getUserById
  };
};
