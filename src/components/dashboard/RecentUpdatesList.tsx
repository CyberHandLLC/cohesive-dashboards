
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  date: string | Date;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  link?: string;
}

interface RecentUpdatesListProps {
  items: UpdateItem[];
  title?: string;
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

const RecentUpdatesList = ({
  items,
  title = "Recent Updates",
  className,
  emptyMessage = "No recent updates",
  maxItems = 5
}: RecentUpdatesListProps) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  const formatDate = (date: string | Date) => {
    return typeof date === 'string' ? new Date(date).toLocaleDateString() : date.toLocaleDateString();
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length > 0 ? (
          <ul className="space-y-4">
            {displayItems.map((item) => (
              <li key={item.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  {item.link ? (
                    <a href={item.link} className="font-medium hover:underline">{item.title}</a>
                  ) : (
                    <span className="font-medium">{item.title}</span>
                  )}
                  {item.badge && (
                    <Badge variant={item.badge.variant || 'secondary'}>
                      {item.badge.text}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
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
    </Card>
  );
};

export default RecentUpdatesList;
