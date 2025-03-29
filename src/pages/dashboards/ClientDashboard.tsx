
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, CreditCard, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ClientDashboard = () => {
  const [clientData, setClientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      value: "2",
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-4">
                    No recent invoices found
                  </p>
                  <div className="mt-2 text-center">
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
