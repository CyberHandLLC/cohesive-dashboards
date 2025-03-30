
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CHECK' | 'CASH' | 'OTHER';

export interface LineItem {
  description: string;
  quantity?: number;
  price: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  invoiceNumber?: string;
  paidAt?: string | null;
  lineItems?: LineItem[] | null;
  paymentMethod?: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}
