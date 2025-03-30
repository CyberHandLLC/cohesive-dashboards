
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
import { 
  AlertCircle, 
  Search, 
  CheckSquare, 
  Clock,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from '@/hooks/useClientId';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';

const StaffTasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState('all');
  
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
  }, [userId, searchQuery, statusFilter, timeRangeFilter]);

  const fetchTasks = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Task')
        .select('*')
        .eq('userId', userId);
      
      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      // Apply time range filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (timeRangeFilter === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query = query.gte('dueDate', today.toISOString()).lt('dueDate', tomorrow.toISOString());
      } else if (timeRangeFilter === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        query = query.gte('dueDate', today.toISOString()).lt('dueDate', nextWeek.toISOString());
      } else if (timeRangeFilter === 'month') {
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        query = query.gte('dueDate', today.toISOString()).lt('dueDate', nextMonth.toISOString());
      }
      
      const { data, error } = await query.order('dueDate', { ascending: true });
      
      if (error) throw error;
      
      setTasks(data || []);
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

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('Task')
        .update({ 
          status: newStatus,
          progress: newStatus === 'COMPLETED' ? 100 : 50
        })
        .eq('id', taskId);
        
      if (error) throw error;
      
      toast({
        title: "Task Updated",
        description: `Task status changed to ${newStatus}`,
      });
      
      // Update the local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus, progress: newStatus === 'COMPLETED' ? 100 : 50 } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
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
    setTimeRangeFilter('all');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
          Completed
        </span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
          In Progress
        </span>;
      default: // PENDING
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800">
          Pending
        </span>;
    }
  };

  const getProgressBar = (progress: number) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${
            progress >= 100 ? 'bg-green-600' : progress > 50 ? 'bg-blue-600' : 'bg-yellow-600'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  // Display loading or error state if needed
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
            <CheckSquare className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Due Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all' || timeRangeFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                )}
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
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                      <TableHead className="hidden sm:table-cell">Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="max-w-[300px] truncate">
                            {task.description || <span className="text-muted-foreground">No description</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {task.dueDate ? (
                            <span className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {getProgressBar(task.progress)}
                          <span className="text-xs text-muted-foreground">{task.progress}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === 'PENDING' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                              >
                                Complete
                              </Button>
                            )}
                            <Button variant="default" size="sm">
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-xl mb-1">No tasks found</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  You have no tasks assigned or none match your current filters.
                </p>
                {(searchQuery || statusFilter !== 'all' || timeRangeFilter !== 'all') && (
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
