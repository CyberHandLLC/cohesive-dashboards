
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  progress: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  userId: string;
  progress?: number;
  status?: string;
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  progress?: number;
  status?: string;
  dueDate?: string;
}

export const useStaffTasks = (staffId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchTasks = async (userId?: string) => {
    setIsLoading(true);
    try {
      const queryUserId = userId || staffId;
      
      if (!queryUserId) {
        throw new Error('No staff ID provided');
      }

      const { data, error } = await supabase
        .from('Task')
        .select('*')
        .eq('userId', queryUserId);

      if (error) {
        throw error;
      }

      setTasks(data || []);
      return data;
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('Task')
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          userId: taskData.userId,
          progress: taskData.progress || 0,
          status: taskData.status || 'PENDING',
          dueDate: taskData.dueDate || null
        });

      if (error) {
        throw error;
      }

      await fetchTasks(taskData.userId);
      return true;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateTask = async (taskId: string, taskData: UpdateTaskData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('Task')
        .update({
          ...(taskData.title !== undefined && { title: taskData.title }),
          ...(taskData.description !== undefined && { description: taskData.description }),
          ...(taskData.progress !== undefined && { progress: taskData.progress }),
          ...(taskData.status !== undefined && { status: taskData.status }),
          ...(taskData.dueDate !== undefined && { dueDate: taskData.dueDate })
        })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('Task')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const getTasksByStatus = async (status: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from('Task')
        .select('*')
        .eq('status', status);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error(`Error fetching tasks with status ${status}:`, error);
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
  };

  const getTaskCompletion = async (userId: string): Promise<{completed: number, total: number}> => {
    try {
      // Get completed tasks
      const { data: completedTasks, error: completedError } = await supabase
        .from('Task')
        .select('id', { count: 'exact' })
        .eq('userId', userId)
        .eq('status', 'COMPLETED');
      
      if (completedError) throw completedError;
      
      // Get total tasks
      const { count: totalCount, error: totalError } = await supabase
        .from('Task')
        .select('id', { count: 'exact' })
        .eq('userId', userId);
      
      if (totalError) throw totalError;
      
      return {
        completed: completedTasks?.length || 0,
        total: totalCount || 0
      };
    } catch (error: any) {
      console.error('Error getting task completion stats:', error);
      return { completed: 0, total: 0 };
    }
  };

  return {
    tasks,
    isLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getTaskCompletion
  };
};
