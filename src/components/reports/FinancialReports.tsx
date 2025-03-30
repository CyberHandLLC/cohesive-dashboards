
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/reports/DateRangePicker';
import { DateRange } from 'react-day-picker';

interface FinancialReportsProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ 
  startDate, 
  endDate, 
  dateRange, 
  setDateRange 
}) => {
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [yearlyRevenueData, setYearlyRevenueData] = useState<any[]>([]);
  const [outstandingPaymentsData, setOutstandingPaymentsData] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchFinancialData();
  }, [startDate, endDate, clientFilter]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName')
        .order('companyName');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error.message);
    }
  };

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // Fetch monthly revenue data
      let query = supabase
        .from('Invoice')
        .select('amount, createdAt, status')
        .eq('status', 'PAID');
        
      if (startDate) {
        query = query.gte('createdAt', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('createdAt', endDate.toISOString());
      }
      
      if (clientFilter) {
        query = query.eq('clientId', clientFilter);
      }
      
      const { data: invoiceData, error: invoiceError } = await query;
      
      if (invoiceError) throw invoiceError;
      
      // Process monthly revenue data
      const monthlyData = aggregateByMonth(invoiceData || []);
      setMonthlyRevenueData(monthlyData);
      
      // Process yearly revenue data
      const yearlyData = aggregateByYear(invoiceData || []);
      setYearlyRevenueData(yearlyData);
      
      // Fetch outstanding payments
      let outstandingQuery = supabase
        .from('Invoice')
        .select('amount, clientId, Client(companyName)')
        .eq('status', 'PENDING');
        
      if (clientFilter) {
        outstandingQuery = outstandingQuery.eq('clientId', clientFilter);
      }
      
      const { data: outstandingData, error: outstandingError } = await outstandingQuery;
      
      if (outstandingError) throw outstandingError;
      
      const outstandingByClient = aggregateOutstandingByClient(outstandingData || []);
      setOutstandingPaymentsData(outstandingByClient);
      
      // Fetch overdue invoices
      let overdueQuery = supabase
        .from('Invoice')
        .select('id, amount, dueDate, invoiceNumber, clientId, Client(companyName)')
        .eq('status', 'OVERDUE');
        
      if (clientFilter) {
        overdueQuery = overdueQuery.eq('clientId', clientFilter);
      }
      
      const { data: overdueData, error: overdueError } = await overdueQuery;
      
      if (overdueError) throw overdueError;
      
      setOverdueInvoices(overdueData || []);
    } catch (error: any) {
      console.error('Error fetching financial data:', error.message);
      toast({
        title: "Error",
        description: "Could not fetch financial reports.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateByMonth = (data: any[]) => {
    // Group by month and sum amounts
    const monthGroups = data.reduce((acc: {[key: string]: number}, invoice) => {
      const monthKey = invoice.createdAt.substring(0, 7); // YYYY-MM format
      acc[monthKey] = (acc[monthKey] || 0) + invoice.amount;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(monthGroups)
      .map(([month, revenue]) => ({
        month,
        revenue
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const aggregateByYear = (data: any[]) => {
    // Group by year and sum amounts
    const yearGroups = data.reduce((acc: {[key: string]: number}, invoice) => {
      const yearKey = invoice.createdAt.substring(0, 4); // YYYY format
      acc[yearKey] = (acc[yearKey] || 0) + invoice.amount;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(yearGroups)
      .map(([year, revenue]) => ({
        year,
        revenue
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  };

  const aggregateOutstandingByClient = (data: any[]) => {
    // Group by client and sum amounts
    const clientGroups = data.reduce((acc: any[], invoice) => {
      const existingClient = acc.find(item => item.clientId === invoice.clientId);
      if (existingClient) {
        existingClient.amount += invoice.amount;
      } else {
        acc.push({
          clientId: invoice.clientId,
          clientName: invoice.Client?.companyName || 'Unknown Client',
          amount: invoice.amount
        });
      }
      return acc;
    }, []);
    
    return clientGroups.sort((a, b) => b.amount - a.amount);
  };

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1);
    return format(date, 'MMM yyyy');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExport = (reportType: string, data: any[]) => {
    try {
      // Convert data to CSV format
      let csvContent = '';
      
      switch (reportType) {
        case 'monthly-revenue':
          csvContent = 'Month,Revenue\n';
          data.forEach(item => {
            csvContent += `${formatMonthLabel(item.month)},${item.revenue}\n`;
          });
          break;
          
        case 'yearly-revenue':
          csvContent = 'Year,Revenue\n';
          data.forEach(item => {
            csvContent += `${item.year},${item.revenue}\n`;
          });
          break;
          
        case 'outstanding':
          csvContent = 'Client,Amount\n';
          data.forEach(item => {
            csvContent += `${item.clientName},${item.amount}\n`;
          });
          break;
          
        case 'overdue':
          csvContent = 'Client,Amount,Due Date,Invoice Number\n';
          data.forEach(item => {
            csvContent += `${item.Client?.companyName || 'Unknown'},${item.amount},${format(parseISO(item.dueDate), 'yyyy-MM-dd')},${item.invoiceNumber || 'N/A'}\n`;
          });
          break;
          
        default:
          throw new Error('Unknown report type');
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

  const renderMonthlyRevenueChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (monthlyRevenueData.length === 0) {
      return <div className="text-center py-10">No revenue data available for the selected period.</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyRevenueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonthLabel} 
            label={{ value: 'Month', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            labelFormatter={formatMonthLabel}
          />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderYearlyRevenueChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (yearlyRevenueData.length === 0) {
      return <div className="text-center py-10">No yearly revenue data available.</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={yearlyRevenueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="w-full md:w-64">
          <Select value={clientFilter || 'all'} onValueChange={(value) => setClientFilter(value === 'all' ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Revenue</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('monthly-revenue', monthlyRevenueData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderMonthlyRevenueChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Yearly Revenue</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('yearly-revenue', yearlyRevenueData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderYearlyRevenueChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Outstanding Payments by Client</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('outstanding', outstandingPaymentsData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : outstandingPaymentsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-right py-3 px-4">Outstanding Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingPaymentsData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">
                        <a 
                          href={`/admin/accounts/clients/${item.clientId}/overview`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.clientName}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">No outstanding payments.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Overdue Invoices</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('overdue', overdueInvoices)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : overdueInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Due Date</th>
                    <th className="text-left py-3 px-4">Invoice Number</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="py-3 px-4">
                        <a 
                          href={`/admin/accounts/clients/${invoice.clientId}/overview`}
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.Client?.companyName || 'Unknown Client'}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4">{format(parseISO(invoice.dueDate), 'MMM dd, yyyy')}</td>
                      <td className="py-3 px-4">{invoice.invoiceNumber || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">No overdue invoices.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;
