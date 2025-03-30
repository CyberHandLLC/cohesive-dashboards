
import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Activity, Target, Calendar, List, Clock } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useClientId } from '@/hooks/useClientId';

const StaffDashboard = () => {
  const { userId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { dashboardData, isLoading, error } = useStaffDashboard(userId);

  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Dashboard' }
  ];

  const stats = [
    {
      title: "Assigned Clients",
      value: dashboardData.metrics.assignedClients,
      icon: <Users className="h-4 w-4" />,
      description: "Under management",
    },
    {
      title: "Open Tickets",
      value: dashboardData.metrics.openTickets,
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Requiring attention",
    },
    {
      title: "Active Leads",
      value: dashboardData.metrics.activeLeads,
      icon: <Target className="h-4 w-4" />,
      description: "In progress",
    },
    {
      title: "Pending Tasks",
      value: dashboardData.metrics.pendingTasks,
      icon: <Activity className="h-4 w-4" />,
      description: "Awaiting completion",
    },
  ];

  const isPageLoading = userIdLoading || isLoading;
  const pageError = userIdError || error;

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="staff"
    >
      <div className="space-y-8">
        {isPageLoading ? (
          <div className="flex justify-center py-8">Loading dashboard data...</div>
        ) : pageError ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-800">{pageError}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold">
                  Staff Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Overview of your assigned clients, tickets, leads, and tasks
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link to="/staff/tasks">View All Tasks</Link>
                </Button>
              </div>
            </div>
            
            <StatsGrid stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardData.recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="rounded-full bg-primary/10 p-1">
                            <Clock className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {activity.action} {activity.resource}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No recent activity found
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm">
                      View All Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <List className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/staff/accounts/clients">
                        <Users className="mr-2 h-4 w-4" />
                        View Clients
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/staff/accounts/support">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Support Tickets
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/staff/accounts/leads">
                        <Target className="mr-2 h-4 w-4" />
                        Manage Leads
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/staff/tasks">
                        <Calendar className="mr-2 h-4 w-4" />
                        Task Schedule
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
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
                    <CardDescription>Your most recently assigned clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentClients.length > 0 ? (
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
                            {dashboardData.recentClients.map((client) => (
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
                                    <Link to={`/staff/accounts/clients/${client.id}`}>View</Link>
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
                        <Link to="/staff/accounts/clients">View All Clients</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Support Tickets</CardTitle>
                    <CardDescription>Your most recently assigned tickets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentTickets.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">Title</th>
                              <th className="text-left py-3 px-4 font-medium">Status</th>
                              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Priority</th>
                              <th className="text-right py-3 px-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentTickets.map((ticket) => (
                              <tr key={ticket.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{ticket.title}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    ticket.status === 'OPEN' 
                                      ? 'bg-red-100 text-red-800' 
                                      : ticket.status === 'IN_PROGRESS'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {ticket.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell">
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    ticket.priority === 'HIGH' 
                                      ? 'bg-red-100 text-red-800' 
                                      : ticket.priority === 'MEDIUM'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {ticket.priority}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link to={`/staff/accounts/support/${ticket.id}`}>View</Link>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No support tickets are currently assigned to you
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/staff/accounts/support">View All Tickets</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="leads">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Leads</CardTitle>
                    <CardDescription>Your most recently assigned leads</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentLeads.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">Name</th>
                              <th className="text-left py-3 px-4 font-medium">Status</th>
                              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Source</th>
                              <th className="text-right py-3 px-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentLeads.map((lead) => (
                              <tr key={lead.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{lead.name}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    lead.status === 'NEW' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : lead.status === 'CONTACTED'
                                      ? 'bg-purple-100 text-purple-800'
                                      : lead.status === 'QUALIFIED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {lead.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell">
                                  {lead.leadSource || <span className="text-muted-foreground">Not specified</span>}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link to={`/staff/accounts/leads/${lead.id}`}>View</Link>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No leads are currently assigned to you
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/staff/accounts/leads">View All Leads</Link>
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
