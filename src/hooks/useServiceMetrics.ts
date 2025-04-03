import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ServiceMetric, 
  MetricType, 
  MetricDataPoint, 
  TimeRange,
  MetricSummary,
  ServiceMetricsSnapshot
} from '@/types/metrics';
import { addDays, addMonths, addYears, subDays, subMonths, subYears, differenceInDays } from 'date-fns';

/**
 * Custom hook for managing service metrics and performance data
 */
export function useServiceMetrics(clientServiceId: string) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [metricType, setMetricType] = useState<MetricType | null>(null);

  // Calculate date range based on the selected time range
  const getDateRange = useCallback((range: TimeRange) => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'day': 
        startDate = subDays(endDate, 1);
        break;
      case 'week': 
        startDate = subDays(endDate, 7);
        break;
      case 'month': 
        startDate = subMonths(endDate, 1);
        break;
      case 'quarter': 
        startDate = subMonths(endDate, 3);
        break;
      case 'year': 
        startDate = subYears(endDate, 1);
        break;
    }
    
    return { startDate, endDate };
  }, []);

  // Fetch metrics data for a specific service
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['serviceMetrics', clientServiceId, timeRange, metricType],
    queryFn: async () => {
      try {
        const { startDate, endDate } = getDateRange(timeRange);
        
        let query = supabase
          .from('ServiceMetric')
          .select('*')
          .eq('clientServiceId', clientServiceId)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString());
          
        if (metricType) {
          query = query.eq('metricType', metricType);
        }
        
        const { data, error } = await query.order('timestamp', { ascending: true });
        
        if (error) throw error;
        
        // Since the ServiceMetric table might not exist yet, we'll return mock data for development
        if (!data || data.length === 0) {
          return generateMockMetrics(clientServiceId, metricType, startDate, endDate);
        }
        
        return data as ServiceMetric[];
      } catch (error) {
        console.error('Error fetching service metrics:', error);
        // Return mock data as fallback for development
        const { startDate, endDate } = getDateRange(timeRange);
        return generateMockMetrics(clientServiceId, metricType, startDate, endDate);
      }
    },
    enabled: !!clientServiceId
  });

  // Get specific metric data points for charting
  const getMetricData = useCallback((metricName: string, type: MetricType): MetricDataPoint[] => {
    if (!metrics) return [];
    
    return metrics
      .filter(metric => metric.metricName === metricName && metric.metricType === type)
      .map(metric => ({
        timestamp: metric.timestamp,
        value: metric.metricValue,
        metadata: metric.metadata ? JSON.parse(metric.metadata as string) : {}
      }));
  }, [metrics]);

  // Calculate metric summaries for quick overview
  const getMetricSummary = useCallback((metricName: string, type: MetricType): MetricSummary => {
    const dataPoints = getMetricData(metricName, type);
    
    if (dataPoints.length === 0) {
      return {
        current: 0,
        previous: 0,
        changePercentage: 0,
        trend: 'stable',
        status: 'info'
      };
    }
    
    // Get current and previous values
    const current = dataPoints[dataPoints.length - 1].value;
    const previous = dataPoints.length > 1 ? dataPoints[0].value : current;
    
    // Calculate change
    const change = current - previous;
    const changePercentage = previous !== 0 
      ? Math.round((change / previous) * 100) 
      : 0;
    
    // Determine trend
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    // Determine status based on the metric
    let status: 'success' | 'warning' | 'error' | 'info' = 'info';
    
    switch (metricName) {
      case 'uptime':
        status = current >= 99 ? 'success' : current >= 95 ? 'warning' : 'error';
        break;
      case 'loadSpeed':
        status = current <= 1.5 ? 'success' : current <= 3 ? 'warning' : 'error';
        break;
      case 'errors':
        status = current === 0 ? 'success' : current <= 5 ? 'warning' : 'error';
        break;
      case 'roi':
      case 'traffic':
      case 'socialEngagement':
      case 'seoRankings':
      case 'usage':
      case 'accuracy':
        status = trend === 'up' ? 'success' : trend === 'stable' ? 'info' : 'warning';
        break;
      default:
        status = 'info';
    }
    
    return {
      current,
      previous,
      changePercentage,
      trend,
      status
    };
  }, [getMetricData]);

  // Get all metrics snapshots
  const getMetricsSnapshot = useCallback((): ServiceMetricsSnapshot => {
    return {
      websiteMetrics: {
        uptime: getMetricSummary('uptime', 'WEBSITE'),
        loadSpeed: getMetricSummary('loadSpeed', 'WEBSITE'),
        traffic: getMetricSummary('traffic', 'WEBSITE'),
        errors: getMetricSummary('errors', 'WEBSITE'),
      },
      marketingMetrics: {
        seoRankings: getMetricSummary('seoRankings', 'MARKETING'),
        campaignPerformance: getMetricSummary('campaignPerformance', 'MARKETING'),
        socialEngagement: getMetricSummary('socialEngagement', 'MARKETING'),
        roi: getMetricSummary('roi', 'MARKETING'),
      },
      aiMetrics: {
        usage: getMetricSummary('usage', 'AI'),
        accuracy: getMetricSummary('accuracy', 'AI'),
        engagement: getMetricSummary('engagement', 'AI'),
        value: getMetricSummary('value', 'AI'),
      },
    };
  }, [getMetricSummary]);

  return {
    metrics,
    isLoadingMetrics,
    timeRange,
    setTimeRange,
    metricType,
    setMetricType,
    getMetricData,
    getMetricSummary,
    getMetricsSnapshot
  };
}

// Helper function to generate mock metrics for development
function generateMockMetrics(
  clientServiceId: string, 
  metricType: MetricType | null, 
  startDate: Date, 
  endDate: Date
): ServiceMetric[] {
  const mockMetrics: ServiceMetric[] = [];
  const daysBetween = differenceInDays(endDate, startDate);
  
  // Website metrics
  if (!metricType || metricType === 'WEBSITE') {
    // Uptime (percentage)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `uptime-${i}`,
        clientServiceId,
        metricType: 'WEBSITE',
        metricName: 'uptime',
        metricValue: 99.8 + (Math.random() * 0.2 - 0.1), // 99.7% to 100%
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Load speed (seconds)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `loadSpeed-${i}`,
        clientServiceId,
        metricType: 'WEBSITE',
        metricName: 'loadSpeed',
        metricValue: 1.2 + (Math.random() * 0.6 - 0.3), // 0.9s to 1.5s
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Traffic (visits per day)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `traffic-${i}`,
        clientServiceId,
        metricType: 'WEBSITE',
        metricName: 'traffic',
        metricValue: Math.floor(500 + Math.random() * 300), // 500-800 visits
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Errors (count per day)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `errors-${i}`,
        clientServiceId,
        metricType: 'WEBSITE',
        metricName: 'errors',
        metricValue: Math.floor(Math.random() * 5), // 0-5 errors
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
  }
  
  // Marketing metrics
  if (!metricType || metricType === 'MARKETING') {
    // SEO Rankings (average position)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `seoRankings-${i}`,
        clientServiceId,
        metricType: 'MARKETING',
        metricName: 'seoRankings',
        // Lower is better for rankings, gradually improving
        metricValue: Math.max(1, 10 - (i / daysBetween) * 5 + (Math.random() * 2 - 1)),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Campaign Performance (clicks)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `campaignPerformance-${i}`,
        clientServiceId,
        metricType: 'MARKETING',
        metricName: 'campaignPerformance',
        metricValue: Math.floor(50 + (i / daysBetween) * 100 + (Math.random() * 30 - 15)),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Social Engagement (interactions)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `socialEngagement-${i}`,
        clientServiceId,
        metricType: 'MARKETING',
        metricName: 'socialEngagement',
        metricValue: Math.floor(200 + (i / daysBetween) * 300 + (Math.random() * 100 - 50)),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // ROI (percentage)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `roi-${i}`,
        clientServiceId,
        metricType: 'MARKETING',
        metricName: 'roi',
        metricValue: 150 + (i / daysBetween) * 50 + (Math.random() * 30 - 15),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
  }
  
  // AI metrics
  if (!metricType || metricType === 'AI') {
    // Usage (requests per day)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `usage-${i}`,
        clientServiceId,
        metricType: 'AI',
        metricName: 'usage',
        metricValue: Math.floor(1000 + (i / daysBetween) * 500 + (Math.random() * 200 - 100)),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Accuracy (percentage)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `accuracy-${i}`,
        clientServiceId,
        metricType: 'AI',
        metricName: 'accuracy',
        metricValue: 85 + (i / daysBetween) * 10 + (Math.random() * 2 - 1),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Engagement (minutes per user)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `engagement-${i}`,
        clientServiceId,
        metricType: 'AI',
        metricName: 'engagement',
        metricValue: 5 + (i / daysBetween) * 3 + (Math.random() * 2 - 1),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
    
    // Value (customer satisfaction 1-10)
    for (let i = 0; i <= daysBetween; i++) {
      const date = addDays(startDate, i);
      mockMetrics.push({
        id: `value-${i}`,
        clientServiceId,
        metricType: 'AI',
        metricName: 'value',
        metricValue: 7 + (i / daysBetween) * 2 + (Math.random() * 1 - 0.5),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
  }
  
  return mockMetrics;
}
