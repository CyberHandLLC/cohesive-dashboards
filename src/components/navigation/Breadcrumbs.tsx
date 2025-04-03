import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  // Don't define data-* attributes in the interface, we'll handle them generically
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  // Instead of using React.Fragment, we'll render a flat array of elements
  const breadcrumbElements: React.ReactNode[] = [];
  
  // Build the array of elements
  items.forEach((item, index) => {
    // Add separator chevron for all but the first item
    if (index > 0) {
      breadcrumbElements.push(
        <ChevronRight key={`chevron-${index}`} className="mx-2 h-4 w-4" />
      );
    }
    
    // Add the link or text element
    if (item.href) {
      breadcrumbElements.push(
        <Link 
          key={`link-${item.label}`}
          to={item.href} 
          className="hover:text-foreground hover:underline"
        >
          {item.label}
        </Link>
      );
    } else {
      breadcrumbElements.push(
        <span 
          key={`span-${item.label}`}
          className="font-medium text-foreground"
        >
          {item.label}
        </span>
      );
    }
  });
  
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      {breadcrumbElements}
    </div>
  );
};

export default Breadcrumbs;
