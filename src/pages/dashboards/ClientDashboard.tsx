
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, CreditCard, MessageSquare, Calendar, FileText, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Sample service usage data for the chart
const serviceUsageData = [
  { name: 'Jan', Hosting: 100, SEO: 80, Content: 40 },
  { name: 'Feb', Hosting: 100, SEO: 82, Content: 45 },
  { name: 'Mar', Hosting: 100, SEO: 85, Content: 48 },
  { name: 'Apr', Hosting: 100, SEO: 90, Content: 52 },
  { name: 'May', Hosting: 100, SEO: 95, Content: 58 },
  { name: 'Jun', Hosting: 100, SEO: 100, Content: 65 }
];

// Sample recent invoices data
const recentInvoices = [
  { id: 'INV-001', date: '2023-06-01', amount: 350, status: 'PAID' },
  { id: 'INV-002', date: '2023-07-01', amount: 350, status: 'PAID' },
  { id: 'INV-003', date: '2023-08-01', amount: 400, status: 'PENDING' },
  { id: 'INV-004', date: '2023-09-01', amount: 400, status: 'UPCOMING' }
];

const ClientDashboard = () => {
  const [clientData, setClientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true);
      
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No active session found');
          return;
        }
        
        // Get the User record
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('clientId')
          .eq('id', session.user.id)
          .single();
        
        if (userError || !userData || !userData.clientId) {
          console.error('Error fetching user data or client ID:', userError);
          return;
        }
        
        // Get client data
        const { data: clientData, error: clientError } = await supabase
          .from('Client')
          .select('*')
          .eq('id', userData.clientId)
          .single();
        
        if (clientError || !clientData) {
          console.error('Error fetching client data:', clientError);
          return;
        }
        
        setClientData(clientData);

        // Get recent support tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('SupportTicket')
          .select('id, title, status, priority, createdAt')
          .eq('clientId', userData.clientId)
          .order('createdAt', { ascending: false })
          .limit(5);

        if (!ticketsError && ticketsData) {
          setSupportTickets(ticketsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientData();
  }, []);

  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Dashboard' }
  ];

  const stats = [
    {
      title: "Active Services",
      value: "3",
      icon: <Database className="h-4 w-4" />,
      description: "Current subscriptions",
    },
    {
      title: "Outstanding Invoices",
      value: "$1,200",
      icon: <CreditCard className="h-4 w-4" />,
      description: "Due in 15 days",
    },
    {
      title: "Support Tickets",
      value: supportTickets.length.toString(),
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Open tickets",
    },
    {
      title: "Next Review",
      value: "Oct 15",
      icon: <Calendar className="h-4 w-4" />,
      description: "Quarterly service review",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Check size={16} className="text-green-500" />;
      case 'PENDING':
        return <AlertCircle size={16} className="text-amber-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, {clientData?.companyName || 'Client'}
                </h1>
                <p className="text-muted-foreground">
                  Here's an overview of your services and account status
                </p>
              </div>
              <Button asChild>
                <a href="/client/accounts/support">Create Support Ticket</a>
              </Button>
            </div>
            
            <StatsGrid stats={stats} />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Usage Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ChartContainer 
                    config={{
                      Hosting: { theme: { light: "#4c1d95", dark: "#8b5cf6" } },
                      SEO: { theme: { light: "#0369a1", dark: "#0ea5e9" } },
                      Content: { theme: { light: "#15803d", dark: "#22c55e" } }
                    }}
                  >
                    <BarChart data={serviceUsageData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={(props) => (
                        <ChartTooltipContent {...props} />
                      )} />
                      <Legend />
                      <Bar dataKey="Hosting" fillOpacity={0.9} fill="var(--color-Hosting)" />
                      <Bar dataKey="SEO" fillOpacity={0.9} fill="var(--color-SEO)" />
                      <Bar dataKey="Content" fillOpacity={0.9} fill="var(--color-Content)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentInvoices.length > 0 ? (
                    <div className="space-y-4">
                      {recentInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex justify-between items-center border-b pb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(invoice.status)}
                            <div>
                              <p className="font-medium">{invoice.id}</p>
                              <p className="text-xs text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${invoice.amount}</p>
                            <p className={`text-xs ${
                              invoice.status === 'PAID' ? 'text-green-500' : 
                              invoice.status === 'PENDING' ? 'text-amber-500' : 'text-gray-500'
                            }`}>{invoice.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No recent invoices found
                    </p>
                  )}
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/client/accounts/invoices">View All Invoices</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center border-b pb-2">
                      <span>Website Hosting (Premium)</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span>SEO Optimization</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </li>
                    <li className="flex justify-between items-center pb-2">
                      <span>Content Management</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </li>
                  </ul>
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/client/accounts/services">Manage Services</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  {supportTickets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Ticket</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                            <th className="text-left py-3 px-4 font-medium">Priority</th>
                            <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supportTickets.map((ticket) => (
                            <tr key={ticket.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">{ticket.title}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                                  ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                                  ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ticket.status?.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  ticket.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  ticket.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {ticket.priority}
                                </span>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No recent support tickets found
                    </p>
                  )}
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/client/accounts/support">View All Tickets</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
