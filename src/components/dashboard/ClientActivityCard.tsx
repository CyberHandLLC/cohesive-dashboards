
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/formatters';

interface Update {
  id: string;
  title: string;
  description: string;
  date: Date;
  badge: {
    text: string;
    variant: string;
  };
  link?: string;
}

interface ClientActivityCardProps {
  updates: Update[];
  isLoading: boolean;
}

const ClientActivityCard: React.FC<ClientActivityCardProps> = ({ updates, isLoading }) => {
  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={16} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading activity...</p>
          </div>
        ) : updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <Link to={update.link || '#'} className="font-medium hover:underline">
                    {update.title}
                  </Link>
                  <div className={`px-2 py-1 text-xs rounded-md ${
                    update.badge.variant === 'success' ? 'bg-green-100 text-green-800' :
                    update.badge.variant === 'warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {update.badge.text}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{update.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(update.date.toISOString())}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientActivityCard;
