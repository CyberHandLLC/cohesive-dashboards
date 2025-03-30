
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/reports/DateRangePicker';

interface ClientReportsProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ClientReports: React.FC<ClientReportsProps> = ({ 
  startDate, 
  endDate, 
  dateRange, 
  setDateRange 
}) => {
  const [newClientsData, setNewClientsData] = useState<any[]>([]);
  const [clientStatusData, setClientStatusData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClientData();
  }, [startDate, endDate]);

  const fetchClientData = async () => {
    setIsLoading(true);
    try {
      // Fetch all clients for processing
      let query = supabase
        .from('Client')
        .select('id, companyName, status, createdAt');
        
      if (startDate) {
        query = query.gte('createdAt', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('createdAt', endDate.toISOString());
      }
      
      const { data: clientData, error: clientError } = await query;
      
      if (clientError) throw clientError;
      
      // Process clients by month for new clients over time
      const clientsByMonth = aggregateClientsByMonth(clientData || []);
      setNewClientsData(clientsByMonth);
      
      // Process clients by status
      const clientsByStatus = aggregateClientsByStatus(clientData || []);
      setClientStatusData(clientsByStatus);
    } catch (error: any) {
      console.error('Error fetching client data:', error.message);
      toast({
        title: "Error",
        description: "Could not fetch client reports.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateClientsByMonth = (data: any[]) => {
    // Group by month and count clients
    const monthGroups = data.reduce((acc: {[key: string]: number}, client) => {
      const monthKey = client.createdAt.substring(0, 7); // YYYY-MM format
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(monthGroups)
      .map(([month, count]) => ({
        month,
        clients: count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const aggregateClientsByStatus = (data: any[]) => {
    // Group by status and count clients
    const statusGroups = data.reduce((acc: {[key: string]: number}, client) => {
      const status = client.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(statusGroups)
      .map(([status, count]) => ({
        status,
        value: count
      }));
  };

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1);
    return format(date, 'MMM yyyy');
  };

  const handleExport = (reportType: string, data: any[]) => {
    try {
      // Convert data to CSV format
      let csvContent = '';
      
      if (reportType === 'new-clients') {
        csvContent = 'Month,New Clients\n';
        data.forEach(item => {
          csvContent += `${formatMonthLabel(item.month)},${item.clients}\n`;
        });
      } else if (reportType === 'client-status') {
        csvContent = 'Status,Count\n';
        data.forEach(item => {
          csvContent += `${item.status},${item.value}\n`;
        });
      }
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}-report.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `${reportType} report has been downloaded.`,
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renderNewClientsChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (newClientsData.length === 0) {
      return <div className="text-center py-10">No client data available for the selected period.</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={newClientsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonthLabel}
            label={{ value: 'Month', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            label={{ value: 'New Clients', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={formatMonthLabel}
          />
          <Line type="monotone" dataKey="clients" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderClientStatusChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (clientStatusData.length === 0) {
      return <div className="text-center py-10">No client status data available.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie
                data={clientStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {clientStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Clients']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Client Status Breakdown</h4>
          <div className="space-y-2">
            {clientStatusData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.status}</span>
                </div>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>New Clients Over Time</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('new-clients', newClientsData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderNewClientsChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Status Breakdown</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('client-status', clientStatusData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderClientStatusChart()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientReports;
