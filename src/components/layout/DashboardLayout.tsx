
import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import SubMenuTabs, { SubMenuItem } from '@/components/navigation/SubMenuTabs';
import DashboardHeader from '@/components/layout/DashboardHeader';
import SidebarNav from '@/components/navigation/SidebarNav';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  subMenuItems?: SubMenuItem[];
  subMenuBasePath?: string;
  role?: 'admin' | 'staff' | 'client' | 'observer';
}

const DashboardLayout = ({
  children,
  breadcrumbs,
  subMenuItems,
  subMenuBasePath = '',
  role = 'admin',
}: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen w-full flex-col">
      <DashboardHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav role={role} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="container px-4 py-4">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="mb-4">
                <Breadcrumbs items={breadcrumbs} />
              </div>
            )}
            
            {subMenuItems && subMenuItems.length > 0 && (
              <div className="mb-6">
                <SubMenuTabs 
                  items={subMenuItems} 
                  basePath={subMenuBasePath} 
                />
              </div>
            )}
            
            <div className="rounded-lg">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
