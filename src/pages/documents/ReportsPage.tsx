
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, Download, BarChart2 } from 'lucide-react';

const ReportsPage = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [clientAcquisitionData, setClientAcquisitionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Documents', href: '/admin/documents' },
    { label: 'Reports' }
  ];

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch revenue data (example: monthly invoices total for the last 6 months)
      const months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toISOString().substring(0, 7); // Format as YYYY-MM
      }).reverse();
      
      // Fetch mock revenue data (in a real app, this would be from actual invoices)
      const mockRevenueData = months.map(month => ({
        month: month,
        revenue: Math.floor(Math.random() * 50000) + 10000 // Random value between 10000-60000
      }));
      
      setRevenueData(mockRevenueData);
      
      // Get actual client data from the database
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .select('createdAt');
        
      if (clientError) {
        throw new Error(clientError.message);
      }
      
      // Process client data into monthly acquisition
      const clientsByMonth = months.map(month => {
        const count = clientData?.filter(client => 
          client.createdAt.startsWith(month)
        ).length || 0;
        
        return {
          month,
          clients: count
        };
      });
      
      setClientAcquisitionData(clientsByMonth);
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error loading reports",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExportReport = (reportType: string) => {
    // In a real app, this would generate and download a CSV/PDF report
    toast({
      title: "Export initiated",
      description: `Exporting ${reportType} report...`,
    });
    console.log(`Exporting ${reportType} report`);
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        </div>
        
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            <TabsTrigger value="clients">Client Acquisition</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>Revenue analysis for the past 6 months</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport('revenue')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-24">
                    <p>Loading revenue data...</p>
                  </div>
                ) : (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={formatMonthLabel} 
                          label={{ 
                            value: 'Month', 
                            position: 'insideBottom', 
                            offset: -20 
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)}
                          label={{ 
                            value: 'Revenue', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          labelFormatter={formatMonthLabel}
                        />
                        <Bar dataKey="revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Client Acquisition</CardTitle>
                    <CardDescription>New clients by month</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport('client-acquisition')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-24">
                    <p>Loading client data...</p>
                  </div>
                ) : (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={clientAcquisitionData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={formatMonthLabel}
                          label={{ 
                            value: 'Month', 
                            position: 'insideBottom', 
                            offset: -20 
                          }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'New Clients', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [value, 'New Clients']}
                          labelFormatter={formatMonthLabel}
                        />
                        <Bar dataKey="clients" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>Performance metrics and statistics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport('performance')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>System Uptime</CardDescription>
                    <CardTitle className="text-2xl">99.8%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Last 30 days</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Average Response Time</CardDescription>
                    <CardTitle className="text-2xl">245ms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Last 24 hours</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Active Sessions</CardDescription>
                    <CardTitle className="text-2xl">87</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Current</p>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-lg">System Health Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Today, 09:15 AM</span>
                        <span className="text-green-500 font-medium">Database Backup Completed</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Yesterday, 11:45 PM</span>
                        <span className="text-amber-500 font-medium">Server Load Spike (Resolved)</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">June 22, 2023, 3:30 PM</span>
                        <span className="text-green-500 font-medium">System Update Successful</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Custom Reports</CardTitle>
            <CardDescription>Generate custom reports based on your requirements</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 justify-start">
              <FileText className="mr-4 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Client Services Report</div>
                <div className="text-sm text-muted-foreground">Active services across all clients</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 justify-start">
              <BarChart2 className="mr-4 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Financial Summary</div>
                <div className="text-sm text-muted-foreground">Revenue and expenses analysis</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
