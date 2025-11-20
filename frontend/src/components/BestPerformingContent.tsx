import { TrendingUp, Heart, MessageCircle, Bookmark, Eye, Users } from 'lucide-react';

interface PostMetrics {
  id: string;
  caption: string;
  mediaUrl?: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  publishedAt: string;
}

interface BestPerformingContentProps {
  posts: PostMetrics[];
  limit?: number;
}

export default function BestPerformingContent({ posts, limit = 10 }: BestPerformingContentProps) {
  // Calculate engagement for each post
  const postsWithEngagement = posts.map(post => ({
    ...post,
    engagement: post.likes + post.comments + post.saves,
    engagementRate: post.reach > 0 ? ((post.likes + post.comments + post.saves) / post.reach) * 100 : 0,
  }));

  // Sort by engagement and take top N
  const topPosts = postsWithEngagement
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);

  if (topPosts.length === 0) {
    return (
      <div className="card text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No post data available yet</p>
        <p className="text-sm text-gray-500 mt-1">Publish some posts to see performance metrics</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
        <div className="text-sm text-gray-600">
          Showing top {topPosts.length} posts by engagement
        </div>
      </div>

      <div className="space-y-4">
        {topPosts.map((post, index) => (
          <div
            key={post.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : index === 1
                      ? 'bg-gray-100 text-gray-700'
                      : index === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Caption */}
                <p className="text-sm text-gray-900 mb-3 line-clamp-2">
                  {post.caption}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Impressions</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.impressions.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Reach</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.reach.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-pink-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.likes.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.comments.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bookmark className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Saves</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.saves.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Engagement</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.engagement.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Engagement Rate Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Engagement Rate</span>
                    <span className="font-semibold">{post.engagementRate.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${Math.min(post.engagementRate * 2, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Published Date */}
                <div className="mt-2 text-xs text-gray-500">
                  Published {new Date(post.publishedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Avg. Engagement Rate</p>
          <p className="text-2xl font-bold text-indigo-600">
            {(topPosts.reduce((sum, p) => sum + p.engagementRate, 0) / topPosts.length).toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Total Impressions</p>
          <p className="text-2xl font-bold text-blue-600">
            {topPosts.reduce((sum, p) => sum + p.impressions, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Total Engagement</p>
          <p className="text-2xl font-bold text-purple-600">
            {topPosts.reduce((sum, p) => sum + p.engagement, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
