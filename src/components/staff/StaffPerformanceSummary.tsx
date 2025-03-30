
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StaffMember {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  title: string | null;
  department: string | null;
}

interface PerformanceMetrics {
  ticketsResolved: number;
  ticketsTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  avgResolutionDays: number | null;
  clientSatisfactionRate: number | null;
  monthlyPerformance: {
    name: string;
    tickets: number;
    tasks: number;
  }[];
}

interface StaffPerformanceSummaryProps {
  staffId?: string;
  userId?: string;
}

const StaffPerformanceSummary = ({ staffId, userId }: StaffPerformanceSummaryProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
    ticketsResolved: 0,
    ticketsTotal: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    avgResolutionDays: null,
    clientSatisfactionRate: null,
    monthlyPerformance: []
  });

  useEffect(() => {
    if (userId) {
      fetchPerformanceData(userId);
    }
  }, [userId]);

  const fetchPerformanceData = async (userIdToFetch: string) => {
    setIsLoading(true);
    try {
      // Get resolved tickets
      const { data: resolvedTickets, error: ticketsError } = await supabase
        .from('SupportTicket')
        .select('id', { count: 'exact' })
        .eq('staffId', userIdToFetch)
        .eq('status', 'RESOLVED');
        
      if (ticketsError) throw ticketsError;
      
      // Get total tickets
      const { count: totalTickets, error: totalTicketsError } = await supabase
        .from('SupportTicket')
        .select('id', { count: 'exact' })
        .eq('staffId', userIdToFetch);
        
      if (totalTicketsError) throw totalTicketsError;
      
      // Get completed tasks
      const { data: completedTasks, error: tasksError } = await supabase
        .from('Task')
        .select('id', { count: 'exact' })
        .eq('userId', userIdToFetch)
        .eq('status', 'COMPLETED');
        
      if (tasksError) throw tasksError;
      
      // Get total tasks
      const { count: totalTasks, error: totalTasksError } = await supabase
        .from('Task')
        .select('id', { count: 'exact' })
        .eq('userId', userIdToFetch);
        
      if (totalTasksError) throw totalTasksError;

      // For demo purposes, generate some mock monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlyPerformance = months.map(month => ({
        name: month,
        tickets: Math.floor(Math.random() * 15) + 1,
        tasks: Math.floor(Math.random() * 10) + 1
      }));
      
      setPerformanceData({
        ticketsResolved: resolvedTickets?.length || 0,
        ticketsTotal: totalTickets || 0,
        tasksCompleted: completedTasks?.length || 0,
        tasksTotal: totalTasks || 0,
        avgResolutionDays: 2.5, // Mock data
        clientSatisfactionRate: 86, // Mock data
        monthlyPerformance
      });
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading performance data...</div>
        </CardContent>
      </Card>
    );
  }

  const ticketPercentage = performanceData.ticketsTotal > 0 
    ? Math.round((performanceData.ticketsResolved / performanceData.ticketsTotal) * 100) 
    : 0;
  
  const taskPercentage = performanceData.tasksTotal > 0
    ? Math.round((performanceData.tasksCompleted / performanceData.tasksTotal) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Support Tickets</span>
                <Badge variant="outline">{performanceData.ticketsResolved}/{performanceData.ticketsTotal}</Badge>
              </div>
              <Progress value={ticketPercentage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks</span>
                <Badge variant="outline">{performanceData.tasksCompleted}/{performanceData.tasksTotal}</Badge>
              </div>
              <Progress value={taskPercentage} className="h-2" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Monthly Performance</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData.monthlyPerformance}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#8884d8" name="Tickets" />
                  <Bar dataKey="tasks" fill="#82ca9d" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-md">
              <div className="text-sm font-medium text-muted-foreground mb-2">Avg. Resolution Time</div>
              <div className="text-2xl font-bold">{performanceData.avgResolutionDays} days</div>
            </div>
            <div className="p-4 border rounded-md">
              <div className="text-sm font-medium text-muted-foreground mb-2">Client Satisfaction</div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{performanceData.clientSatisfactionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceSummary;
