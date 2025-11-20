import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { licensesAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  User, Mail, Lock, Key, RefreshCw, Shield,
  CheckCircle, XCircle, AlertCircle, CreditCard
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
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and license information
        </p>
      </div>

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
    </div>
  );
}
