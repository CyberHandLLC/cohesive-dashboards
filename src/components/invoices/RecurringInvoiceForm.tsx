import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Invoice, 
  CreateInvoiceData,
  LineItem,
  RecurringFrequency,
  InvoicePaymentMethod
} from '@/types/invoice';
import { Client } from '@/types/client';

// Schema for the form
const formSchema = z.object({
  clientId: z.string().uuid({
    message: "Please select a client"
  }),
  dueDate: z.date({
    required_error: "Please select a due date",
  }),
  isRecurring: z.boolean().default(true),
  recurringFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL']).optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'CHECK', 'CASH', 'OTHER']).optional(),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, { message: "Description is required" }),
      quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
      unitPrice: z.number().min(0, { message: "Unit price cannot be negative" }),
      clientServiceId: z.string().uuid().optional()
    })
  ).min(1, { message: "At least one line item is required" })
});

type FormValues = z.infer<typeof formSchema>;

interface RecurringInvoiceFormProps {
  invoice?: Invoice;
  clients: Client[];
  onSubmit: (data: CreateInvoiceData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  services?: { id: string; name: string; price: number }[];
}

const RecurringInvoiceForm: React.FC<RecurringInvoiceFormProps> = ({
  invoice,
  clients,
  onSubmit,
  onCancel,
  isSubmitting = false,
  services = []
}) => {
  const [total, setTotal] = useState<number>(0);

  // Set default values
  const defaultValues: Partial<FormValues> = {
    clientId: invoice?.clientId || '',
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(),
    isRecurring: invoice?.isRecurring !== undefined ? invoice.isRecurring : true,
    recurringFrequency: invoice?.recurringFrequency || 'MONTHLY',
    paymentMethod: invoice?.paymentMethod || undefined,
    notes: invoice?.notes || '',
    lineItems: invoice?.lineItems ? invoice.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      clientServiceId: item.clientServiceId
    })) : [{ description: '', quantity: 1, unitPrice: 0 }]
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const watchLineItems = form.watch('lineItems');
  
  // Calculate total amount when line items change
  useEffect(() => {
    const calculatedTotal = watchLineItems?.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0) || 0;
    
    setTotal(calculatedTotal);
  }, [watchLineItems]);

  // Add a new line item
  const addLineItem = () => {
    const currentItems = form.getValues('lineItems') || [];
    form.setValue('lineItems', [
      ...currentItems, 
      { description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  // Remove a line item
  const removeLineItem = (index: number) => {
    const currentItems = form.getValues('lineItems');
    if (currentItems.length > 1) {
      form.setValue('lineItems', currentItems.filter((_, i) => i !== index));
    }
  };

  // Fill line item from service
  const fillFromService = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const currentItems = form.getValues('lineItems');
      currentItems[index] = {
        ...currentItems[index],
        description: `${service.name} Subscription`,
        unitPrice: service.price,
        clientServiceId: serviceId
      };
      form.setValue('lineItems', [...currentItems]);
    }
  };

  const handleSubmit = (values: FormValues) => {
    // Calculate total
    const amount = values.lineItems.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);

    // Create line items with totals
    const lineItems = values.lineItems.map(item => ({
      id: Math.random().toString(36).substring(2, 11), // Temporary ID
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      clientServiceId: item.clientServiceId
    }));

    // Create invoice data
    const invoiceData: CreateInvoiceData = {
      clientId: values.clientId,
      amount,
      dueDate: values.dueDate.toISOString(),
      status: 'PENDING',
      lineItems,
      isRecurring: values.isRecurring,
      recurringFrequency: values.isRecurring ? values.recurringFrequency : undefined,
      paymentMethod: values.paymentMethod,
      notes: values.notes
    };

    onSubmit(invoiceData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{invoice ? 'Edit Recurring Invoice' : 'Create Recurring Invoice'}</CardTitle>
        <CardDescription>
          Set up a recurring billing schedule for client services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            {/* Due Date */}
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
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
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
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Invoice</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Set this as a recurring invoice to bill periodically
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('isRecurring') && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="BIANNUAL">Bi-Annual</SelectItem>
                          <SelectItem value="ANNUAL">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Payment Method</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or special instructions"
                      className="resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {watchLineItems?.map((_, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-5 sm:col-span-6">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                              Description
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Item description"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                              Qty
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                              Unit Price
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                        Total
                      </FormLabel>
                      <div className="h-10 px-3 py-2 rounded-md border border-input bg-background">
                        ${((watchLineItems[index]?.quantity || 0) * (watchLineItems[index]?.unitPrice || 0)).toFixed(2)}
                      </div>
                    </div>
                    
                    {watchLineItems.length > 1 && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(index)}
                          disabled={isSubmitting}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Services dropdown */}
              {services.length > 0 && (
                <div className="mt-4">
                  <FormLabel>Quick Add from Services</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => {
                        const index = watchLineItems.length - 1;
                        fillFromService(index, value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - ${service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Total Display */}
              <div className="flex justify-end pt-4 border-t">
                <div className="w-1/3 flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <CardFooter className="flex justify-between px-0">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RecurringInvoiceForm;
