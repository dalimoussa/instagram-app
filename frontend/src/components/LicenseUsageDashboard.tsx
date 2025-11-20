import { useQuery } from '@tanstack/react-query';
import { 
  Users, Calendar, FileText, TrendingUp, 
  AlertCircle, CheckCircle, Clock, Zap 
} from 'lucide-react';
import { licensesAPI, igAccountsAPI, schedulesAPI, postsAPI } from '../lib/api';

export default function LicenseUsageDashboard() {
  // Fetch license status
  const { data: licenseData } = useQuery({
    queryKey: ['license-status'],
    queryFn: () => licensesAPI.getStatus(),
  });

  // Fetch counts
  const { data: accountsData } = useQuery({
    queryKey: ['ig-accounts'],
    queryFn: () => igAccountsAPI.getAll(),
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesAPI.getAll(),
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts-count'],
    queryFn: () => postsAPI.getAll({ limit: 1000 }),
  });

  const license = licenseData?.data || null;
  const accountCount = accountsData?.data?.length || 0;
  const scheduleCount = schedulesData?.data?.length || 0;
  const postCount = postsData?.data?.length || 0;

  // Calculate limits (default values if no license)
  const limits = {
    maxAccounts: license?.maxAccounts || 100, // Upgraded for client: 50-100 accounts
    maxSchedules: license?.maxSchedules || 200, // Upgraded: more schedules needed
    maxPostsPerMonth: license?.maxPostsPerMonth || 500, // Upgraded: high-volume posting
  };

  // Calculate percentages
  const accountsPercent = (accountCount / limits.maxAccounts) * 100;
  const schedulesPercent = (scheduleCount / limits.maxSchedules) * 100;
  const postsPercent = (postCount / limits.maxPostsPerMonth) * 100;

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!license?.expiresAt) return null;
    const expiry = new Date(license.expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  // Get status color
  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* License Status Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {license?.plan || 'ENTERPRISE'} Plan
            </h2>
            <p className="text-indigo-100">
              {license?.isActive ? 'Active License' : 'Active License'}
            </p>
          </div>
          <div className="p-3 bg-white bg-opacity-20 rounded-lg">
            {license?.isActive ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>
        </div>

        {daysUntilExpiry !== null && (
          <div className="flex items-center gap-2 mt-4">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
              {daysUntilExpiry > 0 ? (
                <>
                  Expires in{' '}
                  <span className="font-semibold">
                    {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="font-semibold">Expired</span>
              )}
            </span>
          </div>
        )}

        {/* Expiry Warning */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
          <div className="mt-4 p-3 bg-yellow-400 bg-opacity-20 border border-yellow-300 border-opacity-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">License Expiring Soon!</p>
                <p>Your license will expire in {daysUntilExpiry} days. Renew now to avoid service interruption.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instagram Accounts */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(accountsPercent)}`}>
              {accountCount}/{limits.maxAccounts}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagram Accounts</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Usage</span>
              <span className="font-medium text-gray-900">
                {accountsPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(accountsPercent)} transition-all duration-500`}
                style={{ width: `${Math.min(accountsPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {limits.maxAccounts - accountCount} account{limits.maxAccounts - accountCount !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>

        {/* Schedules */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(schedulesPercent)}`}>
              {scheduleCount}/{limits.maxSchedules}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Schedules</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Usage</span>
              <span className="font-medium text-gray-900">
                {schedulesPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(schedulesPercent)} transition-all duration-500`}
                style={{ width: `${Math.min(schedulesPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {limits.maxSchedules - scheduleCount} schedule{limits.maxSchedules - scheduleCount !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>

        {/* Posts This Month */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(postsPercent)}`}>
              {postCount}/{limits.maxPostsPerMonth}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Posts This Month</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Usage</span>
              <span className="font-medium text-gray-900">
                {postsPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(postsPercent)} transition-all duration-500`}
                style={{ width: `${Math.min(postsPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {limits.maxPostsPerMonth - postCount} post{limits.maxPostsPerMonth - postCount !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt */}
      {(accountsPercent >= 80 || schedulesPercent >= 80 || postsPercent >= 80) && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Approaching Your Limits
              </h3>
              <p className="text-gray-700 mb-4">
                You're using a significant portion of your plan limits. Upgrade now to unlock more features and avoid interruptions.
              </p>
              <div className="flex gap-3">
                <button className="btn-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Upgrade Plan
                </button>
                <button className="btn-secondary">
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Features */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Plan Includes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Up to {limits.maxAccounts} Instagram Accounts</p>
              <p className="text-sm text-gray-600">Connect multiple accounts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Up to {limits.maxSchedules} Schedules</p>
              <p className="text-sm text-gray-600">Automate your posting</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{limits.maxPostsPerMonth} Posts per Month</p>
              <p className="text-sm text-gray-600">Publish regularly</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Analytics & Insights</p>
              <p className="text-sm text-gray-600">Track performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
