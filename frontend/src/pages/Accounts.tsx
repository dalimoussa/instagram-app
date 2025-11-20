import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { igAccountsAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';
import { Instagram, RefreshCw, Trash2, Plus, ExternalLink } from 'lucide-react';

interface IGAccount {
  id: string;
  instagramUserId: string;
  username: string;
  followersCount: number;
  isActive: boolean;
  lastSyncedAt: string;
  createdAt: string;
}

export default function Accounts() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch accounts
  const { data: accountsData, isLoading, error } = useQuery({
    queryKey: ['ig-accounts'],
    queryFn: async () => {
      try {
        const response = await igAccountsAPI.getAll();
        console.log('IG Accounts API Response:', response);
        return response;
      } catch (err) {
        console.error('Error fetching IG accounts:', err);
        throw err;
      }
    },
  });

  const accounts = accountsData?.data || [];
  
  // Log for debugging
  console.log('Accounts Data:', accountsData);
  console.log('Accounts Array:', accounts);
  console.log('Is Loading:', isLoading);
  console.log('Error:', error);

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: (accountId: string) => igAccountsAPI.refreshToken(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ig-accounts'] });
      addNotification('success', 'Token refreshed successfully!');
    },
    onError: () => {
      addNotification('error', 'Failed to refresh token');
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => igAccountsAPI.disconnect(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ig-accounts'] });
      addNotification('success', 'Account disconnected');
    },
    onError: () => {
      addNotification('error', 'Failed to disconnect account');
    },
  });

  const handleConnectInstagram = async () => {
    setIsConnecting(true);
    
    try {
      // First, get the Instagram OAuth URL from our backend (with authentication)
      const response = await igAccountsAPI.getConnectUrl();
      const { url } = response.data;
      
      // Open popup window with Instagram OAuth URL
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'Instagram Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for postMessage from OAuth callback for immediate updates
      const handleMessage = (event: MessageEvent) => {
        // Accept messages from any origin that sends the correct type (OAuth callback)
        // The OAuth callback URL is controlled by our backend, so this is safe
        console.log('📨 Received postMessage:', event.origin, event.data);
        
        if (event.data && event.data.type === 'INSTAGRAM_CONNECTED') {
          console.log('✅ Instagram account connected via postMessage:', event.data.account);
          queryClient.invalidateQueries({ queryKey: ['ig-accounts'] });
          addNotification('success', `Account @${event.data.account.username} connected!`);
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);

      // Listen for OAuth callback (fallback: poll for popup closure)
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
          queryClient.invalidateQueries({ queryKey: ['ig-accounts'] });
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to get Instagram connect URL:', error);
      addNotification('error', 'Failed to initiate Instagram connection');
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading accounts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="card max-w-md">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Accounts
            </h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instagram Accounts</h1>
          <p className="text-gray-600 mt-2">
            Manage and connect your Instagram business accounts
          </p>
        </div>
        <button
          onClick={handleConnectInstagram}
          disabled={isConnecting}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {isConnecting ? 'Connecting...' : 'Connect Account'}
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <Instagram className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Instagram Accounts Connected
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Instagram business account to start automating posts and
            scheduling content.
          </p>
          <button
            onClick={handleConnectInstagram}
            disabled={isConnecting}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Instagram className="w-5 h-5" />
            {isConnecting ? 'Connecting...' : 'Connect Instagram Account'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account: IGAccount) => (
            <div key={account.id} className="card">
              {/* Account Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">@{account.username}</h3>
                    <p className="text-sm text-gray-500">
                      {account.followersCount.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    account.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {account.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Account Stats */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last synced:</span>
                  <span className="text-gray-900">
                    {new Date(account.lastSyncedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Connected:</span>
                  <span className="text-gray-900">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => refreshMutation.mutate(account.id)}
                  disabled={refreshMutation.isPending}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  title="Refresh Token"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <a
                  href={`https://instagram.com/${account.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center justify-center gap-2"
                  title="View on Instagram"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    if (confirm(`Disconnect @${account.username}?`)) {
                      disconnectMutation.mutate(account.id);
                    }
                  }}
                  disabled={disconnectMutation.isPending}
                  className="btn-secondary text-red-600 hover:bg-red-50 flex items-center justify-center"
                  title="Disconnect Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      {accounts.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Instagram className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Instagram Business Accounts Only
              </h4>
              <p className="text-sm text-blue-700">
                Only Instagram Business or Creator accounts can be connected. Make sure
                your account is converted to a business account before connecting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
