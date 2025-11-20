import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { igAccountsAPI, themesAPI, schedulesAPI, postsAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import { 
  Instagram, Palette, Calendar, FileText, 
  TrendingUp, Clock, CheckCircle, Plus, ArrowRight 
} from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  // Fetch dashboard data
  const { data: accountsData } = useQuery({
    queryKey: ['ig-accounts'],
    queryFn: () => igAccountsAPI.getAll(),
  });

  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themesAPI.getAll(),
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesAPI.getAll({ status: 'PENDING' }),
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts-recent'],
    queryFn: () => postsAPI.getAll({ limit: 10 }),
  });

  const accounts = accountsData?.data || [];
  const themes = themesData?.data || [];
  const schedules = schedulesData?.data || [];
  const recentPosts = postsData?.data || [];

  // Calculate stats
  const activeAccounts = accounts.filter((acc: any) => acc.isActive).length;
  const totalScheduled = schedules.length;
  const publishedToday = recentPosts.filter((post: any) => {
    if (!post.publishedAt) return false;
    const publishedAt = new Date(post.publishedAt);
    const today = new Date();
    return publishedAt.toDateString() === today.toDateString() && post.status === 'PUBLISHED';
  }).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.displayName || user?.email}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/accounts" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Connected Accounts</p>
              <p className="text-3xl font-bold text-gray-900">{activeAccounts}</p>
              <p className="text-xs text-gray-500 mt-1">{accounts.length} total</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-lg">
              <Instagram className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>

        <Link to="/themes" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Content Themes</p>
              <p className="text-3xl font-bold text-gray-900">{themes.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {themes.reduce((sum: number, t: any) => sum + (t.mediaCount || 0), 0)} media files
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Palette className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>

        <Link to="/schedules" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Scheduled Posts</p>
              <p className="text-3xl font-bold text-gray-900">{totalScheduled}</p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>

        <Link to="/posts" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Published Today</p>
              <p className="text-3xl font-bold text-gray-900">{publishedToday}</p>
              <p className="text-xs text-gray-500 mt-1">{recentPosts.length} total</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/accounts" className="btn-secondary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Connect Instagram
          </Link>
          <Link to="/themes" className="btn-secondary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Create Theme
          </Link>
          <Link to="/schedules" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Schedule Post
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedules */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Schedules
            </h2>
            <Link to="/schedules" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No upcoming schedules</p>
              <Link to="/schedules" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Schedule First Post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.slice(0, 5).map((schedule: any) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {schedule.name || schedule.caption || 'Scheduled Post'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(schedule.scheduledTime).toLocaleString()} • {schedule.theme?.name || 'No theme'}
                    </p>
                  </div>
                  <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {schedule.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Posts
            </h2>
            <Link to="/posts" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No posts yet</p>
              <p className="text-xs text-gray-400 mt-1">Posts will appear here after scheduling</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.slice(0, 5).map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {post.caption}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{post.igAccount?.username} • {
                        post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'Not published'
                      }
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${
                    post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    post.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    post.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Insight */}
      {(accounts.length > 0 || recentPosts.length > 0) && (
        <div className="card mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Performance Overview</h3>
              <p className="text-sm text-gray-700">
                You have {activeAccounts} active account{activeAccounts !== 1 ? 's' : ''} connected
                {recentPosts.length > 0 && ` with ${recentPosts.filter((p: any) => p.status === 'PUBLISHED').length} published posts`}.
                {totalScheduled > 0 && ` ${totalScheduled} post${totalScheduled !== 1 ? 's are' : ' is'} scheduled.`}
              </p>
              <Link to="/analytics" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View Detailed Analytics
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="card mt-6 text-center py-12">
          <Instagram className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Get Started with AutoPoster
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Instagram accounts, create themes, and start scheduling posts automatically.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/accounts" className="btn-primary">
              Connect Instagram Account
            </Link>
            <Link to="/themes" className="btn-secondary">
              Browse Features
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
