
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LeadManagementPage = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Engagements', href: '/admin/engagements' },
    { label: 'Lead Management' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Lead Management</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Lead management tools will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LeadManagementPage;
