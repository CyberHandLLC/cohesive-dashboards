import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ExpirationDashboard } from '@/components/admin/ExpirationDashboard';

const ServiceExpirationPage = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Service Expirations' }
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
