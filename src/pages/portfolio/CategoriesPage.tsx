
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CategoriesPage = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Categories' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Categories</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Service categories management content will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CategoriesPage;
