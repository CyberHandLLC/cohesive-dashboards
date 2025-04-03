import { Json } from './supabase';

export type MetricType = 'WEBSITE' | 'MARKETING' | 'AI' | 'GENERAL';

export interface ServiceMetric {
  id: string;
  clientServiceId: string;
  metricType: MetricType;
  metricName: string;
  metricValue: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Json;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface WebsiteMetrics {
  uptime: MetricDataPoint[];
  loadSpeed: MetricDataPoint[];
  traffic: MetricDataPoint[];
  errors: MetricDataPoint[];
}

export interface MarketingMetrics {
  seoRankings: MetricDataPoint[];
  campaignPerformance: MetricDataPoint[];
  socialEngagement: MetricDataPoint[];
  roi: MetricDataPoint[];
}

export interface AIMetrics {
  usage: MetricDataPoint[];
  accuracy: MetricDataPoint[];
  engagement: MetricDataPoint[];
  value: MetricDataPoint[];
}

export interface MetricSummary {
  current: number;
  previous: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  goal?: number;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface ServiceMetricsSnapshot {
  websiteMetrics?: {
    uptime: MetricSummary;
    loadSpeed: MetricSummary;
    traffic: MetricSummary;
    errors: MetricSummary;
  };
  marketingMetrics?: {
    seoRankings: MetricSummary;
    campaignPerformance: MetricSummary;
    socialEngagement: MetricSummary;
    roi: MetricSummary;
  };
  aiMetrics?: {
    usage: MetricSummary;
    accuracy: MetricSummary;
    engagement: MetricSummary;
    value: MetricSummary;
  };
}

export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface MetricQueryParams {
  clientServiceId: string;
  metricType: MetricType;
  metricName: string;
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
}
