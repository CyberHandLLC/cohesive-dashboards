import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRightIcon } from 'lucide-react';

export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  date: string | Date;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  };
  link?: string;
  icon?: React.ReactNode;
}

interface RecentUpdatesListProps {
  items: UpdateItem[];
  title?: string;
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
  compact?: boolean;
}

const RecentUpdatesList = ({
  items,
  title = "Recent Updates",
  className,
  emptyMessage = "No recent updates",
  maxItems = 5,
  viewAllHref,
  viewAllLabel = "View all",
  compact = false
}: RecentUpdatesListProps) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // If date is today, show time
    const today = new Date();
    if (dateObj.toDateString() === today.toDateString()) {
      return dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    
    // If date is yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // If date is within last 7 days, show day of week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (dateObj > sevenDaysAgo) {
      return dateObj.toLocaleDateString(undefined, { weekday: 'long' });
    }
    
    // Otherwise show full date
    return dateObj.toLocaleDateString();
  };

  // Variant mapping for badges
  const getBadgeVariant = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'destructive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return '';
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className={cn(compact ? "pb-2" : "")}>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn(compact ? "pt-0" : "")}>
        {displayItems.length > 0 ? (
          <ul className={cn("space-y-4", compact ? "space-y-2" : "")}>
            {displayItems.map((item) => (
              <li key={item.id} className={cn(
                "border-b pb-3 last:border-0 last:pb-0",
                compact ? "pb-2" : ""
              )}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                    {item.link ? (
                      <a href={item.link} className="font-medium hover:underline">{item.title}</a>
                    ) : (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={item.badge.variant || 'secondary'}
                      className={getBadgeVariant(item.badge.variant)}
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                </div>
                <p className={cn(
                  "text-sm text-muted-foreground",
                  compact ? "line-clamp-1" : ""
                )}>
                  {item.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        )}
      </CardContent>
      
      {viewAllHref && (
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground flex items-center"
          >
            <a href={viewAllHref}>
              {viewAllLabel}
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentUpdatesList;
