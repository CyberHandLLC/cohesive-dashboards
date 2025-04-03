import React, { useState } from 'react';
import { useExpiringServices, ExpirationRange } from '@/hooks/useExpiringServices';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ExpirationCardList } from './ExpirationCardList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ExpirationDashboard() {
  const [range, setRange] = useState<ExpirationRange>('month');
  const [status, setStatus] = useState<string>('ACTIVE');
  
  const { grouped, isLoading, error, getExpirationText } = useExpiringServices(range, status);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Service Expiration Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active Services</SelectItem>
              <SelectItem value="EXPIRED">Expired Services</SelectItem>
              <SelectItem value="ALL">All Services</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={range} onValueChange={(value) => setRange(value as ExpirationRange)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Expired Card */}
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                Expired
              </CardTitle>
              <CardDescription>Services that have already expired</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{grouped.expired.length}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between" disabled={grouped.expired.length === 0}>
                View Expired Services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Critical Card */}
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                Critical
              </CardTitle>
              <CardDescription>Expiring in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{grouped.critical.length}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between" disabled={grouped.critical.length === 0}>
                View Critical Services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Soon Card */}
          <Card className="border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                Soon
              </CardTitle>
              <CardDescription>Expiring in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{grouped.soon.length}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between" disabled={grouped.soon.length === 0}>
                View Soon Expiring
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Upcoming Card */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Upcoming
              </CardTitle>
              <CardDescription>Expiring in more than 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{grouped.upcoming.length}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between" disabled={grouped.upcoming.length === 0}>
                View Upcoming
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Service Listings */}
        <div className="mt-8 space-y-6">
          {/* Expired Services */}
          {grouped.expired.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                Expired Services
              </h2>
              <ExpirationCardList services={grouped.expired} />
            </div>
          )}
          
          {/* Critical Services */}
          {grouped.critical.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                Critically Expiring Services
              </h2>
              <ExpirationCardList services={grouped.critical} />
            </div>
          )}
          
          {/* Soon Expiring Services */}
          {grouped.soon.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                Services Expiring Soon
              </h2>
              <ExpirationCardList services={grouped.soon} />
            </div>
          )}
          
          {/* Upcoming Services */}
          {grouped.upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Upcoming Expirations
              </h2>
              <ExpirationCardList services={grouped.upcoming} />
            </div>
          )}
          
          {/* No Results */}
          {!isLoading && 
           grouped.expired.length === 0 && 
           grouped.critical.length === 0 && 
           grouped.soon.length === 0 && 
           grouped.upcoming.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No services found for the selected criteria</h3>
              <p className="text-muted-foreground mt-2">
                Try changing the time range or status filter
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
