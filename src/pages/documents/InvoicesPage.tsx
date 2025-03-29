
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvoicesPage = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Documents', href: '/admin/documents' },
    { label: 'Invoices' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Invoices</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Invoice management content will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvoicesPage;
