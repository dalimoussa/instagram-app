import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ComparativeData {
  current: {
    impressions: number;
    reach: number;
    engagement: number;
    followerCount: number;
  };
  previous: {
    impressions: number;
    reach: number;
    engagement: number;
    followerCount: number;
  };
}

interface ComparativeAnalyticsProps {
  data: ComparativeData;
  period: 'week' | 'month';
}

export default function ComparativeAnalytics({ data, period }: ComparativeAnalyticsProps) {
  const calculateChange = (current: number, previous: number): { percentage: number; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { percentage: 0, trend: 'neutral' };
    const percentage = ((current - previous) / previous) * 100;
    const trend: 'up' | 'down' | 'neutral' = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    return { percentage: Math.abs(percentage), trend };
  };

  const metrics = [
    {
      name: 'Impressions',
      current: data.current.impressions,
      previous: data.previous.impressions,
      color: '#3b82f6',
    },
    {
      name: 'Reach',
      current: data.current.reach,
      previous: data.previous.reach,
      color: '#10b981',
    },
    {
      name: 'Engagement',
      current: data.current.engagement,
      previous: data.previous.engagement,
      color: '#8b5cf6',
    },
    {
      name: 'Followers',
      current: data.current.followerCount,
      previous: data.previous.followerCount,
      color: '#f59e0b',
    },
  ];

  const chartData = metrics.map(metric => ({
    name: metric.name,
    Current: metric.current,
    Previous: metric.previous,
  }));

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {period === 'week' ? 'Week over Week' : 'Month over Month'} Comparison
        </h3>
        <p className="text-sm text-gray-600">
          Compare current period performance with previous period
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => {
          const change = calculateChange(metric.current, metric.previous);
          return (
            <div key={metric.name} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(change.trend)}
                  <span className={`text-sm font-semibold ${getTrendColor(change.trend)}`}>
                    {change.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Current</span>
                  <span className="text-lg font-bold text-gray-900">
                    {metric.current.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Previous</span>
                  <span className="text-sm text-gray-600">
                    {metric.previous.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Visual Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Previous" fill="#94a3b8" name={`Previous ${period}`} />
            <Bar dataKey="Current" fill="#6366f1" name={`Current ${period}`} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
