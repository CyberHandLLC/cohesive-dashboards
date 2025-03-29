
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ClientServicesPage = () => {
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Services' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Services</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your active services will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientServicesPage;
