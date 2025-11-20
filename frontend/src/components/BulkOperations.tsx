import { useState } from 'react';
import { 
  CheckSquare, Square, Play, Pause, Trash2, Calendar, 
  X, AlertTriangle, Loader 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';

interface Schedule {
  id: string;
  name: string;
  status: string;
  scheduledTime: string;
  isActive: boolean;
}

interface BulkOperationsProps {
  schedules: Schedule[];
  onClose: () => void;
}

type BulkAction = 'pause' | 'resume' | 'delete' | 'reschedule';

export default function BulkOperations({ schedules, onClose }: BulkOperationsProps) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentAction, setCurrentAction] = useState<BulkAction | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.size === schedules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(schedules.map(s => s.id)));
    }
  };

  // Bulk pause mutation
  const pauseMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => schedulesAPI.toggle(id));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', `Successfully paused ${ids.length} schedule(s)`);
      setSelectedIds(new Set());
      setShowConfirm(false);
    },
    onError: () => {
      addNotification('error', 'Failed to pause schedules');
    },
  });

  // Bulk resume mutation
  const resumeMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => schedulesAPI.toggle(id));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', `Successfully resumed ${ids.length} schedule(s)`);
      setSelectedIds(new Set());
      setShowConfirm(false);
    },
    onError: () => {
      addNotification('error', 'Failed to resume schedules');
    },
  });

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => schedulesAPI.cancel(id));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', `Successfully deleted ${ids.length} schedule(s)`);
      setSelectedIds(new Set());
      setShowConfirm(false);
      onClose();
    },
    onError: () => {
      addNotification('error', 'Failed to delete schedules');
    },
  });

  // Bulk reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ ids, newDate }: { ids: string[]; newDate: string }) => {
      const promises = ids.map(id => 
        schedulesAPI.update(id, { scheduledTime: new Date(newDate).toISOString() })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      addNotification('success', `Successfully rescheduled ${ids.length} schedule(s)`);
      setSelectedIds(new Set());
      setShowConfirm(false);
      setNewScheduleDate('');
    },
    onError: () => {
      addNotification('error', 'Failed to reschedule');
    },
  });

  // Handle action
  const handleAction = (action: BulkAction) => {
    if (selectedIds.size === 0) {
      addNotification('error', 'Please select at least one schedule');
      return;
    }

    setCurrentAction(action);
    setShowConfirm(true);
  };

  // Confirm action
  const confirmAction = () => {
    const ids = Array.from(selectedIds);

    switch (currentAction) {
      case 'pause':
        pauseMutation.mutate(ids);
        break;
      case 'resume':
        resumeMutation.mutate(ids);
        break;
      case 'delete':
        deleteMutation.mutate(ids);
        break;
      case 'reschedule':
        if (!newScheduleDate) {
          addNotification('error', 'Please select a new date');
          return;
        }
        rescheduleMutation.mutate({ ids, newDate: newScheduleDate });
        break;
    }
  };

  const isPending = 
    pauseMutation.isPending || 
    resumeMutation.isPending || 
    deleteMutation.isPending || 
    rescheduleMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedIds.size} of {schedules.length} schedule(s) selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={selectAll}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {selectedIds.size === schedules.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === schedules.length ? 'Deselect All' : 'Select All'}
            </button>

            <div className="h-6 w-px bg-gray-300" />

            <button
              onClick={() => handleAction('resume')}
              disabled={selectedIds.size === 0}
              className="btn-secondary text-sm flex items-center gap-2 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>

            <button
              onClick={() => handleAction('pause')}
              disabled={selectedIds.size === 0}
              className="btn-secondary text-sm flex items-center gap-2 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>

            <button
              onClick={() => handleAction('reschedule')}
              disabled={selectedIds.size === 0}
              className="btn-secondary text-sm flex items-center gap-2 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              Reschedule
            </button>

            <button
              onClick={() => handleAction('delete')}
              disabled={selectedIds.size === 0}
              className="btn-secondary text-sm flex items-center gap-2 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-gray-200">
          {schedules.map(schedule => (
            <div
              key={schedule.id}
              className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedIds.has(schedule.id) ? 'bg-indigo-50' : ''
              }`}
              onClick={() => toggleSelect(schedule.id)}
            >
              <div className="flex items-center gap-4">
                <div>
                  {selectedIds.has(schedule.id) ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{schedule.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {schedule.isActive ? 'Active' : 'Paused'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      schedule.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      schedule.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      schedule.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {schedule.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Scheduled: {new Date(schedule.scheduledTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirm {currentAction?.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentAction === 'delete' ? (
                      <>
                        Are you sure you want to delete {selectedIds.size} schedule(s)? 
                        This action cannot be undone.
                      </>
                    ) : currentAction === 'reschedule' ? (
                      <>
                        You are about to reschedule {selectedIds.size} schedule(s) to a new date.
                      </>
                    ) : (
                      <>
                        You are about to {currentAction} {selectedIds.size} schedule(s).
                      </>
                    )}
                  </p>

                  {currentAction === 'reschedule' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Schedule Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={newScheduleDate}
                        onChange={(e) => setNewScheduleDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setCurrentAction(null);
                    setNewScheduleDate('');
                  }}
                  disabled={isPending}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isPending}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    currentAction === 'delete'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Confirm ${currentAction}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
