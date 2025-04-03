import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ExpirationDashboard } from '@/components/admin/ExpirationDashboard';

const ServiceExpirationPage = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Services', href: '/admin/services' },
    { label: 'Expiration Management' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <ExpirationDashboard />
    </DashboardLayout>
  );
};

export default ServiceExpirationPage;
