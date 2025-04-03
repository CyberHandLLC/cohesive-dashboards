import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Invoice, 
  InvoiceStatus, 
  CreateInvoiceData, 
  UpdateInvoiceData,
  Payment,
  CreatePaymentData,
  RecurringFrequency,
  InvoiceWithPayments
} from '@/types/invoice';
import { addMonths, addYears, addDays } from 'date-fns';

/**
 * Custom hook for managing recurring billing and payment tracking
 * 
 * Note: This hook implements recurring billing by tracking metadata
 * in the lineItems JSON field until schema changes can be made.
 */
export function useRecurringBilling() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Metadata keys used to store recurring billing info in lineItems JSON
  const META_IS_RECURRING = 'isRecurring';
  const META_FREQUENCY = 'recurringFrequency';
  const META_NEXT_BILLING = 'nextBillingDate';

  // Fetch recurring invoices
  const { data: recurringInvoices, isLoading: isLoadingRecurring } = useQuery({
    queryKey: ['invoices', 'recurring'],
    queryFn: async () => {
      // Since the database doesn't have proper recurring fields yet,
      // we'll query all invoices and filter those with recurring metadata
      const { data, error } = await supabase
        .from('Invoice')
        .select('*');

      if (error) {
        setError(error.message);
        return [];
      }

      // Filter invoices that have recurring metadata in their lineItems
      const recurring = data?.filter(inv => {
        if (!inv.lineItems) return false;
        
        try {
          const lineItemsObj = typeof inv.lineItems === 'string' 
            ? JSON.parse(inv.lineItems) 
            : inv.lineItems;
            
          // Check if it has recurring metadata
          return lineItemsObj._meta && lineItemsObj._meta[META_IS_RECURRING] === true;
        } catch (e) {
          return false;
        }
      }) || [];

      // Map database objects to our type definition
      return recurring.map(dbInvoice => mapDbInvoiceToInvoice(dbInvoice));
    }
  });

  // Fetch invoice with payments
  const getInvoiceWithPayments = async (invoiceId: string): Promise<InvoiceWithPayments | null> => {
    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      setError(invoiceError.message);
      return null;
    }

    // For now, just return the invoice without payments since
    // the Payment table doesn't exist yet
    return mapDbInvoiceToInvoice(invoice) as InvoiceWithPayments;
  };

  // Create recurring invoice
  const createRecurringInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      // Calculate next billing date based on frequency
      const nextBillingDate = calculateNextBillingDate(
        new Date(data.dueDate), 
        data.recurringFrequency
      );
      
      // Prepare line items with metadata for recurring info
      const lineItemsWithMeta = {
        items: data.lineItems || [],
        _meta: {
          [META_IS_RECURRING]: data.isRecurring || false,
          [META_FREQUENCY]: data.recurringFrequency,
          [META_NEXT_BILLING]: nextBillingDate,
          notes: data.notes
        }
      };
      
      // Insert the invoice
      const { data: invoice, error } = await supabase
        .from('Invoice')
        .insert({
          clientId: data.clientId,
          amount: data.amount,
          dueDate: data.dueDate,
          status: data.status || 'PENDING',
          paymentMethod: data.paymentMethod,
          invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
          lineItems: lineItemsWithMeta
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
        throw error;
      }

      return mapDbInvoiceToInvoice(invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  // Update invoice
  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceData }) => {
      // We need to handle line items specially to preserve metadata
      const updateData: Record<string, any> = { ...data };
      
      // If lineItems is being updated, we need to get the current metadata
      if (data.lineItems) {
        const { data: currentInvoice } = await supabase
          .from('Invoice')
          .select('lineItems')
          .eq('id', id)
          .single();
        
        let metadata = {};
        if (currentInvoice?.lineItems) {
          try {
            const currentLineItems = typeof currentInvoice.lineItems === 'string' 
              ? JSON.parse(currentInvoice.lineItems) 
              : currentInvoice.lineItems;
            
            if (currentLineItems._meta) {
              metadata = currentLineItems._meta;
            }
          } catch (e) {
            // If there's an error parsing, just use an empty object
          }
        }
        
        // If recurring properties are being updated, update the metadata
        if (data.isRecurring !== undefined) {
          metadata = { 
            ...metadata, 
            [META_IS_RECURRING]: data.isRecurring 
          };
          delete updateData.isRecurring;
        }
        
        if (data.recurringFrequency !== undefined) {
          metadata = { 
            ...metadata, 
            [META_FREQUENCY]: data.recurringFrequency 
          };
          delete updateData.recurringFrequency;
        }
        
        if (data.nextBillingDate !== undefined) {
          metadata = { 
            ...metadata, 
            [META_NEXT_BILLING]: data.nextBillingDate 
          };
          delete updateData.nextBillingDate;
        }
        
        if (data.notes) {
          metadata = { ...metadata, notes: data.notes };
          delete updateData.notes;
        }
        
        // Create new lineItems with metadata
        updateData.lineItems = {
          items: data.lineItems,
          _meta: metadata
        };
      }
      
      // Update the invoice
      const { error } = await supabase
        .from('Invoice')
        .update(updateData)
        .eq('id', id);

      if (error) {
        setError(error.message);
        throw error;
      }

      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  // Record payment
  const recordPayment = useMutation({
    mutationFn: async (paymentData: CreatePaymentData) => {
      const { invoiceId, amount, method, transactionId, paymentDate } = paymentData;
      
      // First, get current invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('Invoice')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (invoiceError) {
        setError(invoiceError.message);
        throw invoiceError;
      }
      
      if (!invoice) {
        const notFoundError = new Error('Invoice not found');
        setError(notFoundError.message);
        throw notFoundError;
      }
      
      // Store payment in lineItems metadata since we don't have a Payment table yet
      const currentLineItems = typeof invoice.lineItems === 'string'
        ? JSON.parse(invoice.lineItems)
        : invoice.lineItems || {};
        
      // Initialize _meta and payments array if they don't exist
      if (!currentLineItems._meta) {
        currentLineItems._meta = {};
      }
      
      if (!currentLineItems._meta.payments) {
        currentLineItems._meta.payments = [];
      }
      
      // Add new payment to the array
      const newPayment = {
        id: generateId(),
        amount,
        method,
        transactionId: transactionId || null,
        status: 'COMPLETED',
        paymentDate: paymentDate || new Date().toISOString()
      };
      
      currentLineItems._meta.payments.push(newPayment);
      
      // Calculate total paid amount
      const totalPaid = currentLineItems._meta.payments.reduce(
        (sum: number, payment: any) => sum + payment.amount, 
        0
      );
      
      // Determine new status
      let newStatus = invoice.status;
      if (totalPaid >= invoice.amount) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        // Use 'PENDING' instead of 'PARTIALLY_PAID' since it's not in the enum
        // We'll store payment info in metadata but keep status compatible
        newStatus = 'PENDING'; 
      }
      
      // Update invoice with payment info
      const { error: updateError } = await supabase
        .from('Invoice')
        .update({
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date().toISOString() : null,
          lineItems: currentLineItems
        })
        .eq('id', invoiceId);
        
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      
      return { 
        invoiceId, 
        amount, 
        newStatus, 
        newPaidAmount: totalPaid 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  // Generate next recurring invoice
  const generateNextRecurringInvoice = useMutation({
    mutationFn: async (invoice: Invoice) => {
      // Create a new invoice based on the recurring one
      const newInvoice: CreateInvoiceData = {
        clientId: invoice.clientId,
        amount: invoice.amount,
        dueDate: invoice.nextBillingDate || new Date().toISOString(),
        status: 'PENDING',
        paymentMethod: invoice.paymentMethod || undefined,
        lineItems: invoice.lineItems || [],
        isRecurring: true,
        recurringFrequency: invoice.recurringFrequency,
        notes: invoice.notes,
        invoiceNumber: generateInvoiceNumber()
      };

      // Calculate next billing date for the future
      const nextBillingDate = calculateNextBillingDate(
        new Date(newInvoice.dueDate), 
        invoice.recurringFrequency
      );

      // Create the new invoice
      const result = await createRecurringInvoice.mutateAsync(newInvoice);

      // Update the original invoice's next billing date
      const { data: originalInvoice } = await supabase
        .from('Invoice')
        .select('lineItems')
        .eq('id', invoice.id)
        .single();
      
      if (originalInvoice?.lineItems) {
        const lineItems = typeof originalInvoice.lineItems === 'string'
          ? JSON.parse(originalInvoice.lineItems)
          : originalInvoice.lineItems;
          
        if (lineItems._meta) {
          lineItems._meta[META_NEXT_BILLING] = nextBillingDate;
          
          await supabase
            .from('Invoice')
            .update({ lineItems })
            .eq('id', invoice.id);
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  // Check for invoices that need renewal
  const { data: invoicesDueForRenewal, isLoading: isLoadingDueForRenewal } = useQuery({
    queryKey: ['invoices', 'due-for-renewal'],
    queryFn: async () => {
      const today = new Date();
      
      // Since we don't have a proper nextBillingDate field, we need to get all recurring invoices
      // and filter them based on the metadata
      const { data, error } = await supabase
        .from('Invoice')
        .select('*');

      if (error) {
        setError(error.message);
        return [];
      }

      // Filter invoices that have overdue nextBillingDate in their metadata
      const dueForRenewal = data?.filter(inv => {
        if (!inv.lineItems) return false;
        
        try {
          const lineItemsObj = typeof inv.lineItems === 'string' 
            ? JSON.parse(inv.lineItems) 
            : inv.lineItems;
            
          // Check if it's recurring and has a nextBillingDate that's in the past
          if (lineItemsObj._meta && lineItemsObj._meta[META_IS_RECURRING] === true) {
            const nextBillingDate = new Date(lineItemsObj._meta[META_NEXT_BILLING]);
            return nextBillingDate < today;
          }
          return false;
        } catch (e) {
          return false;
        }
      }) || [];

      return dueForRenewal.map(dbInvoice => mapDbInvoiceToInvoice(dbInvoice));
    }
  });

  // Helper function to calculate next billing date based on frequency
  const calculateNextBillingDate = (currentDate: Date, frequency?: RecurringFrequency): string => {
    if (!frequency) return addMonths(currentDate, 1).toISOString();

    switch (frequency) {
      case 'MONTHLY':
        return addMonths(currentDate, 1).toISOString();
      case 'QUARTERLY':
        return addMonths(currentDate, 3).toISOString();
      case 'BIANNUAL':
        return addMonths(currentDate, 6).toISOString();
      case 'ANNUAL':
        return addYears(currentDate, 1).toISOString();
      default:
        return addMonths(currentDate, 1).toISOString();
    }
  };

  // Helper to generate invoice number
  const generateInvoiceNumber = (): string => {
    const prefix = 'INV';
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${dateCode}-${random}`;
  };
  
  // Helper to generate a random ID
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // Map database invoice to our interface
  const mapDbInvoiceToInvoice = (dbInvoice: any): Invoice => {
    if (!dbInvoice) return {} as Invoice;
    
    // Extract metadata from lineItems if available
    let isRecurring = false;
    let recurringFrequency: RecurringFrequency | undefined;
    let nextBillingDate: string | undefined;
    let notes: string | undefined;
    let lineItems = [];
    
    try {
      const lineItemsObj = typeof dbInvoice.lineItems === 'string' 
        ? JSON.parse(dbInvoice.lineItems) 
        : dbInvoice.lineItems;
      
      if (lineItemsObj?._meta) {
        isRecurring = lineItemsObj._meta[META_IS_RECURRING] || false;
        recurringFrequency = lineItemsObj._meta[META_FREQUENCY];
        nextBillingDate = lineItemsObj._meta[META_NEXT_BILLING];
        notes = lineItemsObj._meta.notes;
      }
      
      lineItems = lineItemsObj?.items || [];
    } catch (e) {
      // If there's an error parsing, use defaults
    }
    
    // Map to our interface
    return {
      id: dbInvoice.id,
      invoiceNumber: dbInvoice.invoiceNumber,
      clientId: dbInvoice.clientId,
      amount: dbInvoice.amount,
      status: dbInvoice.status as InvoiceStatus,
      dueDate: dbInvoice.dueDate,
      paidAt: dbInvoice.paidAt,
      createdAt: dbInvoice.createdAt,
      updatedAt: dbInvoice.updatedAt,
      paymentMethod: dbInvoice.paymentMethod,
      lineItems,
      isRecurring,
      recurringFrequency,
      nextBillingDate,
      notes
    };
  };

  // Reset error state
  const resetError = () => setError(null);

  return {
    recurringInvoices,
    invoicesDueForRenewal,
    isLoadingRecurring,
    isLoadingDueForRenewal,
    error,
    resetError,
    createRecurringInvoice,
    updateInvoice,
    recordPayment,
    generateNextRecurringInvoice,
    getInvoiceWithPayments
  };
}
