
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';

import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import FinancialReports from '@/components/reports/FinancialReports';
import ClientReports from '@/components/reports/ClientReports';
import ServiceReports from '@/components/reports/ServiceReports';
import SupportReports from '@/components/reports/SupportReports';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Documents', href: '/admin/documents' },
    { label: 'Reports' }
  ];

  const startDate = dateRange?.from;
  const endDate = dateRange?.to;

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="Reports & Analytics"
    >
      <div className="space-y-6">
        <ReportSummaryCards />
        
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="clients">Client Acquisition</TabsTrigger>
            <TabsTrigger value="services">Service Adoption</TabsTrigger>
            <TabsTrigger value="support">Support Tickets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial">
            <FinancialReports 
              startDate={startDate} 
              endDate={endDate} 
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </TabsContent>
          
          <TabsContent value="clients">
            <ClientReports 
              startDate={startDate} 
              endDate={endDate}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </TabsContent>
          
          <TabsContent value="services">
            <ServiceReports 
              startDate={startDate} 
              endDate={endDate}
            />
          </TabsContent>
          
          <TabsContent value="support">
            <SupportReports
              startDate={startDate} 
              endDate={endDate}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
