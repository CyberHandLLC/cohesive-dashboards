
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Summary metrics
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [overdueInvoices, setOverdueInvoices] = useState(0);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  const { toast } = useToast();

  // Load invoices with filters
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('Invoice')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (paymentMethodFilter) {
        query = query.eq('paymentMethod', paymentMethodFilter);
      }
      
      if (startDate) {
        query = query.gte('createdAt', startDate.toISOString());
      }
      
      if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('createdAt', endDateTime.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      // If search term is provided, filter the results
      let filteredData = data;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = data.filter((invoice: Invoice) => {
          // Check if invoice number contains search term
          const invoiceNumberMatch = invoice.invoiceNumber?.toLowerCase().includes(term);
          // Check if status contains search term
          const statusMatch = invoice.status.toLowerCase().includes(term);
          // Include client search in the component level since we have client names there
          
          return invoiceNumberMatch || statusMatch;
        });
      }
      
      setInvoices(filteredData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, paymentMethodFilter, startDate, endDate, toast]);

  // Load clients for display names
  const loadClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName');
      
      if (error) {
        throw error;
      }
      
      const clientMap: Record<string, string> = {};
      data.forEach((client: { id: string; companyName: string }) => {
        clientMap[client.id] = client.companyName;
      });
      
      setClients(clientMap);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, []);

  // Load summary metrics
  const loadMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      // Total invoices count
      const { count: totalCount, error: countError } = await supabase
        .from('Invoice')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalInvoices(totalCount || 0);
      
      // Total revenue (sum of PAID invoices)
      const { data: revenueData, error: revenueError } = await supabase
        .from('Invoice')
        .select('amount')
        .eq('status', 'PAID');
      
      if (revenueError) throw revenueError;
      const revenue = revenueData.reduce((sum, invoice) => sum + invoice.amount, 0);
      setTotalRevenue(revenue);
      
      // Outstanding amount (sum of PENDING invoices)
      const { data: outstandingData, error: outstandingError } = await supabase
        .from('Invoice')
        .select('amount')
        .eq('status', 'PENDING');
      
      if (outstandingError) throw outstandingError;
      const outstanding = outstandingData.reduce((sum, invoice) => sum + invoice.amount, 0);
      setOutstandingAmount(outstanding);
      
      // Overdue invoices count
      const { data: overdueData, error: overdueError } = await supabase
        .from('Invoice')
        .select('id')
        .eq('status', 'OVERDUE');
      
      if (overdueError) throw overdueError;
      setOverdueInvoices(overdueData.length);
      
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice metrics.',
        variant: 'destructive',
      });
    } finally {
      setIsMetricsLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    loadInvoices();
    loadClients();
    loadMetrics();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('invoice-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Invoice' }, 
        (payload) => {
          // Refresh data when changes occur
          loadInvoices();
          loadMetrics();
        }
      )
      .subscribe();
    
    return () => {
      // Cleanup subscription
      supabase.removeChannel(channel);
    };
  }, [loadInvoices, loadClients, loadMetrics]);

  // Create invoice
  const createInvoice = async (data: any) => {
    try {
      const { error } = await supabase
        .from('Invoice')
        .insert([data]);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      
      // Log audit action
      await logAuditAction('CREATE', 'INVOICE');
      
      loadInvoices();
      loadMetrics();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  };

  // Update invoice
  const updateInvoice = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('Invoice')
        .update(data)
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      
      // Log audit action
      await logAuditAction('UPDATE', 'INVOICE');
      
      loadInvoices();
      loadMetrics();
      setEditingInvoice(null);
      setViewingInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    }
  };

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    try {
      // Get invoice reference before deletion for audit log
      const invoiceRef = invoiceToDelete?.invoiceNumber || id;
      
      const { error } = await supabase
        .from('Invoice')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
      
      // Log audit action
      await logAuditAction('DELETE', 'INVOICE', { invoiceRef });
      
      loadInvoices();
      loadMetrics();
      setInvoiceToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  // Mark invoice as paid
  const markInvoiceAsPaid = async (invoice: Invoice) => {
    try {
      const { error } = await supabase
        .from('Invoice')
        .update({
          status: 'PAID',
          paidAt: new Date().toISOString()
        })
        .eq('id', invoice.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Invoice marked as paid',
      });
      
      // Log audit action
      await logAuditAction('UPDATE', 'INVOICE', { status: 'PAID' });
      
      loadInvoices();
      loadMetrics();
      setViewingInvoice(null);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark invoice as paid',
        variant: 'destructive',
      });
    }
  };

  // Log audit action
  const logAuditAction = async (action: string, resource: string, details: any = {}) => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Log the action
      await supabase
        .from('AuditLog')
        .insert([{
          userId: user.id,
          action,
          resource,
          details
        }]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
    setPaymentMethodFilter(null);
    setStartDate(null);
    setEndDate(null);
  };

  return {
    invoices,
    clients,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    paymentMethodFilter, 
    setPaymentMethodFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    resetFilters,
    isFormOpen,
    setIsFormOpen,
    editingInvoice,
    setEditingInvoice,
    viewingInvoice,
    setViewingInvoice,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    invoiceToDelete,
    setInvoiceToDelete,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
    totalInvoices,
    totalRevenue,
    outstandingAmount,
    overdueInvoices,
    isMetricsLoading,
    loadInvoices,
    loadMetrics
  };
};
