import { X, Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from 'lucide-react';

interface PostPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  mediaUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'REEL';
  accountUsername: string;
  accountAvatar?: string;
}

export default function PostPreview({
  isOpen,
  onClose,
  caption,
  mediaUrl,
  mediaType,
  accountUsername,
  accountAvatar,
}: PostPreviewProps) {
  if (!isOpen) return null;

  const formatCaption = (text: string) => {
    // Split into lines and process hashtags
    return text.split('\n').map((line, i) => {
      const parts = line.split(' ').map((word, j) => {
        if (word.startsWith('#')) {
          return (
            <span key={`${i}-${j}`} className="text-blue-900 font-medium">
              {word}{' '}
            </span>
          );
        }
        if (word.startsWith('@')) {
          return (
            <span key={`${i}-${j}`} className="text-blue-900 font-medium">
              {word}{' '}
            </span>
          );
        }
        return word + ' ';
      });
      return (
        <span key={i}>
          {parts}
          <br />
        </span>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-gray-900">Post Preview</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Instagram-style Preview */}
        <div className="bg-white">
          {/* Post Header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                {accountAvatar ? (
                  <img
                    src={accountAvatar}
                    alt={accountUsername}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {accountUsername.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{accountUsername}</p>
            </div>
            <button className="p-1">
              <MoreHorizontal className="w-5 h-5 text-gray-900" />
            </button>
          </div>

          {/* Media */}
          <div className="relative bg-black aspect-square">
            {mediaUrl ? (
              mediaType === 'VIDEO' || mediaType === 'REEL' ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">No media selected</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="hover:opacity-60 transition-opacity">
                  <Heart className="w-6 h-6" />
                </button>
                <button className="hover:opacity-60 transition-opacity">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="hover:opacity-60 transition-opacity">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button className="hover:opacity-60 transition-opacity">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Likes */}
          <div className="px-3 py-1">
            <p className="font-semibold text-sm text-gray-900">Preview Mode</p>
          </div>

          {/* Caption */}
          {caption && (
            <div className="px-3 pb-3 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-900">
                <span className="font-semibold mr-2">{accountUsername}</span>
                {formatCaption(caption)}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <div className="px-3 pb-3">
            <p className="text-xs text-gray-500 uppercase">
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">This is a preview</p>
              <p>Your actual post may appear slightly different on Instagram depending on user settings and device.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
