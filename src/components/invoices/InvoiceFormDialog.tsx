
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Invoice, LineItem, PaymentMethod } from '@/types/invoice';
import { formatCurrency, generateInvoiceNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  companyName: string;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Invoice | null;
  onSubmit: (data: any) => Promise<void>;
}

const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm({
    defaultValues: {
      clientId: initialData?.clientId || '',
      invoiceNumber: initialData?.invoiceNumber || generateInvoiceNumber(),
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: initialData?.status || 'PENDING',
      paymentMethod: initialData?.paymentMethod || 'CREDIT_CARD',
    },
  });

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('Client')
          .select('id, companyName')
          .order('companyName');
          
        if (error) {
          throw error;
        }
        
        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  // Set line items from initial data
  useEffect(() => {
    if (initialData?.lineItems) {
      setLineItems(initialData.lineItems);
      calculateTotal(initialData.lineItems);
    } else {
      setLineItems([]);
      setTotalAmount(0);
    }
  }, [initialData]);

  const calculateTotal = (items: LineItem[]) => {
    const total = items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum + (item.price * quantity);
    }, 0);
    setTotalAmount(total);
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      price: 0,
    };
    const newItems = [...lineItems, newItem];
    setLineItems(newItems);
    calculateTotal(newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = [...lineItems];
    newItems.splice(index, 1);
    setLineItems(newItems);
    calculateTotal(newItems);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'price' || field === 'quantity' ? parseFloat(value) : value
    };
    setLineItems(newItems);
    calculateTotal(newItems);
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        dueDate: formData.dueDate.toISOString(),
        lineItems,
        amount: totalAmount,
        // Set paidAt if status is PAID
        paidAt: formData.status === 'PAID' ? new Date().toISOString() : null,
      };
      
      await onSubmit(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the invoice details below'
              : 'Enter the details for the new invoice'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    value={field.value || "select-client"}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="select-client" disabled>Select a client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      value={field.value || "CREDIT_CARD"}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Line Items</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addLineItem} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {lineItems.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground border rounded-md">
                  No items added. Click "Add Item" to add line items.
                </div>
              ) : (
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-end gap-2 p-3 border rounded-md">
                      <div className="flex-1">
                        <Label className="text-xs" htmlFor={`item-${index}-description`}>Description</Label>
                        <Input
                          id={`item-${index}-description`}
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs" htmlFor={`item-${index}-quantity`}>Qty</Label>
                        <Input
                          id={`item-${index}-quantity`}
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity || 1}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs" htmlFor={`item-${index}-price`}>Price</Label>
                        <Input
                          id={`item-${index}-price`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : initialData ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
