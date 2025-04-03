import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Invoice } from '@/types/invoice';

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  onViewDetails: (invoice: Invoice) => void;
  onPayInvoice: (invoice: Invoice) => void;
  onResetFilters: () => void;
  hasFilters: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  isLoading,
  onViewDetails,
  onPayInvoice,
  onResetFilters,
  hasFilters
}) => {
  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    REFUNDED: 'bg-purple-100 text-purple-800'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No invoices found</p>
        {hasFilters && (
          <Button 
            variant="outline" 
            onClick={onResetFilters} 
            className="mt-4"
          >
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.invoiceNumber || invoice.id.slice(0, 8)}
              </TableCell>
              <TableCell>{formatDate(invoice.createdAt)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-md ${
                  statusColors[invoice.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                }`}>
                  {invoice.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onViewDetails(invoice)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {(invoice.status === 'PENDING' || invoice.status === 'OVERDUE') && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onPayInvoice(invoice)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceList;
