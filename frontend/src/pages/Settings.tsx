import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { licensesAPI, settingsAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  User, Mail, Lock, Key, RefreshCw, Shield,
  CheckCircle, XCircle, AlertCircle, CreditCard,
  Settings as SettingsIcon, Save, Server, Eye, EyeOff,
  Instagram, Cloud, Info
} from 'lucide-react';

interface License {
  id: string;
  email: string;
  plan: 'FREE' | 'BASIC' | 'BUSINESS' | 'ENTERPRISE';
  expiresAt: string;
  isActive: boolean;
  maxAccounts: number;
  maxPosts: number;
  maxThemes: number;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [apiSettings, setApiSettings] = useState({
    instagramAppId: '',
    instagramAppSecret: '',
    instagramRedirectUri: '',
    instagramApiVersion: 'v21.0',
    publicUrl: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
  });

  const [showInstagramSecret, setShowInstagramSecret] = useState(false);
  const [showCloudinarySecret, setShowCloudinarySecret] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Fetch API settings
  const { data: apiSettingsData } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => settingsAPI.getSettings(),
    enabled: activeTab === 'api',
  });

  // Initialize API settings when loaded
  useEffect(() => {
    if (apiSettingsData?.data) {
      setApiSettings(apiSettingsData.data);
    }
  }, [apiSettingsData]);

  // Fetch license info
  const { data: licenseData, isLoading: licenseLoading } = useQuery({
    queryKey: ['license'],
    queryFn: () => licensesAPI.validate(user?.email || ''),
    enabled: !!user?.email,
  });

  // Sync license mutation
  const syncLicenseMutation = useMutation({
    mutationFn: () => licensesAPI.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license'] });
      addNotification('success', 'License synced successfully!');
    },
    onError: () => {
      addNotification('error', 'Failed to sync license');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      // Security: Validate password strength
      if (data.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!/[A-Z]/.test(data.newPassword)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(data.newPassword)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(data.newPassword)) {
        throw new Error('Password must contain at least one number');
      }
      
      // API call to change password (endpoint needs to be implemented)
      return Promise.resolve(); // Placeholder
    },
    onSuccess: () => {
      addNotification('success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: Error) => {
      addNotification('error', error.message || 'Failed to change password');
    },
  });

  // Update API settings mutation
  const updateApiSettingsMutation = useMutation({
    mutationFn: (data: typeof apiSettings) => settingsAPI.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      addNotification('success', '設定を保存しました (Settings saved)');
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to save settings');
    },
  });

  // Restart server mutation
  const restartServerMutation = useMutation({
    mutationFn: () => settingsAPI.restartServer(),
    onSuccess: () => {
      setIsRestarting(true);
      addNotification('info', 'サーバーを再起動しています... (Server restarting...)');
      
      // Poll server status
      const pollInterval = setInterval(async () => {
        try {
          await settingsAPI.getStatus();
          clearInterval(pollInterval);
          setIsRestarting(false);
          addNotification('success', '再起動完了 (Restart complete)');
          queryClient.invalidateQueries();
        } catch (error) {
          console.log('Waiting for server...');
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isRestarting) {
          setIsRestarting(false);
          addNotification('warning', 'Please refresh the page manually');
        }
      }, 60000);
    },
    onError: () => {
      addNotification('error', 'Failed to restart server');
    },
  });

  const license: License | null = licenseData?.data || null;

  const getPlanColor = (plan: License['plan']) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800';
      case 'BASIC': return 'bg-blue-100 text-blue-800';
      case 'BUSINESS': return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate(passwordData);
  };

  const handleApiSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiSettingsMutation.mutate(apiSettings);
  };

  const handleRestart = () => {
    if (confirm('サーバーを再起動しますか？\n約10-15秒かかります。\n\nRestart server? Takes ~10-15 seconds.')) {
      restartServerMutation.mutate();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and API configuration
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile & License
        </button>
        {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
          <button
            onClick={() => setActiveTab('api')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <SettingsIcon className="w-4 h-4 inline mr-2" />
            API Settings (管理者のみ)
          </button>
        ) : null}
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  className="input bg-gray-50"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  className="input bg-gray-50 font-mono text-sm"
                  value={user?.id || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Current Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                />
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside pl-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn-primary w-full"
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Security Features</h3>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• All Instagram tokens are encrypted with AES-256-GCM</li>
                  <li>• API credentials stored securely with encryption</li>
                  <li>• JWT-based authentication with automatic token refresh</li>
                  <li>• All passwords are hashed using bcrypt</li>
                  <li>• HTTPS required for all API communications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* License Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Key className="w-5 h-5" />
              License
            </h2>

            {licenseLoading ? (
              <div className="text-center py-8 text-gray-600">
                Loading license...
              </div>
            ) : license ? (
              <div className="space-y-4">
                {/* Plan Badge */}
                <div className="text-center">
                  <span className={`inline-flex px-6 py-3 rounded-lg text-lg font-bold ${getPlanColor(license.plan)}`}>
                    {license.plan}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2">
                  {license.isActive ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-medium">Inactive</span>
                    </>
                  )}
                </div>

                {/* Expiration */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Expires On</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(license.expiresAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  {new Date(license.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Expiring soon!</span>
                    </div>
                  )}
                </div>

                {/* Plan Limits */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan Limits</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Instagram Accounts</span>
                      <span className="font-medium text-gray-900">
                        {license.maxAccounts === -1 ? 'Unlimited' : license.maxAccounts}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Posts per Month</span>
                      <span className="font-medium text-gray-900">
                        {license.maxPosts === -1 ? 'Unlimited' : license.maxPosts}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Content Themes</span>
                      <span className="font-medium text-gray-900">
                        {license.maxThemes === -1 ? 'Unlimited' : license.maxThemes}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sync Button */}
                <button
                  onClick={() => syncLicenseMutation.mutate()}
                  disabled={syncLicenseMutation.isPending}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncLicenseMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync License
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No active license found</p>
                <button
                  onClick={() => syncLicenseMutation.mutate()}
                  disabled={syncLicenseMutation.isPending}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${syncLicenseMutation.isPending ? 'animate-spin' : ''}`} />
                  Check for License
                </button>
              </div>
            )}
          </div>

          {/* Plan Comparison */}
          <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CreditCard className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Upgrade Your Plan</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get more accounts, themes, and advanced features with higher plans
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">FREE</span>
                <span className="font-medium">1 account</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">BASIC</span>
                <span className="font-medium">5 accounts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">BUSINESS</span>
                <span className="font-medium">20 accounts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ENTERPRISE</span>
                <span className="font-medium">Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* API Settings Tab Content (Admin Only) */}
      {activeTab === 'api' && (
        <div>
          {/* Important Notice */}
          <div className="card bg-blue-50 border-blue-200 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">重要 (Important)</h3>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• 設定変更後は必ずサーバー再起動が必要です (Must restart server after changes)</li>
                  <li>• APIシークレットは暗号化保存されます (Secrets are encrypted)</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleApiSettingsSubmit} className="space-y-6">
            {/* Instagram API Settings */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <Instagram className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-bold">Instagram Graph API</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App ID *</label>
                  <input
                    type="text"
                    className="input"
                    value={apiSettings.instagramAppId}
                    onChange={(e) => setApiSettings({ ...apiSettings, instagramAppId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
                  <div className="relative">
                    <input
                      type={showInstagramSecret ? 'text' : 'password'}
                      className="input pr-12"
                      value={apiSettings.instagramAppSecret}
                      onChange={(e) => setApiSettings({ ...apiSettings, instagramAppSecret: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowInstagramSecret(!showInstagramSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showInstagramSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URI *</label>
                  <input
                    type="url"
                    className="input"
                    value={apiSettings.instagramRedirectUri}
                    onChange={(e) => setApiSettings({ ...apiSettings, instagramRedirectUri: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Public URL *</label>
                  <input
                    type="url"
                    className="input"
                    value={apiSettings.publicUrl}
                    onChange={(e) => setApiSettings({ ...apiSettings, publicUrl: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary Settings */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <Cloud className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold">Cloudinary</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cloud Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={apiSettings.cloudinaryCloudName}
                    onChange={(e) => setApiSettings({ ...apiSettings, cloudinaryCloudName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key *</label>
                  <input
                    type="text"
                    className="input"
                    value={apiSettings.cloudinaryApiKey}
                    onChange={(e) => setApiSettings({ ...apiSettings, cloudinaryApiKey: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
                  <div className="relative">
                    <input
                      type={showCloudinarySecret ? 'text' : 'password'}
                      className="input pr-12"
                      value={apiSettings.cloudinaryApiSecret}
                      onChange={(e) => setApiSettings({ ...apiSettings, cloudinaryApiSecret: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCloudinarySecret(!showCloudinarySecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCloudinarySecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card bg-gray-50">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={updateApiSettingsMutation.isPending}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Save className="w-5 h-5" />
                  {updateApiSettingsMutation.isPending ? '保存中... (Saving...)' : '保存 (Save)'}
                </button>
                
                <button
                  type="button"
                  onClick={handleRestart}
                  disabled={isRestarting}
                  className="btn-secondary flex items-center gap-2 flex-1 bg-orange-500 text-white hover:bg-orange-600"
                >
                  <Server className={`w-5 h-5 ${isRestarting ? 'animate-spin' : ''}`} />
                  {isRestarting ? '再起動中... (Restarting...)' : '再起動 (Restart)'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
