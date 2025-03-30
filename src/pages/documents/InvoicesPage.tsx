
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, ArrowRightIcon, AlertCircle } from 'lucide-react';
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
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency, formatDate } from '@/lib/formatters';
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge';
import InvoiceFilters from '@/components/invoices/InvoiceFilters';
import InvoiceSummaryCards from '@/components/invoices/InvoiceSummaryCards';
import InvoiceFormDialog from '@/components/invoices/InvoiceFormDialog';
import InvoiceDetailsDialog from '@/components/invoices/InvoiceDetailsDialog';

const InvoicesPage = () => {
  const navigate = useNavigate();
  const {
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
    isMetricsLoading
  } = useInvoices();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Documents', href: '/admin/documents' },
    { label: 'Invoices' }
  ];

  const handleViewInvoice = (invoice: any) => {
    setViewingInvoice(invoice);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (invoice: any) => {
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/admin/accounts/clients/${clientId}/overview`);
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Invoices Management</h1>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
        
        {/* Summary Metrics */}
        <InvoiceSummaryCards
          totalInvoices={totalInvoices}
          totalRevenue={totalRevenue}
          outstandingAmount={outstandingAmount}
          overdueInvoices={overdueInvoices}
          isLoading={isMetricsLoading}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6">
              <InvoiceFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                paymentMethodFilter={paymentMethodFilter}
                setPaymentMethodFilter={setPaymentMethodFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                resetFilters={resetFilters}
              />
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading invoices...</p>
              </div>
            ) : invoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
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
                        <TableCell>{invoice.invoiceNumber || invoice.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto" 
                            onClick={() => handleClientClick(invoice.clientId)}
                          >
                            {clients[invoice.clientId] || 'Unknown Client'}
                          </Button>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewInvoice(invoice)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">No invoices found</p>
                {(searchTerm || statusFilter || paymentMethodFilter || startDate || endDate) && (
                  <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
                )}
                <Button 
                  variant="outline" 
                  onClick={resetFilters} 
                  className={
                    (searchTerm || statusFilter || paymentMethodFilter || startDate || endDate) 
                      ? "mb-4" : "hidden"
                  }
                >
                  Reset Filters
                </Button>
                <Button onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Invoice Dialog */}
      <InvoiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingInvoice}
        onSubmit={async (data) => {
          if (editingInvoice) {
            await updateInvoice(editingInvoice.id, data);
          } else {
            await createInvoice(data);
          }
        }}
      />

      {/* View Invoice Details Dialog */}
      <InvoiceDetailsDialog
        invoice={viewingInvoice}
        open={!!viewingInvoice}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
        clientName={viewingInvoice ? clients[viewingInvoice.clientId] : undefined}
        onMarkAsPaid={() => {
          if (viewingInvoice) {
            markInvoiceAsPaid(viewingInvoice);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
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
            <Button variant="destructive" onClick={() => invoiceToDelete && deleteInvoice(invoiceToDelete.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default InvoicesPage;
