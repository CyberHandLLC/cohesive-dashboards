
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ClientInvoicesPage = () => {
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Invoices' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Invoices</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your invoice history will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientInvoicesPage;
