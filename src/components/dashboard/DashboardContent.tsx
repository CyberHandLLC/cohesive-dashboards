
import React, { ReactNode } from 'react';

interface DashboardContentProps {
  children: ReactNode;
  className?: string;
}

const DashboardContent = ({
  children,
  className = "",
}: DashboardContentProps) => {
  return (
    <main className={`p-4 md:p-6 ${className}`}>
      {children}
    </main>
  );
};

export default DashboardContent;
