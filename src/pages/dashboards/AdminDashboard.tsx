
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CreditCard, BarChart2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState<number>(0);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch client count
        const { count: clientCountResult, error: clientCountError } = await supabase
          .from('Client')
          .select('*', { count: 'exact', head: true });
        
        if (!clientCountError && clientCountResult !== null) {
          setClientCount(clientCountResult);
        }
        
        // Fetch recent clients
        const { data: recentClientsData, error: recentClientsError } = await supabase
          .from('Client')
          .select('id, companyName, status, websiteUrl, serviceStartDate')
          .order('createdAt', { ascending: false })
          .limit(5);
        
        if (!recentClientsError && recentClientsData) {
          setRecentClients(recentClientsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard' }
  ];

  const stats = [
    {
      title: "Total Clients",
      value: isLoading ? "Loading..." : clientCount,
      icon: <Users className="h-4 w-4" />,
      description: "Active client accounts",
      trend: { value: 12, positive: true },
    },
    {
      title: "Monthly Revenue",
      value: "$24,565",
      icon: <CreditCard className="h-4 w-4" />,
      description: "Current billing period",
      trend: { value: 8, positive: true },
    },
    {
      title: "Active Services",
      value: "124",
      icon: <BarChart2 className="h-4 w-4" />,
      description: "Across all clients",
      trend: { value: 5, positive: true },
    },
    {
      title: "System Health",
      value: "99.8%",
      icon: <Activity className="h-4 w-4" />,
      description: "Last 30 days uptime",
      trend: { value: 0.2, positive: true },
    },
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="Dashboard"
    >
      <div className="space-y-8">
        <StatsGrid stats={stats} />
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Clients</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-4">Loading client data...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Client Name</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Website</th>
                          <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Since</th>
                          <th className="text-right py-3 px-4 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClients.map((client) => (
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
                              {client.websiteUrl ? (
                                <a 
                                  href={client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {client.websiteUrl.replace(/^https?:\/\//, '')}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">Not available</span>
                              )}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              {client.serviceStartDate ? (
                                new Date(client.serviceStartDate).toLocaleDateString()
                              ) : (
                                <span className="text-muted-foreground">Not started</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/admin/accounts/clients/${client.id}/overview`}>View</a>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced analytics and reporting will be shown here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Scheduled and custom reports will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
