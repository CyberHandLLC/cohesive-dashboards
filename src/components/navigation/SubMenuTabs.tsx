
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface SubMenuItem {
  label: string;
  href: string;
  value: string;
}

interface SubMenuTabsProps {
  items: SubMenuItem[];
  basePath: string;
  className?: string;
}

const SubMenuTabs = ({ items, basePath, className }: SubMenuTabsProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Find the active tab value based on the current path
  const activeValue = items.find(item => {
    // Check if the current path exactly matches the href
    if (currentPath === item.href) return true;
    
    // Check if the current path segment matches the item value
    const pathSegments = currentPath.split('/');
    const valueSegment = pathSegments[pathSegments.length - 1];
    
    return valueSegment === item.value;
  })?.value || items[0]?.value;
  
  return (
    <Tabs value={activeValue} className={cn("w-full", className)}>
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            asChild
            className="data-[state=active]:bg-background"
          >
            <Link to={item.href}>
              {item.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default SubMenuTabs;
