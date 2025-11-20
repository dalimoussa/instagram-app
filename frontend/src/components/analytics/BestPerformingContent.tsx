import { Heart, MessageCircle, Bookmark, Eye, TrendingUp } from 'lucide-react';

interface PostInsight {
  postId: string;
  caption: string;
  mediaUrl?: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  engagement: number;
  publishedAt: string;
}

interface BestPerformingContentProps {
  posts: PostInsight[];
}

export default function BestPerformingContent({ posts }: BestPerformingContentProps) {
  // Sort posts by engagement rate
  const sortedPosts = [...posts].sort((a, b) => {
    const rateA = a.reach > 0 ? (a.engagement / a.reach) * 100 : 0;
    const rateB = b.reach > 0 ? (b.engagement / b.reach) * 100 : 0;
    return rateB - rateA;
  });

  const topPost = sortedPosts[0];
  
  if (!topPost) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No post data available</p>
      </div>
    );
  }

  const getEngagementRate = (post: PostInsight) => {
    return post.reach > 0 ? ((post.engagement / post.reach) * 100).toFixed(2) : '0.00';
  };

  const getBestMetric = () => {
    const metrics = {
      'Highest Engagement': sortedPosts[0],
      'Most Impressions': [...posts].sort((a, b) => b.impressions - a.impressions)[0],
      'Most Reach': [...posts].sort((a, b) => b.reach - a.reach)[0],
      'Most Saves': [...posts].sort((a, b) => b.saves - a.saves)[0],
    };
    return metrics;
  };

  const bestMetrics = getBestMetric();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Best Performing Content
        </h3>
        <p className="text-sm text-gray-600">
          Analysis of your top performing posts based on engagement metrics
        </p>
      </div>

      {/* Top Post Highlight */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          {topPost.mediaUrl && (
            <img 
              src={topPost.mediaUrl} 
              alt="Top post" 
              className="w-32 h-32 object-cover rounded-lg shadow-md"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h4 className="text-lg font-semibold text-gray-900">
                Top Performing Post
              </h4>
            </div>
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {topPost.caption}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-2">
                <div className="flex items-center gap-1 text-pink-600 mb-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-medium">Likes</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {topPost.likes.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="flex items-center gap-1 text-blue-600 mb-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Comments</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {topPost.comments.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="flex items-center gap-1 text-purple-600 mb-1">
                  <Bookmark className="w-4 h-4" />
                  <span className="text-xs font-medium">Saves</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {topPost.saves.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Engagement Rate</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {getEngagementRate(topPost)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(bestMetrics).map(([category, post]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">{category}</h5>
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{post.caption}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-3 text-sm">
                {category === 'Highest Engagement' && (
                  <span className="font-semibold text-purple-600">
                    {post.engagement.toLocaleString()} engagements
                  </span>
                )}
                {category === 'Most Impressions' && (
                  <span className="font-semibold text-blue-600">
                    {post.impressions.toLocaleString()} impressions
                  </span>
                )}
                {category === 'Most Reach' && (
                  <span className="font-semibold text-green-600">
                    {post.reach.toLocaleString()} reach
                  </span>
                )}
                {category === 'Most Saves' && (
                  <span className="font-semibold text-yellow-600">
                    {post.saves.toLocaleString()} saves
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 10 List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h5 className="text-sm font-semibold text-gray-900">Top 10 Posts by Engagement Rate</h5>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedPosts.slice(0, 10).map((post, index) => (
            <div key={post.postId} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{post.caption}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.impressions.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {getEngagementRate(post)}% engagement
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-4 h-4" />
                    {post.saves.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
