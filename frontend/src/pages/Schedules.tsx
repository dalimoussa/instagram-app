import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesAPI, igAccountsAPI, themesAPI, postsAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';
import UploadProgressModal from '../components/UploadProgressModal';
import WeeklyScheduleView from '../components/WeeklyScheduleView';
import BulkOperations from '../components/BulkOperations';
import CaptionTemplates from '../components/CaptionTemplates';
import { 
  Calendar, Plus, Clock, Play, X, Check, AlertCircle, 
  Users, Palette, Hash, Type, ChevronLeft, ChevronRight, FileText, Grid, List, CheckSquare
} from 'lucide-react';

interface Schedule {
  id: string;
  name: string;
  description?: string;
  scheduledTime: string;  // Backend field name
  caption: string;
  hashtags: string[];
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  targetAccounts: string[];  // Backend field name
  themeId: string;
  postType: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL';
  timezone: string;
  theme?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

type CalendarView = 'month' | 'week' | 'list';

export default function Schedules() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarView>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Progress modal state
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [executingSchedule, setExecutingSchedule] = useState<Schedule | null>(null);
  
  // Bulk operations modal state
  const [isBulkOperationsOpen, setIsBulkOperationsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    scheduledFor: '',
    caption: '',
    hashtags: '',
    igAccountIds: [] as string[],
    themeId: '',
    postType: 'REEL' as 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Fetch schedules (auto-refresh if there are active schedules)
  const { data: schedulesData, isLoading: schedulesLoading, error: schedulesError } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await schedulesAPI.getAll();
      console.log('📅 Schedules API Response:', response);
      console.log('📅 Schedules Data:', response?.data);
      return response;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      // Auto-refresh if any schedules are PROCESSING
      const schedules = query?.state?.data?.data || [];
      const hasActiveSchedule = schedules.some((schedule: Schedule) => 
        schedule.status === 'PROCESSING'
      );
      return hasActiveSchedule ? 5000 : false; // 5 seconds if active, otherwise no auto-refresh
    },
  });

  // Fetch posts for status display (auto-refresh if there are processing posts)
  const { data: postsData } = useQuery({
    queryKey: ['posts-for-schedules'],
    queryFn: () => postsAPI.getAll({}),
    refetchInterval: (query) => {
      const posts = query?.state?.data?.data || [];
      const hasActivePost = posts.some((post: any) => 
        post.status === 'PENDING' || post.status === 'PROCESSING'
      );
      return hasActivePost ? 5000 : false;
    },
  });

  // Fetch Instagram accounts
  const { data: accountsData, error: accountsError } = useQuery({
    queryKey: ['ig-accounts'],
    queryFn: () => igAccountsAPI.getAll(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch themes
  const { data: themesData, error: themesError } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themesAPI.getAll(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const schedules = schedulesData?.data || [];
  const accounts = accountsData?.data || [];
  const themes = themesData?.data || [];

  // Debug logging
  console.log('📊 Schedules count:', schedules.length);
  console.log('📊 Accounts count:', accounts.length);
  console.log('📊 Themes count:', themes.length);
  if (schedules.length > 0) {
    console.log('📊 First schedule:', schedules[0]);
  }

  // Check for authentication errors
  const hasAuthError = 
    (schedulesError as any)?.response?.status === 401 ||
    (accountsError as any)?.response?.status === 401 ||
    (themesError as any)?.response?.status === 401;

  // Show authentication error
  if (hasAuthError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">
            Your login session has expired. Please log in again to continue.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Create schedule mutation with comprehensive validation and error handling
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validation: Check required fields
      if (!data.name?.trim()) {
        throw new Error('Schedule name is required');
      }
      
      if (!data.themeId) {
        throw new Error('Please select a theme');
      }

      if (data.igAccountIds.length === 0) {
        throw new Error('Please select at least one Instagram account');
      }

      if (!data.scheduledFor) {
        throw new Error('Please select a scheduled time');
      }

      const scheduledDate = new Date(data.scheduledFor);
      if (scheduledDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      // Validation: Check if theme exists
      const selectedTheme = themes.find((t: any) => t.id === data.themeId);
      if (!selectedTheme) {
        throw new Error('Selected theme not found. Please refresh and try again.');
      }

      // Validation: Check if accounts exist
      const invalidAccounts = data.igAccountIds.filter(id => 
        !accounts.find((acc: any) => acc.id === id)
      );
      if (invalidAccounts.length > 0) {
        throw new Error('One or more selected accounts not found. Please refresh and try again.');
      }

      // Security: Sanitize and validate inputs
      const sanitizedCaption = data.caption?.trim().substring(0, 2200) || ''; // Instagram limit
      const sanitizedHashtags = data.hashtags
        ?.split(',')
        .map(tag => tag.trim().replace(/[^a-zA-Z0-9_]/g, '')) // Remove special chars
        .filter(tag => tag.length > 0)
        .slice(0, 30) || []; // Instagram limit

      // Create single schedule with multiple target accounts
      return schedulesAPI.create({
        name: data.name.trim(),
        description: `Scheduled post for ${data.igAccountIds.length} account(s) - ${selectedTheme.name}`,
        themeId: data.themeId,
        targetAccounts: data.igAccountIds,
        postType: data.postType,
        scheduledTime: scheduledDate.toISOString(),
        timezone: data.timezone,
        caption: sanitizedCaption,
        hashtags: sanitizedHashtags,
        isRecurring: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', 'Schedule created successfully!');
      closeModal();
    },
    onError: (error: any) => {
      console.error('Schedule creation error:', error);
      
      // Enhanced error handling for different error types
      let errorMessage = 'Failed to create schedule';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create schedules.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid schedule data. Please check your inputs.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Theme or account not found. Please refresh and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      addNotification('error', errorMessage);
    },
  });

  // Execute now mutation
  const executeMutation = useMutation({
    mutationFn: (scheduleId: string) => schedulesAPI.executeNow(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', 'Schedule execution started!');
    },
    onError: (error: any) => {
      console.error('Schedule execution error:', error);
      
      // Check if the error is about missing media
      const errorMessage = error.response?.data?.message || error.message || 'Failed to execute schedule';
      
      if (errorMessage.includes('No unused media available') || errorMessage.includes('sync media')) {
        // Show alert about missing media
        alert(
          '⚠️ No Media Available\n\n' +
          'There is no media synced for this theme.\n\n' +
          'Please go to the Themes page and:\n' +
          '1. Make sure your theme has a folder path set\n' +
          '2. Add some images or videos to that folder\n' +
          '3. Click the "Sync Media" button to import the files\n\n' +
          'Then try executing the schedule again.'
        );
        addNotification('error', 'No media available. Please sync media from your theme folder.');
      } else {
        addNotification('error', errorMessage);
      }
      
      setIsProgressModalOpen(false);
      setExecutingSchedule(null);
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (scheduleId: string) => schedulesAPI.cancel(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', 'Schedule cancelled');
    },
    onError: () => {
      addNotification('error', 'Failed to cancel schedule');
    },
  });

  const openModal = () => {
    // Set default time to 1 hour from now
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1);
    defaultTime.setMinutes(0);
    
    setFormData({
      name: '',
      scheduledFor: defaultTime.toISOString().slice(0, 16),
      caption: '',
      hashtags: '',
      igAccountIds: [],
      themeId: '',
      postType: 'REEL',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      scheduledFor: '',
      caption: '',
      hashtags: '',
      igAccountIds: [],
      themeId: '',
      postType: 'REEL',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleAccount = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      igAccountIds: prev.igAccountIds.includes(accountId)
        ? prev.igAccountIds.filter(id => id !== accountId)
        : [...prev.igAccountIds, accountId],
    }));
  };

  // Filter schedules by current month
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule: Schedule) => {
      const scheduleDate = new Date(schedule.scheduledTime);
      return (
        scheduleDate.getMonth() === currentDate.getMonth() &&
        scheduleDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [schedules, currentDate]);

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Schedule['status']) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PROCESSING': return <Play className="w-4 h-4" />;
      case 'COMPLETED': return <Check className="w-4 h-4" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (schedulesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600 mt-2">
            Schedule automated posts across multiple Instagram accounts
          </p>
        </div>
        <div className="flex gap-3">
          {filteredSchedules.length > 0 && (
            <button
              onClick={() => setIsBulkOperationsOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckSquare className="w-5 h-5" />
              Bulk Actions
            </button>
          )}
          <button
            onClick={openModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-blue-50 border-blue-200 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Scheduling Guidelines</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Captions limited to 2,200 characters (Instagram limit)</li>
              <li>• Maximum 30 hashtags per post</li>
              <li>• Schedule at least 5 minutes in advance for processing</li>
              <li>• All content is encrypted before storage</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={previousMonth} className="btn-secondary p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="btn-secondary p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`btn-secondary flex items-center gap-2 ${viewMode === 'week' ? 'bg-indigo-100 text-indigo-700' : ''}`}
            >
              <Grid className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn-secondary flex items-center gap-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : ''}`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Weekly View */}
      {viewMode === 'week' && (
        <WeeklyScheduleView
          schedules={filteredSchedules}
          onScheduleClick={(schedule) => {
            // Could open a modal or navigate to schedule details
            console.log('Schedule clicked:', schedule);
          }}
          onDateChange={(date) => {
            setCurrentDate(date);
          }}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {filteredSchedules.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Schedules for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first schedule to automate Instagram posts across multiple accounts.
              </p>
              <button
                onClick={openModal}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Schedule Your First Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">{filteredSchedules.map((schedule: Schedule) => (
            <div key={schedule.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                {/* Schedule Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(schedule.status)}`}>
                      {getStatusIcon(schedule.status)}
                      {schedule.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(schedule.scheduledTime).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  {/* Caption Preview */}
                  <p className="text-gray-900 mb-3 line-clamp-2">
                    {schedule.caption}
                  </p>

                  {/* Hashtags */}
                  {schedule.hashtags && schedule.hashtags.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <div className="flex gap-2 flex-wrap">
                        {schedule.hashtags.slice(0, 5).map((tag, idx) => (
                          <span key={idx} className="text-sm text-indigo-600">
                            #{tag}
                          </span>
                        ))}
                        {schedule.hashtags.length > 5 && (
                          <span className="text-sm text-gray-500">
                            +{schedule.hashtags.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Accounts and Theme */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {schedule.targetAccounts.length} account(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>{schedule.theme?.name || 'Theme'}</span>
                    </div>
                  </div>

                  {/* Post Status Indicators */}
                  {postsData?.data && (() => {
                    const schedulePosts = (postsData.data as any[]).filter((post: any) => post.scheduleId === schedule.id);
                    if (schedulePosts.length > 0) {
                      return (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Posts ({schedulePosts.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {schedulePosts.map((post: any) => (
                              <div key={post.id} className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                                  post.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                  post.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  @{post.igAccount?.username}: {post.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {schedule.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          setExecutingSchedule(schedule);
                          setIsProgressModalOpen(true);
                          executeMutation.mutate(schedule.id);
                        }}
                        disabled={executeMutation.isPending}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Execute Now
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Cancel this schedule?')) {
                            cancelMutation.mutate(schedule.id);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {/* Create Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Schedule New Post
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Schedule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Schedule Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g., Morning Product Showcase"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={100}
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Schedule Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Posts will be published at this exact time ({formData.timezone})
                </p>
              </div>

              {/* Select Accounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Select Instagram Accounts *
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {accounts.length === 0 ? (
                    <p className="text-sm text-gray-500">No accounts connected</p>
                  ) : (
                    accounts.map((account: any) => (
                      <label
                        key={account.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.igAccountIds.includes(account.id)}
                          onChange={() => toggleAccount(account.id)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm">@{account.username}</span>
                        <span className="text-xs text-gray-500">
                          ({account.followersCount?.toLocaleString()} followers)
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Select Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Select Theme *
                </label>
                <select
                  required
                  className="input"
                  value={formData.themeId}
                  onChange={(e) => setFormData({ ...formData, themeId: e.target.value })}
                >
                  <option value="">Choose a theme...</option>
                  {themes.map((theme: any) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name} ({theme.mediaCount} media files)
                    </option>
                  ))}
                </select>
              </div>

              {/* Post Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Post Type *
                </label>
                <select
                  required
                  className="input"
                  value={formData.postType}
                  onChange={(e) => setFormData({ ...formData, postType: e.target.value as any })}
                >
                  <option value="REEL">Reel (Recommended)</option>
                  <option value="VIDEO">Video</option>
                  <option value="IMAGE">Image</option>
                  <option value="CAROUSEL">Carousel</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Reels typically get better engagement on Instagram
                </p>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Caption *
                </label>
                
                {/* Caption Templates */}
                <div className="mb-3">
                  <CaptionTemplates
                    onSelect={(caption: string) => {
                      setFormData({ ...formData, caption });
                    }}
                  />
                </div>
                
                <textarea
                  required
                  className="input"
                  rows={4}
                  maxLength={2200}
                  placeholder="Write your caption... (max 2,200 characters)"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Instagram caption limit: 2,200 characters</span>
                  <span>{formData.caption.length}/2200</span>
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Hashtags
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="travel, adventure, explore (comma-separated, max 30)"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate hashtags with commas. Special characters will be removed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {executingSchedule && (
        <UploadProgressModal
          isOpen={isProgressModalOpen}
          onClose={() => {
            setIsProgressModalOpen(false);
            setExecutingSchedule(null);
          }}
          scheduleId={executingSchedule.id}
          scheduleName={executingSchedule.name}
          accountCount={executingSchedule.targetAccounts.length}
        />
      )}

      {/* Bulk Operations Modal */}
      {isBulkOperationsOpen && (
        <BulkOperations
          schedules={filteredSchedules.map((s: Schedule) => ({
            ...s,
            isActive: s.status !== 'FAILED',
          }))}
          onClose={() => setIsBulkOperationsOpen(false)}
        />
      )}
    </div>
  );
}
