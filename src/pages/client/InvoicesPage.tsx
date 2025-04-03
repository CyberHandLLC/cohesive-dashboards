import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Search, CalendarIcon } from 'lucide-react';
import { useClientId } from '@/hooks/useClientId';
import { useClientInvoices } from '@/hooks/useClientInvoices';
import { formatCurrency } from '@/lib/formatters';
import InvoiceList from '@/components/client/InvoiceList';
import InvoiceDetailsDialog from '@/components/invoices/InvoiceDetailsDialog';
import ClientPaymentDialog from '@/components/client/ClientPaymentDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ClientInvoicesPage = () => {
  const { userId, clientId, isLoading: userIdLoading, error: userIdError } = useClientId();
  
  const {
    invoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    resetFilters,
    fetchInvoices,
    viewingInvoice,
    setViewingInvoice,
    payingInvoice,
    setPayingInvoice,
    processPayment,
    isSubmitting
  } = useClientInvoices(clientId);
  
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Invoices' }
  ];

  // Get summary metrics
  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE').length;

  // Fetch invoices when client ID is available or filters change
  useEffect(() => {
    if (clientId) {
      fetchInvoices();
    }
  }, [clientId, searchTerm, statusFilter, startDate, endDate]);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    // Status filter
    if (statusFilter && invoice.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const invoiceNumber = invoice.invoiceNumber || invoice.id.slice(0, 8);
      if (!invoiceNumber.toLowerCase().includes(searchTermLower)) {
        return false;
      }
    }
    
    return true;
  });

  // Handle viewing invoice details
  const handleViewDetails = (invoice: any) => {
    setViewingInvoice(invoice);
  };

  // Handle paying an invoice
  const handlePayInvoice = (invoice: any) => {
    setPayingInvoice(invoice);
  };

  // Display loading or error state if needed
  if (userIdLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="client"
      >
        <div className="flex justify-center items-center h-[60vh]">
          <p>Loading user information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (userIdError) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="client"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p>{userIdError}</p>
          <Button asChild variant="outline">
            <a href="/login">Log in again</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!clientId) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="client"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Client Record Not Found</h2>
          <p>Your user account is not associated with a client record</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="client"
      title="Invoice Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Invoices</h1>
        </div>
        
        {/* Invoice Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select 
                  value={statusFilter || 'ALL'} 
                  onValueChange={(value) => value === 'ALL' ? setStatusFilter(null) : setStatusFilter(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !startDate && !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && endDate ? (
                        `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: startDate || undefined,
                        to: endDate || undefined,
                      }}
                      onSelect={(range) => {
                        setStartDate(range?.from || null);
                        setEndDate(range?.to || null);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {(searchTerm || statusFilter || startDate || endDate) && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceList
              invoices={filteredInvoices}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onPayInvoice={handlePayInvoice}
              onResetFilters={resetFilters}
              hasFilters={!!searchTerm || !!statusFilter || !!startDate || !!endDate}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog
        invoice={viewingInvoice}
        open={!!viewingInvoice}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
        onMarkAsPaid={() => viewingInvoice && handlePayInvoice(viewingInvoice)}
      />
      
      {/* Payment Dialog */}
      <ClientPaymentDialog
        invoice={payingInvoice}
        open={!!payingInvoice}
        onOpenChange={(open) => !open && setPayingInvoice(null)}
        onSubmit={processPayment}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default ClientInvoicesPage;
