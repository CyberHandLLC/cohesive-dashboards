
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type InvoicePaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentMethod: InvoicePaymentMethod | null;
  lineItems: Record<string, any> | null;
}

export interface CreateInvoiceData {
  clientId: string;
  amount: number;
  dueDate: string;
  status?: InvoiceStatus;
  paymentMethod?: InvoicePaymentMethod;
  invoiceNumber?: string;
  lineItems?: Record<string, any>;
}

export interface UpdateInvoiceData {
  amount?: number;
  status?: InvoiceStatus;
  dueDate?: string;
  paymentMethod?: InvoicePaymentMethod;
  lineItems?: Record<string, any>;
  paidAt?: string | null;
}
