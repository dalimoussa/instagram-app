import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { themesAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';
import { Palette, Plus, Edit2, Trash2, Folder, Image, RefreshCw } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description?: string;
  driveFolderId: string;
  driveFolderUrl?: string;
  mediaCount: number;
  createdAt: string;
}

export default function Themes() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    driveFolderId: '',
  });

  // Fetch themes
  const { data: themesData, isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themesAPI.getAll(),
  });

  const themes = themesData?.data || [];

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        folderId: data.driveFolderId,
      };
      return editingTheme
        ? themesAPI.update(editingTheme.id, payload)
        : themesAPI.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      addNotification('success', `Theme ${editingTheme ? 'updated' : 'created'} successfully!`);
      closeModal();
    },
    onError: () => {
      addNotification('error', `Failed to ${editingTheme ? 'update' : 'create'} theme`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (themeId: string) => themesAPI.delete(themeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      addNotification('success', 'Theme deleted successfully');
    },
    onError: () => {
      addNotification('error', 'Failed to delete theme');
    },
  });

  // Sync media mutation
  const syncMutation = useMutation({
    mutationFn: (themeId: string) => themesAPI.syncMedia(themeId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      const message = response.data?.message || 'Media synced successfully';
      addNotification('success', message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to sync media';
      addNotification('error', message);
    },
  });

  const openModal = (theme?: Theme) => {
    if (theme) {
      setEditingTheme(theme);
      setFormData({
        name: theme.name,
        description: theme.description || '',
        driveFolderId: theme.driveFolderId,
      });
    } else {
      setEditingTheme(null);
      setFormData({ name: '', description: '', driveFolderId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTheme(null);
    setFormData({ name: '', description: '', driveFolderId: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading themes...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Themes</h1>
          <p className="text-gray-600 mt-2">
            Organize your content into themes with Google Drive folders
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Theme
        </button>
      </div>

      {/* Themes Grid */}
      {themes.length === 0 ? (
        <div className="card text-center py-12">
          <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Themes Created Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create themes to organize your content from Google Drive folders. Each
            theme can contain images and videos for automated posting.
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Theme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme: Theme) => (
            <div key={theme.id} className="card hover:shadow-md transition-shadow">
              {/* Theme Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                    {theme.description && (
                      <p className="text-sm text-gray-500 mt-1">{theme.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Stats */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Image className="w-4 h-4" />
                  <span>{theme.mediaCount} media files</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Folder className="w-4 h-4" />
                  <span className="truncate">Google Drive Folder</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  Created {new Date(theme.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => syncMutation.mutate(theme.id)}
                  disabled={syncMutation.isPending}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  title="Sync media from Google Drive"
                >
                  <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button
                  onClick={() => openModal(theme)}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete theme "${theme.name}"?`)) {
                      deleteMutation.mutate(theme.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="btn-secondary text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingTheme ? 'Edit Theme' : 'Create New Theme'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g., Travel Photos"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Optional description for this theme"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Drive Folder ID *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Paste folder ID from Drive URL"
                  value={formData.driveFolderId}
                  onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The ID from your Google Drive folder URL (after folders/)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {saveMutation.isPending ? 'Saving...' : editingTheme ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
