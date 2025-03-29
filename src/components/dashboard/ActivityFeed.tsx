
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MessageSquare, User, FileText, Calendar, Settings, AlertCircle } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'message' | 'user' | 'document' | 'event' | 'system' | 'alert';
  content: string;
  timestamp: string | Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

const ActivityFeed = ({
  items,
  title = "Recent Activity",
  className,
  emptyMessage = "No recent activity",
  maxItems = 5
}: ActivityFeedProps) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length > 0 ? (
          <div className="space-y-4">
            {displayItems.map((item) => (
              <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{item.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.user && (
                      <span className="font-medium">{item.user.name}</span>
                    )}
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
