
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type InvoicePaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

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
  lineItems: LineItem[] | null;
}

export interface CreateInvoiceData {
  clientId: string;
  amount: number;
  dueDate: string;
  status?: InvoiceStatus;
  paymentMethod?: InvoicePaymentMethod;
  invoiceNumber?: string;
  lineItems?: LineItem[];
}

export interface UpdateInvoiceData {
  amount?: number;
  status?: InvoiceStatus;
  dueDate?: string;
  paymentMethod?: InvoicePaymentMethod;
  lineItems?: LineItem[];
  paidAt?: string | null;
}
