
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Activity, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const StaffDashboard = () => {
  const [staffData, setStaffData] = useState<any>(null);
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStaffData = async () => {
      setIsLoading(true);
      
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No active session found');
          return;
        }
        
        // Get the staff data
        const { data: staffData, error: staffError } = await supabase
          .from('Staff')
          .select('*')
          .eq('userId', session.user.id)
          .single();
        
        if (staffError || !staffData) {
          console.error('Error fetching staff data:', staffError);
          return;
        }
        
        setStaffData(staffData);
        
        // Get assigned clients
        const { data: clientData, error: clientError } = await supabase
          .from('Client')
          .select('id, companyName, status, industry')
          .eq('accountManagerId', staffData.id)
          .limit(5);
        
        if (!clientError && clientData) {
          setAssignedClients(clientData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStaffData();
  }, []);

  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Dashboard' }
  ];

  const stats = [
    {
      title: "Assigned Clients",
      value: assignedClients.length,
      icon: <Users className="h-4 w-4" />,
      description: "Under management",
    },
    {
      title: "Open Tickets",
      value: "8",
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Requiring attention",
    },
    {
      title: "Active Leads",
      value: "12",
      icon: <Target className="h-4 w-4" />,
      description: "In progress",
    },
    {
      title: "Task Completion",
      value: "87%",
      icon: <Activity className="h-4 w-4" />,
      description: "Last 30 days",
    },
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="staff"
    >
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold">
                  Staff Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Overview of your assigned clients, tickets, and tasks
                </p>
              </div>
            </div>
            
            <StatsGrid stats={stats} />
            
            <Tabs defaultValue="clients" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
              </TabsList>
              
              <TabsContent value="clients" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assigned Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignedClients.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">Client Name</th>
                              <th className="text-left py-3 px-4 font-medium">Status</th>
                              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Industry</th>
                              <th className="text-right py-3 px-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedClients.map((client) => (
                              <tr key={client.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{client.companyName}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    client.status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {client.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell">
                                  {client.industry || <span className="text-muted-foreground">Not specified</span>}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={`/staff/accounts/clients/${client.id}`}>View</a>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No clients are currently assigned to you
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/staff/accounts/clients">View All Clients</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Support Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                      Your assigned support tickets will appear here
                    </div>
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/staff/accounts/support">View All Tickets</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="leads">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                      Your assigned leads will appear here
                    </div>
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/staff/accounts/leads">View All Leads</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
