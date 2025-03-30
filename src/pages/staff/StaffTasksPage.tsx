
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from '@/hooks/useClientId';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';

const StaffTasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const { userId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Tasks' }
  ];

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, searchQuery, statusFilter, priorityFilter, typeFilter, dueDateFilter]);

  const fetchTasks = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch Tasks
      let query = supabase
        .from('Task')
        .select('*')
        .eq('userId', userId);
        
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter.toUpperCase());
      }
        
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
        
      if (dueDateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDateFilter === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query = query.gte('dueDate', today.toISOString()).lt('dueDate', tomorrow.toISOString());
        } else if (dueDateFilter === 'week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          query = query.lt('dueDate', nextWeek.toISOString());
        } else if (dueDateFilter === 'month') {
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          query = query.lt('dueDate', nextMonth.toISOString());
        }
      }
        
      const { data: taskData, error: taskError } = await query.order('dueDate', { ascending: true });
      
      if (taskError) {
        throw taskError;
      }
      
      // Fetch supplementary data like support tickets and leads if needed
      // This is a simplified version - in a real app you might want to include 
      // tickets that need attention as tasks, leads that need follow-up, etc.
      
      setTasks(taskData || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Could not fetch task data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('Task')
        .update({ 
          status: newStatus, 
          updatedAt: new Date().toISOString()
        })
        .eq('id', taskId);
        
      if (error) throw error;
      
      toast({
        title: "Task updated",
        description: `Task status changed to ${newStatus}`,
      });
      
      // Optimistically update the UI
      setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Could not update task status",
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setDueDateFilter('all');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" /> High
        </span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800">
          Medium
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
          Low
        </span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
        </span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
          In Progress
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
          Pending
        </span>;
    }
  };

  // Display loading or error state
  if (userIdLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex justify-center items-center h-[60vh]">
          <p>Loading user information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (userIdError) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p>{userIdError}</p>
          <Button asChild variant="outline">
            <Link to="/login">Log in again</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="staff"
      title="Task Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Due Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="week">Due This Week</SelectItem>
                    <SelectItem value="month">Due This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  <Filter className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading tasks...</p>
              </div>
            ) : tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {task.description ? (
                            task.description.length > 50 
                              ? `${task.description.substring(0, 50)}...` 
                              : task.description
                          ) : (
                            <span className="text-muted-foreground">No description</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <span className={`${
                              new Date(task.dueDate) < new Date() ? 'text-red-600' : ''
                            }`}>
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{task.progress}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {task.status !== 'COMPLETED' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                            >
                              Complete
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(task.id, 'PENDING')}
                            >
                              Reopen
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-xl mb-1">All caught up!</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  You've completed all your tasks or no tasks match your current filters.
                </p>
                {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters} className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffTasksPage;
