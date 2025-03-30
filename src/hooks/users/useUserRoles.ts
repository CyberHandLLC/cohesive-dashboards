
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types/user';

export const useUserRoles = () => {
  const { toast } = useToast();

  const changeRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('User')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // If changing to staff role, create staff record if it doesn't exist
      if (newRole === 'STAFF') {
        // Check if staff record exists
        const { data: existingStaff } = await supabase
          .from('Staff')
          .select('id')
          .eq('userId', userId)
          .single();
        
        if (!existingStaff) {
          // Create staff record
          const { error: staffError } = await supabase
            .from('Staff')
            .insert({
              userId: userId,
              title: 'New Staff Member',
              department: 'Unassigned'
            });
          
          if (staffError) throw staffError;
        }
      }
      
      // Log the role change
      await supabase
        .from('AuditLog')
        .insert({
          userId: userId, 
          action: 'UPDATE',
          resource: 'USER',
          details: { role: { from: 'PREVIOUS', to: newRole } },
          status: 'SUCCESS'
        });
      
      return true;
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast({
        title: "Failed to change role",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    changeRole
  };
};
