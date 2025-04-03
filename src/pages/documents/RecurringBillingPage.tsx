import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RecurringBillingDashboard from '@/components/invoices/RecurringBillingDashboard';

const RecurringBillingPage = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Documents', href: '/admin/documents' },
    { label: 'Recurring Billing' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <RecurringBillingDashboard />
    </DashboardLayout>
  );
};

export default RecurringBillingPage;
