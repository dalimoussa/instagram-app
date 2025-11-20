import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsAPI, igAccountsAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';
import { 
  TrendingUp, Eye, Users, Heart, MessageCircle, Bookmark,
  RefreshCw, BarChart3, FileText, FileSpreadsheet
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ComparativeAnalytics from '../components/ComparativeAnalytics';
import BestPerformingContent from '../components/BestPerformingContent';
import { exportToCSV, exportToPDF } from '../lib/exportUtils';

interface AccountInsights {
  impressions: number;
  reach: number;
  followerCount: number;
  engagement: number;
  profileViews: number;
  websiteClicks: number;
}

interface PostInsight {
  postId: string;
  caption: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  engagement: number;
  publishedAt: string;
}

export default function Analytics() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch accounts
  const { data: accountsData } = useQuery({
    queryKey: ['ig-accounts'],
    queryFn: () => igAccountsAPI.getAll(),
  });

  // Fetch account insights
  const { data: accountInsightsData, isLoading: accountLoading } = useQuery({
    queryKey: ['account-insights', selectedAccountId, dateRange],
    queryFn: () => insightsAPI.getAccountInsights(selectedAccountId, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    enabled: !!selectedAccountId,
  });

  // Sync insights mutation
  const syncMutation = useMutation({
    mutationFn: (accountId: string) => insightsAPI.syncInsights(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-insights'] });
      addNotification('success', 'Insights synced successfully!');
    },
    onError: () => {
      addNotification('error', 'Failed to sync insights');
    },
  });

  const accounts = accountsData?.data || [];
  const accountInsights: AccountInsights = accountInsightsData?.data || {
    impressions: 0,
    reach: 0,
    followerCount: 0,
    engagement: 0,
    profileViews: 0,
    websiteClicks: 0,
  };
  
  // Note: Post insights API requires individual post IDs
  // For a complete implementation, fetch posts first, then get insights for each
  const postInsights: PostInsight[] = [];

  // Calculate engagement rate
  const engagementRate = accountInsights.reach > 0
    ? ((accountInsights.engagement / accountInsights.reach) * 100).toFixed(2)
    : '0.00';

  // Prepare chart data
  const chartData = postInsights.slice(0, 10).map(post => ({
    name: new Date(post.publishedAt).toLocaleDateString(),
    impressions: post.impressions,
    reach: post.reach,
    engagement: post.engagement,
  }));

  const exportData = () => {
    if (!selectedAccountId) {
      addNotification('error', 'Please select an account first');
      return;
    }

    // Security: Sanitize data before export
    const sanitizedData = {
      account: accounts.find((a: any) => a.id === selectedAccountId)?.username || 'unknown',
      dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
      accountMetrics: accountInsights,
      topPosts: postInsights.slice(0, 20).map(post => ({
        caption: post.caption.substring(0, 100),
        impressions: post.impressions,
        reach: post.reach,
        engagement: post.engagement,
        likes: post.likes,
        comments: post.comments,
        saves: post.saves,
        publishedAt: post.publishedAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    // Use the new export functions
    exportToPDF(sanitizedData);
    addNotification('success', 'Analytics data exported as PDF');
  };

  const exportAsCSV = () => {
    if (!selectedAccountId) {
      addNotification('error', 'Please select an account first');
      return;
    }

    const sanitizedData = {
      account: accounts.find((a: any) => a.id === selectedAccountId)?.username || 'unknown',
      dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
      accountMetrics: accountInsights,
      topPosts: postInsights.slice(0, 20).map(post => ({
        caption: post.caption.substring(0, 100),
        impressions: post.impressions,
        reach: post.reach,
        engagement: post.engagement,
        likes: post.likes,
        comments: post.comments,
        saves: post.saves,
        publishedAt: post.publishedAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    exportToCSV(sanitizedData);
    addNotification('success', 'Analytics data exported as CSV');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track performance metrics and insights for your Instagram accounts
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <select
              className="input"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">Choose an account...</option>
              {accounts.map((account: any) => (
                <option key={account.id} value={account.id}>
                  @{account.username} ({account.followersCount?.toLocaleString()} followers)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              max={dateRange.endDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {selectedAccountId && (
            <div className="flex gap-2 items-end">
              <button
                onClick={() => syncMutation.mutate(selectedAccountId)}
                disabled={syncMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Data
              </button>
              <button
                onClick={exportAsCSV}
                className="btn-secondary flex items-center gap-2"
                title="Export to CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={exportData}
                className="btn-secondary flex items-center gap-2"
                title="Export to PDF"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {!selectedAccountId ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select an Account to View Analytics
          </h3>
          <p className="text-gray-600">
            Choose an Instagram account from the dropdown above to see detailed performance metrics
          </p>
        </div>
      ) : accountLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Impressions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accountInsights.impressions.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reach</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accountInsights.reach.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{engagementRate}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accountInsights.engagement.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accountInsights.profileViews.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accountInsights.followerCount.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Analytics */}
          <div className="mb-8">
            <ComparativeAnalytics
              currentPeriod={{
                impressions: accountInsights.impressions,
                reach: accountInsights.reach,
                engagement: accountInsights.engagement,
                followerCount: accountInsights.followerCount,
                profileViews: accountInsights.profileViews,
              }}
              previousPeriod={{
                // Mock data - in production, fetch actual previous period data
                impressions: Math.floor(accountInsights.impressions * 0.85),
                reach: Math.floor(accountInsights.reach * 0.9),
                engagement: Math.floor(accountInsights.engagement * 0.88),
                followerCount: Math.floor(accountInsights.followerCount * 0.98),
                profileViews: Math.floor(accountInsights.profileViews * 0.92),
              }}
              periodLabel={`${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`}
              previousLabel="Previous Period"
            />
          </div>

          {/* Best Performing Content */}
          {postInsights.length > 0 && (
            <div className="mb-8">
              <BestPerformingContent 
                posts={postInsights.map(post => ({
                  id: post.postId,
                  caption: post.caption,
                  impressions: post.impressions,
                  reach: post.reach,
                  likes: post.likes,
                  comments: post.comments,
                  saves: post.saves,
                  publishedAt: post.publishedAt,
                }))} 
                limit={10} 
              />
            </div>
          )}

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Impressions & Reach Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Engagement by Post
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="engagement" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Posts Table */}
          {postInsights.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Performing Posts
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Caption</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        <Eye className="w-4 h-4 inline mr-1" />
                        Impressions
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        <Users className="w-4 h-4 inline mr-1" />
                        Reach
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        <Heart className="w-4 h-4 inline mr-1" />
                        Likes
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        <MessageCircle className="w-4 h-4 inline mr-1" />
                        Comments
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        <Bookmark className="w-4 h-4 inline mr-1" />
                        Saves
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {postInsights.slice(0, 20).map((post) => (
                      <tr key={post.postId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {post.caption}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {post.impressions.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {post.reach.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {post.likes.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {post.comments.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {post.saves.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600 text-right">
                          {post.engagement.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
