import { Minus, ArrowUp, ArrowDown } from 'lucide-react';

interface AnalyticsPeriod {
  impressions: number;
  reach: number;
  engagement: number;
  followerCount: number;
  profileViews: number;
}

interface ComparativeAnalyticsProps {
  currentPeriod: AnalyticsPeriod;
  previousPeriod: AnalyticsPeriod;
  periodLabel?: string;
  previousLabel?: string;
}

export default function ComparativeAnalytics({
  currentPeriod,
  previousPeriod,
  periodLabel = 'This Week',
  previousLabel = 'Last Week',
}: ComparativeAnalyticsProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percent: 0, isIncrease: current > 0, isDecrease: false };
    const percent = ((current - previous) / previous) * 100;
    return {
      percent: Math.abs(percent),
      isIncrease: percent > 0,
      isDecrease: percent < 0,
    };
  };

  const metrics = [
    {
      label: 'Impressions',
      current: currentPeriod.impressions,
      previous: previousPeriod.impressions,
      color: 'blue',
    },
    {
      label: 'Reach',
      current: currentPeriod.reach,
      previous: previousPeriod.reach,
      color: 'green',
    },
    {
      label: 'Engagement',
      current: currentPeriod.engagement,
      previous: previousPeriod.engagement,
      color: 'purple',
    },
    {
      label: 'Profile Views',
      current: currentPeriod.profileViews,
      previous: previousPeriod.profileViews,
      color: 'indigo',
    },
    {
      label: 'Followers',
      current: currentPeriod.followerCount,
      previous: previousPeriod.followerCount,
      color: 'yellow',
    },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Period Comparison</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-600">{periodLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-gray-600">{previousLabel}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {metrics.map((metric) => {
          const change = calculateChange(metric.current, metric.previous);
          const colorClass = {
            blue: 'bg-blue-50 text-blue-700',
            green: 'bg-green-50 text-green-700',
            purple: 'bg-purple-50 text-purple-700',
            indigo: 'bg-indigo-50 text-indigo-700',
            yellow: 'bg-yellow-50 text-yellow-700',
          }[metric.color] || 'bg-gray-50 text-gray-700';
          
          const textColor = colorClass.split(' ')[1];
          const bgColor = colorClass.split(' ')[0].replace('50', '500');

          return (
            <div key={metric.label} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                <div className="flex items-center gap-2">
                  {change.isIncrease ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="w-4 h-4" />
                      <span>+{change.percent.toFixed(1)}%</span>
                    </div>
                  ) : change.isDecrease ? (
                    <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                      <ArrowDown className="w-4 h-4" />
                      <span>-{change.percent.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                      <Minus className="w-4 h-4" />
                      <span>0%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-2xl font-bold ${textColor}`}>
                      {metric.current.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">{periodLabel}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bgColor} transition-all duration-500`}
                      style={{
                        width: `${Math.min((metric.current / Math.max(metric.current, metric.previous)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-400">
                      {metric.previous.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">{previousLabel}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 transition-all duration-500"
                      style={{
                        width: `${Math.min((metric.previous / Math.max(metric.current, metric.previous)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Growth</p>
            <p className="text-lg font-bold text-green-600">
              +{calculateChange(
                currentPeriod.impressions + currentPeriod.reach + currentPeriod.engagement,
                previousPeriod.impressions + previousPeriod.reach + previousPeriod.engagement
              ).percent.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Best Metric</p>
            <p className="text-lg font-bold text-indigo-600">
              {metrics.reduce((best, m) => {
                const change = calculateChange(m.current, m.previous);
                const bestChange = calculateChange(best.current, best.previous);
                return change.percent > bestChange.percent ? m : best;
              }).label}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Engagement</p>
            <p className="text-lg font-bold text-purple-600">
              {(currentPeriod.engagement + currentPeriod.profileViews).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
