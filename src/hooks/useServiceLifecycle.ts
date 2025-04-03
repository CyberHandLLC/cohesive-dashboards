import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/lib/hooks/use-role';
import { 
  ServiceLifecycleState, 
  ServiceLifecycleAction,
  ServiceLifecycleHistoryEntry,
  getValidNextActions,
  getNextState 
} from '@/types/serviceLifecycle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseServiceLifecycleProps {
  clientServiceId?: string;
}

export function useServiceLifecycle({ clientServiceId }: UseServiceLifecycleProps = {}) {
  const { toast } = useToast();
  const { role, userId } = useRole();
  const queryClient = useQueryClient();
  const [currentState, setCurrentState] = useState<ServiceLifecycleState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch the current lifecycle state for the service
  const { 
    data: serviceData,
    isLoading: isServiceLoading,
    error: serviceError,
    refetch: refetchService
  } = useQuery({
    queryKey: ['serviceLifecycle', clientServiceId],
    queryFn: async () => {
      if (!clientServiceId) return null;
      
      const { data, error } = await supabase
        .from('ClientService')
        .select('id, lifecycleState')
        .eq('id', clientServiceId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientServiceId,
  });

  // Fetch lifecycle history for the service
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['serviceLifecycleHistory', clientServiceId],
    queryFn: async () => {
      if (!clientServiceId) return [];
      
      const { data, error } = await supabase
        .from('ServiceLifecycleHistory')
        .select('*')
        .eq('clientServiceId', clientServiceId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientServiceId,
  });

  // Fetch pending events for the service
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['serviceLifecycleEvents', clientServiceId],
    queryFn: async () => {
      if (!clientServiceId) return [];
      
      const { data, error } = await supabase
        .from('ServiceLifecycleEvent')
        .select('*')
        .eq('clientServiceId', clientServiceId)
        .eq('isCompleted', false)
        .order('scheduledTime', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientServiceId,
  });

  // Fetch tasks for the service
  const {
    data: tasksData,
    isLoading: isTasksLoading,
    error: tasksError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['serviceLifecycleTasks', clientServiceId],
    queryFn: async () => {
      if (!clientServiceId) return [];
      
      const { data, error } = await supabase
        .from('ServiceLifecycleTask')
        .select(`
          *,
          event:eventId(clientServiceId, state, action)
        `)
        .eq('status', 'PENDING')
        .order('dueDate', { ascending: true });
      
      if (error) throw error;
      
      // Filter tasks for this service only
      return data?.filter(
        task => task.event?.clientServiceId === clientServiceId
      ) || [];
    },
    enabled: !!clientServiceId && (role === 'ADMIN' || role === 'STAFF'),
  });

  // Update the current state when serviceData changes
  useEffect(() => {
    if (serviceData?.lifecycleState) {
      setCurrentState(serviceData.lifecycleState as ServiceLifecycleState);
    }
  }, [serviceData]);

  // Calculate valid actions for the current user and service state
  const validActions = useCallback(() => {
    if (!currentState || !role) return [];
    
    return getValidNextActions(
      currentState as ServiceLifecycleState, 
      role as any // Cast to expected role type
    );
  }, [currentState, role]);

  // Transition mutation
  const { mutate: performTransition } = useMutation({
    mutationFn: async ({ 
      action, 
      comments 
    }: { 
      action: ServiceLifecycleAction; 
      comments?: string;
    }) => {
      if (!clientServiceId || !currentState || !userId) {
        throw new Error('Missing required data for service transition');
      }

      setIsTransitioning(true);

      // Get the next state based on current state and action
      const nextState = getNextState(currentState as ServiceLifecycleState, action);
      if (!nextState) {
        throw new Error(`Invalid transition: ${currentState} -> ${action}`);
      }

      // Create a history entry for this transition
      const { data, error } = await supabase
        .from('ServiceLifecycleHistory')
        .insert({
          clientServiceId,
          state: nextState,
          action,
          performedBy: userId,
          performedByRole: role,
          comments
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch queries to get updated data
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycle', clientServiceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleHistory', clientServiceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleEvents', clientServiceId] });
      
      toast({
        title: 'Service Updated',
        description: 'The service status has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error performing service transition:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service status. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsTransitioning(false);
    }
  });

  // Create a task mutation
  const { mutate: createTask } = useMutation({
    mutationFn: async ({ 
      eventId,
      title,
      description,
      assignedTo,
      dueDate,
      priority
    }: { 
      eventId: string;
      title: string;
      description?: string;
      assignedTo?: string;
      dueDate?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }) => {
      const { data, error } = await supabase
        .from('ServiceLifecycleTask')
        .insert({
          eventId,
          title,
          description,
          assignedTo,
          dueDate,
          priority: priority || 'MEDIUM',
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleTasks', clientServiceId] });
      toast({
        title: 'Task Created',
        description: 'A new service task has been created.',
      });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Create an event mutation
  const { mutate: createEvent } = useMutation({
    mutationFn: async ({ 
      action,
      scheduledTime,
      assignedTo,
      priority
    }: { 
      action: ServiceLifecycleAction;
      scheduledTime?: string;
      assignedTo?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }) => {
      if (!clientServiceId || !currentState) {
        throw new Error('Missing required data for event creation');
      }

      // Get the next state based on current state and action
      const nextState = getNextState(currentState as ServiceLifecycleState, action);
      if (!nextState) {
        throw new Error(`Invalid transition: ${currentState} -> ${action}`);
      }

      const { data, error } = await supabase
        .from('ServiceLifecycleEvent')
        .insert({
          clientServiceId,
          state: nextState,
          action,
          scheduledTime,
          assignedTo,
          priority: priority || 'MEDIUM',
          isCompleted: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleEvents', clientServiceId] });
      toast({
        title: 'Event Scheduled',
        description: 'A new service event has been scheduled.',
      });
    },
    onError: (error) => {
      console.error('Error scheduling event:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule event. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Complete task mutation
  const { mutate: completeTask } = useMutation({
    mutationFn: async ({ 
      taskId 
    }: { 
      taskId: string;
    }) => {
      if (!userId) {
        throw new Error('User ID is required to complete a task');
      }

      const { data, error } = await supabase
        .from('ServiceLifecycleTask')
        .update({
          status: 'COMPLETED',
          completedBy: userId,
          completedAt: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleTasks', clientServiceId] });
      toast({
        title: 'Task Completed',
        description: 'The task has been marked as completed.',
      });
    },
    onError: (error) => {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Complete event mutation
  const { mutate: completeEvent } = useMutation({
    mutationFn: async ({ 
      eventId,
      comments
    }: { 
      eventId: string;
      comments?: string;
    }) => {
      // First get the event details
      const { data: eventData, error: eventError } = await supabase
        .from('ServiceLifecycleEvent')
        .select('*')
        .eq('id', eventId)
        .single();
        
      if (eventError) throw eventError;
      
      if (!eventData) {
        throw new Error('Event not found');
      }
      
      // Update the event to completed
      const { error: updateError } = await supabase
        .from('ServiceLifecycleEvent')
        .update({
          isCompleted: true,
          completedTime: new Date().toISOString()
        })
        .eq('id', eventId);
        
      if (updateError) throw updateError;
      
      // Create a service history entry
      const { data: historyData, error: historyError } = await supabase
        .from('ServiceLifecycleHistory')
        .insert({
          clientServiceId: eventData.clientServiceId,
          state: eventData.state,
          action: eventData.action,
          performedBy: userId,
          performedByRole: role,
          comments
        })
        .select()
        .single();
        
      if (historyError) throw historyError;
      
      return historyData;
    },
    onSuccess: () => {
      // Invalidate and refetch all relevant queries
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycle', clientServiceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleHistory', clientServiceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleEvents', clientServiceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleTasks', clientServiceId] });
      
      toast({
        title: 'Event Completed',
        description: 'The service event has been completed successfully.',
      });
    },
    onError: (error) => {
      console.error('Error completing event:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete event. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Cancel event mutation
  const { mutate: cancelEvent } = useMutation({
    mutationFn: async ({ 
      eventId,
      reason
    }: { 
      eventId: string;
      reason?: string;
    }) => {
      // Delete the event
      const { error } = await supabase
        .from('ServiceLifecycleEvent')
        .delete()
        .eq('id', eventId);
        
      if (error) throw error;
      
      return { success: true, message: reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceLifecycleEvents', clientServiceId] });
      toast({
        title: 'Event Cancelled',
        description: 'The service event has been cancelled.',
      });
    },
    onError: (error) => {
      console.error('Error cancelling event:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel event. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchService();
    refetchHistory();
    refetchEvents();
    if (role === 'ADMIN' || role === 'STAFF') {
      refetchTasks();
    }
  }, [refetchService, refetchHistory, refetchEvents, refetchTasks, role]);

  return {
    // Current state and data
    currentState,
    historyData,
    eventsData,
    tasksData,
    
    // Loading states
    isLoading: isServiceLoading || isHistoryLoading || isEventsLoading || isTasksLoading,
    isTransitioning,
    
    // Errors
    error: serviceError || historyError || eventsError || tasksError,
    
    // Actions
    validActions: validActions(),
    performTransition,
    createTask,
    createEvent,
    completeTask,
    completeEvent,
    cancelEvent,
    refetchAll
  };
}
