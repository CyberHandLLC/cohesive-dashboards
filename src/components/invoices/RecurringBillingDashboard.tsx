import React, { useState } from 'react';
import { AlertCircle, Check, Clock, Plus, RefreshCw } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { useRecurringBilling } from '@/hooks/useRecurringBilling';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, CreateInvoiceData } from '@/types/invoice';
import { Client } from '@/types/client';
import { Service } from '@/types/service';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import RecurringInvoiceForm from './RecurringInvoiceForm';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const RecurringBillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [openNewInvoiceDialog, setOpenNewInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get clients for creating invoices
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .order('companyName');
      
      if (error) throw error;
      return data as Client[];
    }
  });
  
  // Get services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Service')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data as Service[];
    }
  });

  // Use recurring billing hook
  const { 
    recurringInvoices, 
    invoicesDueForRenewal,
    isLoadingRecurring,
    isLoadingDueForRenewal,
    createRecurringInvoice,
    generateNextRecurringInvoice,
    error,
    resetError
  } = useRecurringBilling();

  // Calculate upcoming renewals (within 30 days)
  const upcomingRenewals = recurringInvoices?.filter(invoice => {
    if (!invoice.nextBillingDate) return false;
    const nextBillingDate = new Date(invoice.nextBillingDate);
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    return isBefore(nextBillingDate, thirtyDaysFromNow) && !isBefore(nextBillingDate, today);
  }) || [];

  // Group renewals by status
  const overdueRenewals = invoicesDueForRenewal || [];
  const activeRecurringInvoices = recurringInvoices?.filter(invoice => invoice.isRecurring) || [];
  
  // Handler for submitting a new recurring invoice
  const handleCreateRecurringInvoice = async (data: CreateInvoiceData) => {
    setIsSubmitting(true);
    try {
      await createRecurringInvoice.mutateAsync(data);
      setOpenNewInvoiceDialog(false);
      toast({
        title: "Recurring invoice created",
        description: "The recurring invoice has been set up successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error creating invoice",
        description: "There was an error creating the recurring invoice.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for generating a new invoice based on recurring settings
  const handleGenerateNextInvoice = async (invoice: Invoice) => {
    try {
      await generateNextRecurringInvoice.mutateAsync(invoice);
      toast({
        title: "Invoice generated",
        description: "The next invoice in the recurring series has been generated.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error generating invoice",
        description: "There was an error generating the next invoice.",
        variant: "destructive"
      });
    }
  };
  
  // Determine client name from client ID
  const getClientName = (clientId: string): string => {
    const client = clients?.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };
  
  // Format next billing date
  const formatNextBillingDate = (date: string | undefined): string => {
    if (!date) return 'Not scheduled';
    return format(new Date(date), 'PP');
  };
  
  // Determine if renewal is overdue
  const isRenewalOverdue = (date: string | undefined): boolean => {
    if (!date) return false;
    return isBefore(new Date(date), new Date());
  };

  // Show error if present
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetError} 
            className="ml-2"
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Recurring Billing Dashboard</h2>
        <Dialog open={openNewInvoiceDialog} onOpenChange={setOpenNewInvoiceDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Recurring Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px]">
            <RecurringInvoiceForm 
              clients={clients || []}
              services={services?.map(s => ({ id: s.id, name: s.name, price: s.price || 0 })) || []}
              onSubmit={handleCreateRecurringInvoice}
              onCancel={() => setOpenNewInvoiceDialog(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="upcoming">
            Upcoming Renewals
            {upcomingRenewals.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingRenewals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue Renewals
            {overdueRenewals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {overdueRenewals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Subscriptions
            {activeRecurringInvoices.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {activeRecurringInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoadingRecurring ? (
            <LoadingState />
          ) : upcomingRenewals.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {upcomingRenewals.map((invoice) => (
                <RenewalCard 
                  key={invoice.id}
                  invoice={invoice}
                  clientName={getClientName(invoice.clientId)}
                  onGenerateInvoice={() => handleGenerateNextInvoice(invoice)}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No upcoming renewals"
              description="There are no subscriptions due for renewal in the next 30 days."
            />
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {isLoadingDueForRenewal ? (
            <LoadingState />
          ) : overdueRenewals.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {overdueRenewals.map((invoice) => (
                <RenewalCard 
                  key={invoice.id}
                  invoice={invoice}
                  clientName={getClientName(invoice.clientId)}
                  onGenerateInvoice={() => handleGenerateNextInvoice(invoice)}
                  isOverdue
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No overdue renewals"
              description="There are no subscriptions that are overdue for renewal."
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {isLoadingRecurring ? (
            <LoadingState />
          ) : activeRecurringInvoices.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1">
                {activeRecurringInvoices.map((invoice) => (
                  <SubscriptionCard 
                    key={invoice.id}
                    invoice={invoice}
                    clientName={getClientName(invoice.clientId)}
                    formatNextBillingDate={formatNextBillingDate}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState 
              title="No active subscriptions"
              description="There are no active recurring billing subscriptions."
              action={
                <Button onClick={() => setOpenNewInvoiceDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Subscription
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Renewal Card Component
interface RenewalCardProps {
  invoice: Invoice;
  clientName: string;
  onGenerateInvoice: () => void;
  isOverdue?: boolean;
}

const RenewalCard: React.FC<RenewalCardProps> = ({ 
  invoice, 
  clientName, 
  onGenerateInvoice,
  isOverdue = false
}) => {
  // Format next billing date within the component
  const formatNextBillingDate = (date: string | undefined): string => {
    if (!date) return 'Not scheduled';
    return format(new Date(date), 'PP');
  };

  return (
    <Card className={cn(
      "overflow-hidden",
      isOverdue && "border-destructive"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="truncate">{clientName}</CardTitle>
        <CardDescription>
          Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="font-medium">${invoice.amount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Frequency:</span>
            <span className="font-medium">
              {invoice.recurringFrequency ? formatFrequency(invoice.recurringFrequency) : 'One-time'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Next Billing:</span>
            <span className={cn(
              "font-medium",
              isOverdue && "text-destructive"
            )}>
              {formatNextBillingDate(invoice.nextBillingDate)}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isOverdue ? "destructive" : "default"}
          className="w-full" 
          onClick={onGenerateInvoice}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate Invoice Now
        </Button>
      </CardFooter>
    </Card>
  );
};

// Subscription Card Component
interface SubscriptionCardProps {
  invoice: Invoice;
  clientName: string;
  formatNextBillingDate: (date: string | undefined) => string;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  invoice, 
  clientName,
  formatNextBillingDate
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center p-6">
          <div className="flex-1 space-y-1">
            <div className="flex items-center">
              <h3 className="font-semibold text-lg">{clientName}</h3>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-bold">${invoice.amount?.toFixed(2)}</span>
            <Badge variant="outline" className="mt-1">
              {invoice.recurringFrequency ? formatFrequency(invoice.recurringFrequency) : 'One-time'}
            </Badge>
          </div>
        </div>
        <Separator />
        <div className="p-6 flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Next billing date</p>
            <p className="font-medium mt-1">
              <Clock className="h-4 w-4 inline mr-1" />
              {formatNextBillingDate(invoice.nextBillingDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Created on</p>
            <p className="font-medium mt-1">
              {format(new Date(invoice.createdAt), 'PP')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Loading State Component
const LoadingState: React.FC = () => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center h-64">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Check className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground mt-1 mb-4">{description}</p>
      {action}
    </Card>
  );
};

// Helper function to format frequency
const formatFrequency = (frequency: string): string => {
  switch (frequency) {
    case 'MONTHLY': return 'Monthly';
    case 'QUARTERLY': return 'Quarterly';
    case 'BIANNUAL': return 'Bi-Annual';
    case 'ANNUAL': return 'Annual';
    default: return frequency;
  }
};

// Helper function for conditionally joining classNames
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default RecurringBillingDashboard;
