import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI, igAccountsAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';
import { 
  FileText, Filter, RefreshCw, ExternalLink, Trash2,
  CheckCircle, XCircle, Clock, Play, Image, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface Post {
  id: string;
  caption: string;
  hashtags: string[];
  mediaUrl?: string;
  instagramPostId?: string;
  instagramPostUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  errorMessage?: string;
  publishedAt?: string;
  createdAt: string;
  igAccount?: {
    username: string;
    id: string;
  };
  schedule?: {
    scheduledTime: string;
  };
}

export default function Posts() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [filters, setFilters] = useState({
    igAccountId: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch posts with filters (auto-refresh every 5 seconds if there are processing posts)
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', filters, currentPage],
    queryFn: () => postsAPI.getAll({
      ...filters,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }),
    refetchInterval: (query) => {
      // Auto-refresh if any posts are in PENDING or PROCESSING state
      const posts = query?.state?.data?.data || [];
      const hasActivePost = posts.some((post: Post) => 
        post.status === 'PENDING' || post.status === 'PROCESSING'
      );
      return hasActivePost ? 5000 : false; // 5 seconds if active, otherwise no auto-refresh
    },
  });

  // Fetch accounts for filter
  const { data: accountsData } = useQuery({
    queryKey: ['ig-accounts'],
    queryFn: () => igAccountsAPI.getAll(),
  });

  const posts = postsData?.data || [];
  const accounts = accountsData?.data || [];

  // Retry failed post mutation
  const retryMutation = useMutation({
    mutationFn: (postId: string) => postsAPI.retry(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      addNotification('success', 'Post retry initiated');
    },
    onError: () => {
      addNotification('error', 'Failed to retry post');
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => postsAPI.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addNotification('success', 'Post deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete post';
      addNotification('error', errorMessage);
    },
  });

  const getStatusBadge = (status: Post['status']) => {
    const configs = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: Play },
      PUBLISHED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${config.color}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const resetFilters = () => {
    setFilters({ igAccountId: '', status: '' });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading posts...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post History</h1>
        <p className="text-gray-600 mt-2">
          View and manage all Instagram posts across your accounts
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            className="input max-w-xs"
            value={filters.igAccountId}
            onChange={(e) => {
              setFilters({ ...filters, igAccountId: e.target.value });
              setCurrentPage(1);
            }}
          >
            <option value="">All Accounts</option>
            {accounts.map((account: any) => (
              <option key={account.id} value={account.id}>
                @{account.username}
              </option>
            ))}
          </select>

          <select
            className="input max-w-xs"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setCurrentPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>

          {(filters.igAccountId || filters.status) && (
            <button
              onClick={resetFilters}
              className="btn-secondary text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Posts Found
          </h3>
          <p className="text-gray-600 mb-6">
            {filters.igAccountId || filters.status
              ? 'No posts match your current filters'
              : 'Schedule your first post to get started'}
          </p>
          {(filters.igAccountId || filters.status) && (
            <button onClick={resetFilters} className="btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post: Post) => (
              <div key={post.id} className="card hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Media Thumbnail */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="w-12 h-12 text-gray-400"><svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                        }}
                      />
                    ) : (
                      <Image className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* Post Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(post.status)}
                        <span className="text-sm text-gray-600">
                          @{post.igAccount?.username || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {post.status === 'FAILED' && (
                          <button
                            onClick={() => retryMutation.mutate(post.id)}
                            disabled={retryMutation.isPending}
                            className="btn-secondary text-sm flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                          </button>
                        )}
                        {post.instagramPostUrl && (
                          <a
                            href={post.instagramPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Instagram
                          </a>
                        )}
                        {(post.status === 'FAILED' || post.status === 'PENDING') && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="btn-secondary text-red-600 hover:bg-red-50 text-sm flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Caption */}
                    <p className="text-gray-900 mb-2 line-clamp-2">
                      {post.caption}
                    </p>

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {post.hashtags.slice(0, 8).map((tag, idx) => (
                          <span key={idx} className="text-sm text-indigo-600">
                            #{tag}
                          </span>
                        ))}
                        {post.hashtags.length > 8 && (
                          <span className="text-sm text-gray-500">
                            +{post.hashtags.length - 8}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {post.status === 'FAILED' && post.errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {post.errorMessage}
                        </p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {post.publishedAt && (
                        <span>
                          Published {new Date(post.publishedAt).toLocaleString()}
                        </span>
                      )}
                      {post.schedule?.scheduledTime && !post.publishedAt && (
                        <span>
                          Scheduled for {new Date(post.schedule.scheduledTime).toLocaleString()}
                        </span>
                      )}
                      <span>
                        Created {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 card">
            <div className="text-sm text-gray-600">
              Page {currentPage} • Showing {posts.length} posts
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={posts.length < pageSize}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
