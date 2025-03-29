
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { SubMenuItem } from '@/components/navigation/SubMenuTabs';
import { supabase } from '@/integrations/supabase/client';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { InvoiceStatus } from '@/types/invoice';
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/formatters';

interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  invoiceNumber?: string;
}

const AdminClientInvoicesPage = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [client, setClient] = useState<{ companyName: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Define breadcrumbs for navigation
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client?.companyName || 'Client', href: `/admin/accounts/clients/${clientId}/overview` },
    { label: 'Invoices' }
  ];
  
  const subMenuItems: SubMenuItem[] = [
    { label: 'Overview', href: `/admin/accounts/clients/${clientId}/overview`, value: 'overview' },
    { label: 'Services', href: `/admin/accounts/clients/services?clientId=${clientId}`, value: 'services' },
    { label: 'Invoices', href: `/admin/accounts/clients/invoices?clientId=${clientId}`, value: 'invoices' },
    { label: 'Support', href: `/admin/accounts/clients/support?clientId=${clientId}`, value: 'support' },
    { label: 'Contacts', href: `/admin/accounts/clients/contacts?clientId=${clientId}`, value: 'contacts' },
  ];

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
      fetchInvoices();
    }
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('companyName')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error('Error fetching client details:', error);
        toast({
          title: "Error",
          description: "Could not fetch client details",
          variant: "destructive",
        });
      } else {
        setClient(data);
      }
    } catch (error) {
      console.error('Error in client fetch operation:', error);
    }
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Invoice')
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: false });
        
      if (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Could not fetch invoices",
          variant: "destructive",
        });
      } else {
        setInvoices(data || []);
      }
    } catch (error) {
      console.error('Error in invoice fetch operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInvoice = () => {
    setCurrentInvoice(null);
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!currentInvoice) return;
    
    try {
      const { error } = await supabase
        .from('Invoice')
        .delete()
        .eq('id', currentInvoice.id);
        
      if (error) {
        console.error('Error deleting invoice:', error);
        toast({
          title: "Error",
          description: "Could not delete invoice",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Invoice deleted successfully",
        });
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentInvoice(null);
    }
  };

  const handleSaveInvoice = async (formData: any) => {
    try {
      if (currentInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('Invoice')
          .update({
            amount: formData.amount,
            status: formData.status,
            dueDate: formData.dueDate,
            invoiceNumber: formData.invoiceNumber,
          })
          .eq('id', currentInvoice.id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        // Create new invoice
        const { error } = await supabase
          .from('Invoice')
          .insert({
            clientId,
            amount: formData.amount,
            status: formData.status,
            dueDate: formData.dueDate,
            invoiceNumber: formData.invoiceNumber,
          });
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
      }
      
      setIsDialogOpen(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      subMenuBasePath={`/admin/accounts/clients/${clientId}`}
      role="admin"
      title={`Invoices - ${client?.companyName || 'Client'}`}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Invoices</h2>
            <p className="text-muted-foreground">Manage client invoices</p>
          </div>
          <Button onClick={handleAddInvoice}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading invoices...</p>
              </div>
            ) : invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber || '-'}</TableCell>
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
                          onClick={() => handleEditInvoice(invoice)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(invoice)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No invoices found for this client</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={handleAddInvoice}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {currentInvoice 
                ? 'Update the details of this invoice' 
                : 'Enter the details for the new invoice'}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm 
            initialData={currentInvoice} 
            onSubmit={handleSaveInvoice}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminClientInvoicesPage;
