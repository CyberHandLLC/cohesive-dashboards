import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Megaphone, 
  Share2, 
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useServiceMetrics } from '@/hooks/useServiceMetrics';
import { TimeRange } from '@/types/metrics';
import MetricCard from './MetricCard';
import MetricTimeSeriesChart from './MetricTimeSeriesChart';

interface MarketingPerformanceDashboardProps {
  clientServiceId: string;
  serviceName: string;
}

const MarketingPerformanceDashboard: React.FC<MarketingPerformanceDashboardProps> = ({
  clientServiceId,
  serviceName
}) => {
  const { 
    timeRange, 
    setTimeRange,
    getMetricData,
    getMetricSummary,
    getMetricsSnapshot
  } = useServiceMetrics(clientServiceId);
  
  const marketingMetrics = getMetricsSnapshot().marketingMetrics;
  
  if (!marketingMetrics) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">{serviceName} Marketing Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="SEO Rankings"
            summary={marketingMetrics.seoRankings}
            precision={1}
            className="border-l-4 border-l-green-500"
          />
          
          <MetricCard
            title="Campaign Performance"
            summary={marketingMetrics.campaignPerformance}
            precision={0}
            className="border-l-4 border-l-blue-500"
          />
          
          <MetricCard
            title="Social Engagement"
            summary={marketingMetrics.socialEngagement}
            precision={0}
            className="border-l-4 border-l-indigo-500"
          />
          
          <MetricCard
            title="ROI"
            summary={marketingMetrics.roi}
            unit="%"
            precision={1}
            className="border-l-4 border-l-amber-500"
          />
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricTimeSeriesChart
              title="SEO Rankings"
              description="Average position in search results (lower is better)"
              data={getMetricData('seoRankings', 'MARKETING')}
              color="#22c55e"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Campaign Performance"
              description="Number of clicks on campaign assets"
              data={getMetricData('campaignPerformance', 'MARKETING')}
              color="#3b82f6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Social Engagement"
              description="Number of interactions on social media platforms"
              data={getMetricData('socialEngagement', 'MARKETING')}
              color="#6366f1"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Marketing ROI"
              description="Return on investment percentage"
              data={getMetricData('roi', 'MARKETING')}
              unit="%"
              color="#f59e0b"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Marketing Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-4">
                  <BarChart className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">SEO Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      {marketingMetrics.seoRankings.trend === 'down' 
                        ? 'SEO rankings are improving. Keep up the good work!' 
                        : marketingMetrics.seoRankings.trend === 'stable'
                        ? 'SEO rankings are stable. Consider content refreshes.'
                        : 'SEO rankings are declining. Strategic intervention required.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Megaphone className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Campaign Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {marketingMetrics.campaignPerformance.trend === 'up' 
                        ? 'Campaigns are performing well with increasing engagement.'
                        : marketingMetrics.campaignPerformance.trend === 'stable'
                        ? 'Campaign performance is steady. Consider A/B testing.'
                        : 'Campaign performance is declining. Creative refresh needed.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Share2 className="h-5 w-5 text-indigo-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Social Media Trends</h3>
                    <p className="text-sm text-muted-foreground">
                      {marketingMetrics.socialEngagement.trend === 'up' 
                        ? 'Social engagement is growing. Current content strategy is working.'
                        : marketingMetrics.socialEngagement.trend === 'stable'
                        ? 'Social engagement is stable. Consider new formats or platforms.'
                        : 'Social engagement is declining. Content strategy review needed.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <DollarSign className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">ROI Health</h3>
                    <p className="text-sm text-muted-foreground">
                      {marketingMetrics.roi.status === 'success' 
                        ? 'Marketing ROI is excellent. Current strategies are cost-effective.'
                        : marketingMetrics.roi.status === 'warning'
                        ? 'ROI is acceptable but could be improved. Review budget allocation.'
                        : 'ROI is below targets. Urgent budget and strategy review needed.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="SEO Ranking Detailed View"
              description="Average position in search results (lower is better)"
              data={getMetricData('seoRankings', 'MARKETING')}
              color="#22c55e"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>SEO Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Average Position</div>
                      <div className="text-2xl font-bold">{marketingMetrics.seoRankings.current.toFixed(1)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Change</div>
                      <div className={`text-2xl font-bold ${
                        marketingMetrics.seoRankings.trend === 'down' ? 'text-green-500' : 
                        marketingMetrics.seoRankings.trend === 'up' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {marketingMetrics.seoRankings.trend === 'down' ? '↓' : 
                         marketingMetrics.seoRankings.trend === 'up' ? '↑' : '→'}
                        {Math.abs(marketingMetrics.seoRankings.changePercentage)}%
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">First Page Keywords</div>
                      <div className="text-2xl font-bold">
                        {marketingMetrics.seoRankings.current < 10 ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">SEO Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {marketingMetrics.seoRankings.trend === 'down' ? (
                        <>
                          <li>Continue current content strategy that's driving improved rankings</li>
                          <li>Focus on building more backlinks to maintain momentum</li>
                          <li>Expand keyword targeting to related topics</li>
                          <li>Consider creating more in-depth content for top-performing keywords</li>
                        </>
                      ) : marketingMetrics.seoRankings.trend === 'stable' ? (
                        <>
                          <li>Refresh existing content to improve relevance</li>
                          <li>Update metadata and improve title tags</li>
                          <li>Increase internal linking between related content</li>
                          <li>Review competitor content for inspiration</li>
                        </>
                      ) : (
                        <>
                          <li>Complete SEO audit needed to identify issues</li>
                          <li>Review recent Google algorithm updates that may have impacted rankings</li>
                          <li>Improve page speed and mobile usability</li>
                          <li>Address any technical SEO issues like broken links or crawl errors</li>
                          <li>Develop a content refresh and creation strategy</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Campaign Performance Detailed View"
              description="Number of clicks on campaign assets"
              data={getMetricData('campaignPerformance', 'MARKETING')}
              color="#3b82f6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Total Clicks</div>
                      <div className="text-2xl font-bold">{Math.round(marketingMetrics.campaignPerformance.current)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Conversion Rate</div>
                      <div className="text-2xl font-bold">
                        {(marketingMetrics.campaignPerformance.current / 
                          (marketingMetrics.campaignPerformance.current * 5) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Performance Trend</div>
                      <div className={`text-2xl font-bold ${
                        marketingMetrics.campaignPerformance.trend === 'up' ? 'text-green-500' : 
                        marketingMetrics.campaignPerformance.trend === 'down' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {marketingMetrics.campaignPerformance.trend === 'up' ? 'Rising' : 
                         marketingMetrics.campaignPerformance.trend === 'down' ? 'Declining' : 
                         'Stable'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Campaign Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {marketingMetrics.campaignPerformance.trend === 'up' ? (
                        <>
                          <li>Increase budget allocation to top-performing campaigns</li>
                          <li>Expand audience targeting with similar demographics</li>
                          <li>Test new creative variations to prevent ad fatigue</li>
                          <li>Develop new campaigns based on successful elements</li>
                        </>
                      ) : marketingMetrics.campaignPerformance.trend === 'stable' ? (
                        <>
                          <li>Implement A/B testing to find optimization opportunities</li>
                          <li>Refresh ad creatives to prevent stagnation</li>
                          <li>Review audience segmentation for more precise targeting</li>
                          <li>Consider new channels or platforms to expand reach</li>
                        </>
                      ) : (
                        <>
                          <li>Urgent campaign audit to identify underperforming elements</li>
                          <li>Pause low-performing ads and reallocate budget</li>
                          <li>Review targeting parameters for relevance</li>
                          <li>Develop new creative concepts and messaging</li>
                          <li>Consider retargeting campaigns to re-engage lost prospects</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="social" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Social Engagement Detailed View"
              description="Number of interactions on social media platforms"
              data={getMetricData('socialEngagement', 'MARKETING')}
              color="#6366f1"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Social Media Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Total Interactions</div>
                      <div className="text-2xl font-bold">{Math.round(marketingMetrics.socialEngagement.current)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Engagement Rate</div>
                      <div className="text-2xl font-bold">
                        {(marketingMetrics.socialEngagement.current / 
                          (marketingMetrics.socialEngagement.current * 10) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Trend</div>
                      <div className={`text-2xl font-bold ${
                        marketingMetrics.socialEngagement.trend === 'up' ? 'text-green-500' : 
                        marketingMetrics.socialEngagement.trend === 'down' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {marketingMetrics.socialEngagement.trend === 'up' ? 'Growing' : 
                         marketingMetrics.socialEngagement.trend === 'down' ? 'Declining' : 
                         'Stable'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Social Media Strategy Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {marketingMetrics.socialEngagement.trend === 'up' ? (
                        <>
                          <li>Continue with current content types that drive engagement</li>
                          <li>Increase posting frequency on top-performing platforms</li>
                          <li>Initiate community-building initiatives to maintain momentum</li>
                          <li>Consider influencer collaborations to expand reach</li>
                        </>
                      ) : marketingMetrics.socialEngagement.trend === 'stable' ? (
                        <>
                          <li>Experiment with new content formats (video, stories, reels)</li>
                          <li>Increase audience interaction through questions and polls</li>
                          <li>Review posting schedule for optimal timing</li>
                          <li>Consider social media contests or giveaways</li>
                        </>
                      ) : (
                        <>
                          <li>Complete content audit to identify underperforming posts</li>
                          <li>Research current social media trends for content inspiration</li>
                          <li>Revise tone and messaging to better resonate with audience</li>
                          <li>Consider new platforms where target audience is active</li>
                          <li>Develop a consistent posting schedule to rebuild engagement</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="roi" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Marketing ROI Detailed View"
              description="Return on investment percentage"
              data={getMetricData('roi', 'MARKETING')}
              unit="%"
              color="#f59e0b"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Current ROI</div>
                      <div className="text-2xl font-bold">{marketingMetrics.roi.current.toFixed(1)}%</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Previous ROI</div>
                      <div className="text-2xl font-bold">{marketingMetrics.roi.previous.toFixed(1)}%</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">ROI Status</div>
                      <div className={`text-2xl font-bold ${
                        marketingMetrics.roi.status === 'success' ? 'text-green-500' : 
                        marketingMetrics.roi.status === 'warning' ? 'text-amber-500' : 
                        'text-destructive'
                      }`}>
                        {marketingMetrics.roi.status === 'success' ? 'Excellent' : 
                         marketingMetrics.roi.status === 'warning' ? 'Adequate' : 
                         'Poor'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">ROI Improvement Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {marketingMetrics.roi.status === 'success' ? (
                        <>
                          <li>Continue investing in high-performing marketing channels</li>
                          <li>Consider incremental budget increases for scaling</li>
                          <li>Document successful strategies for replication</li>
                          <li>Test new channels with small budget allocations</li>
                        </>
                      ) : marketingMetrics.roi.status === 'warning' ? (
                        <>
                          <li>Review budget allocation across channels to identify inefficiencies</li>
                          <li>Optimize conversion funnels to improve lead quality</li>
                          <li>Implement conversion rate optimization techniques</li>
                          <li>Consider reducing spend on lower-performing channels</li>
                        </>
                      ) : (
                        <>
                          <li>Immediate marketing spend review required</li>
                          <li>Pause campaigns with negative or very low ROI</li>
                          <li>Analyze conversion barriers throughout the customer journey</li>
                          <li>Revise targeting to focus on higher-value prospects</li>
                          <li>Adjust pricing strategy to improve margins if applicable</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingPerformanceDashboard;
