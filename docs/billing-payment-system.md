# Billing and Payment System

## Feature Overview
This feature enhances the existing invoice management capabilities to provide comprehensive billing, payment tracking, and recurring billing automation. It leverages the existing `Invoice` table while adding new functionality for payment processing and recurring charges.

## Database Schema Validation

Let's first check the current Invoice table structure:

```sql
-- Invoice table expected columns
-- id: UUID
-- clientId: UUID (reference to Client)
-- amount: NUMERIC
-- status: TEXT
-- dueDate: TIMESTAMP WITH TIME ZONE
-- createdAt: TIMESTAMP WITH TIME ZONE
-- updatedAt: TIMESTAMP WITH TIME ZONE
```

We may need to add additional tables/columns for payment tracking:

```sql
-- Suggested additions to Invoice table
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "recurringFrequency" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidDate" TIMESTAMP WITH TIME ZONE;

-- Create Payment table for tracking individual payments
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"("id"),
  "amount" NUMERIC NOT NULL,
  "method" TEXT NOT NULL,
  "transactionId" TEXT,
  "status" TEXT NOT NULL,
  "paymentDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_payment_invoice" ON "Payment"("invoiceId");
```

## Implementation Tasks

### 1. Enhanced Invoice Generation

#### Automatic Invoice Creation
```typescript
interface GenerateInvoiceParams {
  clientId: string;
  items: Array<{
    description: string;
    amount: number;
    clientServiceId?: string;
  }>;
  dueDate: Date;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'annual';
}

export const generateInvoice = async (params: GenerateInvoiceParams) => {
  const { clientId, items, dueDate, notes, isRecurring, recurringFrequency } = params;
  
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  // Create invoice record
  const { data: invoice, error } = await supabase
    .from('Invoice')
    .insert({
      clientId,
      amount: totalAmount,
      dueDate: dueDate.toISOString(),
      status: 'PENDING',
      notes,
      isRecurring: isRecurring || false,
      recurringFrequency,
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Create invoice items
  if (invoice) {
    const invoiceItems = items.map(item => ({
      invoiceId: invoice.id,
      description: item.description,
      amount: item.amount,
      clientServiceId: item.clientServiceId,
    }));
    
    const { error: itemsError } = await supabase
      .from('InvoiceItem')
      .insert(invoiceItems);
      
    if (itemsError) throw itemsError;
  }
  
  return invoice;
};
```

#### Invoice Template Components
1. **InvoiceForm**: Component for creating/editing invoices
2. **InvoiceTemplate**: PDF template for generated invoices
3. **InvoiceItemsTable**: Table for managing invoice line items
4. **RecurringInvoiceSettings**: Component for configuring recurring invoices

### 2. Payment Tracking System

#### Payment Processing
```typescript
interface RecordPaymentParams {
  invoiceId: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'check' | 'cash' | 'other';
  transactionId?: string;
  paymentDate?: Date;
}

export const recordPayment = async (params: RecordPaymentParams) => {
  const { invoiceId, amount, method, transactionId, paymentDate } = params;
  
  // Begin transaction
  const { data: invoice, error: invoiceError } = await supabase
    .from('Invoice')
    .select('amount, paidAmount, status')
    .eq('id', invoiceId)
    .single();
    
  if (invoiceError) throw invoiceError;
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  // Calculate new paid amount
  const newPaidAmount = (invoice.paidAmount || 0) + amount;
  
  // Determine new status
  let newStatus = invoice.status;
  if (newPaidAmount >= invoice.amount) {
    newStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIALLY_PAID';
  }
  
  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('Payment')
    .insert({
      invoiceId,
      amount,
      method,
      transactionId,
      status: 'COMPLETED',
      paymentDate: (paymentDate || new Date()).toISOString(),
    })
    .select()
    .single();
    
  if (paymentError) throw paymentError;
  
  // Update invoice record
  const { error: updateError } = await supabase
    .from('Invoice')
    .update({
      paidAmount: newPaidAmount,
      status: newStatus,
      paidDate: newStatus === 'PAID' ? new Date().toISOString() : null,
    })
    .eq('id', invoiceId);
    
  if (updateError) throw updateError;
  
  return { payment, invoiceStatus: newStatus };
};
```

#### Payment Management Components
1. **PaymentForm**: Component for recording payments
2. **PaymentHistoryTable**: Table showing payment history
3. **PaymentStatusBadge**: Visual indicator of payment status
4. **PaymentMethodSelector**: Component for selecting payment method

### 3. Recurring Billing Automation

#### Scheduled Invoice Generation
Create a scheduled function that:
1. Finds all recurring invoices due for renewal
2. Generates new invoices based on the recurring pattern
3. Updates the next due date for the recurring cycle
4. Sends notifications about the new invoices

#### Recurring Billing Management
Components for:
1. Setting up recurring billing cycles
2. Managing subscription changes
3. Pausing or canceling recurring charges
4. Notifying clients of upcoming charges

### 4. Reporting and Analytics

#### Financial Dashboard
Components for:
1. Revenue overview
2. Outstanding invoices
3. Payment history
4. Revenue forecasting

#### Client Billing Reports
Reports showing:
1. Billing history by client
2. Service revenue breakdown
3. Outstanding balances
4. Payment trends

## Testing Strategy

### Unit Tests
- Test invoice total calculations
- Verify payment recording logic
- Test recurring invoice generation

### Integration Tests
- Test invoice creation with line items
- Verify payment updates invoice status
- Test recurring billing cycle generation

### User Acceptance Tests
- Admin can create and send invoices
- Admin can record payments
- Admin can set up recurring billing
- Admin can generate billing reports

## Implementation Phases

### Phase 1: Enhanced Invoice Management
- Improve invoice creation form
- Create invoice PDF templates
- Implement invoice status tracking

### Phase 2: Payment Processing
- Build payment recording functionality
- Create payment history views
- Implement payment status indicators

### Phase 3: Recurring Billing
- Set up recurring invoice configuration
- Implement scheduled invoice generation
- Create subscription management interface

### Phase 4: Reporting
- Build financial dashboard
- Create client billing reports
- Implement revenue forecasting

## Related Components
- Service expiration management for renewal invoicing
- Client dashboards for billing information display
- Email notifications for invoice and payment alerts
