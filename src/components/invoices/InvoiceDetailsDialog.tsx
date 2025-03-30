
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { Invoice, LineItem } from '@/types/invoice';
import InvoiceStatusBadge from './InvoiceStatusBadge';

interface InvoiceDetailsDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
  onMarkAsPaid?: () => void;
}

const InvoiceDetailsDialog: React.FC<InvoiceDetailsDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  clientName,
  onMarkAsPaid,
}) => {
  if (!invoice) return null;

  const canMarkAsPaid = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.status !== 'REFUNDED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <p className="font-semibold">{clientName || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
              <p>{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <p>{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <p>{invoice.paymentMethod ? invoice.paymentMethod.replace('_', ' ') : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid At</p>
              <p>{invoice.paidAt ? formatDateTime(invoice.paidAt) : 'Not paid'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Line Items</p>
            {invoice.lineItems && invoice.lineItems.length > 0 ? (
              <div className="space-y-2">
                {invoice.lineItems.map((item: LineItem, index) => (
                  <div key={index} className="flex justify-between py-1 border-b">
                    <div>
                      <p>{item.description}</p>
                      {item.quantity && <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>}
                    </div>
                    <p className="font-medium">{formatCurrency(item.price)}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <p className="font-semibold">Total</p>
                  <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items</p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated: {formatDateTime(invoice.updatedAt)}
          </div>
          {canMarkAsPaid && onMarkAsPaid && (
            <Button onClick={onMarkAsPaid}>Mark as Paid</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsDialog;
