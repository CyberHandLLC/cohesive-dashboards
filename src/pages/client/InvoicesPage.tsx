
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Search, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge';
import InvoiceDetailsDialog from '@/components/invoices/InvoiceDetailsDialog';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';

const ClientInvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{ id: string; companyName: string } | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Invoices' }
  ];

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data, error } = await supabase
          .from('User')
          .select('clientId')
          .eq('id', user.id)
          .single();
        
        if (error || !data.clientId) {
          console.error('Error fetching client ID:', error);
          return;
        }
        
        // Get client info
        const { data: clientData, error: clientError } = await supabase
          .from('Client')
          .select('id, companyName')
          .eq('id', data.clientId)
          .single();
        
        if (clientError) {
          console.error('Error fetching client details:', clientError);
          return;
        }
        
        setClientInfo(clientData);
        fetchInvoices(clientData.id);
      } catch (error) {
        console.error('Error in client fetch operation:', error);
      }
    };

    fetchClientInfo();
  }, []);

  const fetchInvoices = async (clientId: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('Invoice')
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate total outstanding and paid amounts
      const outstandingAmount = data
        .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      const paidAmount = data
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      setTotalOutstanding(outstandingAmount);
      setTotalPaid(paidAmount);
      
      // Filter by search term if needed
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = data.filter(inv => 
          (inv.invoiceNumber?.toLowerCase().includes(term) || false) ||
          inv.status.toLowerCase().includes(term)
        );
        setInvoices(filtered);
      } else {
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientInfo) {
      fetchInvoices(clientInfo.id);
    }
  }, [statusFilter, searchTerm, clientInfo]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const invoiceNumMatch = invoice.invoiceNumber?.toLowerCase().includes(term) || false;
      const statusMatch = invoice.status.toLowerCase().includes(term);
      return invoiceNumMatch || statusMatch;
    }
    return true;
  });

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Invoices</h1>
        </div>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalOutstanding)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-[200px]">
                <Select
                  value={statusFilter || ''}
                  onValueChange={(value) => setStatusFilter(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(searchTerm || statusFilter) && (
                <Button variant="ghost" onClick={resetFilters} className="md:self-start">
                  Reset
                </Button>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading invoices...</p>
              </div>
            ) : filteredInvoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber || invoice.id.slice(0, 8)}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setViewingInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No invoices found</p>
                {(searchTerm || statusFilter) && (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters} 
                    className="mt-4"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog
        invoice={viewingInvoice}
        open={!!viewingInvoice}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
        clientName={clientInfo?.companyName}
      />
    </DashboardLayout>
  );
};

export default ClientInvoicesPage;
