import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Invoice, LineItem, InvoiceStatus } from '@/types/invoice';
import { PaymentFormValues } from '@/components/client/ClientPaymentDialog';

// Define a custom Invoice type to include any additional properties we might need
interface ClientInvoice extends Invoice {
  clientServiceId?: string;
}

export const useClientInvoices = (clientId?: string) => {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<ClientInvoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<ClientInvoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Fetch invoices for the client
  const fetchInvoices = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Invoice')
        .select(`
          id,
          invoiceNumber,
          clientId,
          amount,
          status,
          dueDate,
          paymentMethod,
          createdAt,
          updatedAt,
          lineItems
        `)
        .eq('clientId', clientId);
      
      // Apply filters
      if (statusFilter) {
        // Use explicit string assignment for valid status values
        let validStatus: InvoiceStatus = 'PENDING';
        
        if (statusFilter === 'PENDING') validStatus = 'PENDING';
        else if (statusFilter === 'PAID') validStatus = 'PAID';
        else if (statusFilter === 'OVERDUE') validStatus = 'OVERDUE';
        else if (statusFilter === 'CANCELED') validStatus = 'CANCELED';
        
        query = query.eq('status', validStatus);
      }
      
      if (searchTerm) {
        query = query.or(`invoiceNumber.ilike.%${searchTerm}%`);
      }
      
      if (startDate) {
        query = query.gte('createdAt', startDate.toISOString());
      }
      
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('createdAt', nextDay.toISOString());
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      // Cast data to ClientInvoice[]
      setInvoices(data as unknown as ClientInvoice[]);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Could not fetch invoice data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
    setStartDate(null);
    setEndDate(null);
  };

  // Process a payment for an invoice
  const processPayment = async (values: PaymentFormValues) => {
    if (!payingInvoice || !clientId) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert payment method to one of the supported types
      const normalizedPaymentMethod = 
        values.paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' :
        values.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 
        values.paymentMethod === 'PAYPAL' ? 'PAYPAL' : 'BANK_TRANSFER';
      
      // Update the invoice to paid status
      const { error: updateError } = await supabase
        .from('Invoice')
        .update({
          status: 'PAID',
          paymentMethod: normalizedPaymentMethod,
          updatedAt: new Date().toISOString()
        })
        .eq('id', payingInvoice.id)
        .eq('clientId', clientId);
      
      if (updateError) throw updateError;
      
      // If we had a Payment table, we would create a payment record here
      // Since we don't, we'll just log the payment in AuditLog
      
      // If the invoice is for a service, update the service status to ACTIVE
      if (payingInvoice.lineItems) {
        // Try to find a service ID in the line items
        let serviceId: string | undefined;
        
        if (Array.isArray(payingInvoice.lineItems)) {
          // Look for an item with clientServiceId in the line items array
          const serviceLineItem = payingInvoice.lineItems.find(
            (item: LineItem) => item && item.clientServiceId
          );
          
          if (serviceLineItem && serviceLineItem.clientServiceId) {
            // We found a direct clientServiceId reference
            const { error: serviceError } = await supabase
              .from('ClientService')
              .update({
                status: 'ACTIVE',
                updatedAt: new Date().toISOString()
              })
              .eq('id', serviceLineItem.clientServiceId);
              
            if (serviceError) throw serviceError;
          }
        }
      }
      
      // Log the audit action using valid resource type
      try {
        const user = await supabase.auth.getUser();
        
        // Simplifying the approach to avoid complex type issues
        // Just record the essentials in a plain UPDATE audit log entry
        await supabase.from('AuditLog').insert({
          action: "UPDATE",
          resource: "SERVICE", // Use a known valid resource type
          resourceId: payingInvoice.id,
          details: JSON.stringify({
            operation: 'payment_processed',
            invoiceId: payingInvoice.id,
            amount: values.amount,
            method: values.paymentMethod
          }),
          createdAt: new Date().toISOString(),
          userId: user.data.user?.id || null
        });
      } catch (logError) {
        console.error('Error logging payment:', logError);
        // Continue with success flow even if logging fails
      }
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      // Close the payment dialog and refresh invoices
      setPayingInvoice(null);
      fetchInvoices();
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "There was a problem processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
