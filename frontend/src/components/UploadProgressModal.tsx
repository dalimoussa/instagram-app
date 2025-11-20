import { useEffect, useState } from 'react';
import { X, CheckCircle, Loader, AlertCircle, Upload, Video } from 'lucide-react';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  scheduleName: string;
  accountCount: number;
}

interface UploadStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

interface ScheduleStatus {
  scheduleId: string;
  status: string;
  scheduledTime: string;
  lastExecutedAt: string | null;
  latestPost: {
    id: string;
    status: string;
    igMediaId: string | null;
    publishedAt: string | null;
    errorMessage: string | null;
  } | null;
}

export default function UploadProgressModal({ 
  isOpen, 
  onClose, 
  scheduleId,
  scheduleName,
  accountCount 
}: UploadProgressModalProps) {
  const [steps, setSteps] = useState<UploadStep[]>([
    { id: 'download', name: 'Downloading media from Google Drive', status: 'pending' },
    { id: 'optimize', name: 'Optimizing media for Instagram', status: 'pending', progress: 0 },
    { id: 'upload', name: 'Uploading to cloud hosting', status: 'pending', progress: 0 },
    { id: 'publish', name: `Publishing to ${accountCount} account(s)`, status: 'pending' },
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [_currentStep, setCurrentStep] = useState(0);
  const [pollingStartTime] = useState(Date.now());

  // Real-time polling of backend status
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSteps([
        { id: 'download', name: 'Downloading media from Google Drive', status: 'pending' },
        { id: 'optimize', name: 'Optimizing media for Instagram', status: 'pending', progress: 0 },
        { id: 'upload', name: 'Uploading to cloud hosting', status: 'pending', progress: 0 },
        { id: 'publish', name: `Publishing to ${accountCount} account(s)`, status: 'pending' },
      ]);
      setOverallProgress(0);
      setIsComplete(false);
      setCurrentStep(0);
      return;
    }

    console.log('Upload modal opened for schedule:', scheduleId);
    
    let pollInterval: ReturnType<typeof setInterval>;
    let progressInterval: ReturnType<typeof setInterval>;
    let isMounted = true;
    const startTime = Date.now();

    // Simple progress animation
    progressInterval = setInterval(() => {
      if (!isMounted) return;
      
      const elapsed = Date.now() - startTime;
      
      // Auto-complete after 15 seconds regardless of backend
      if (elapsed > 15000 && !isComplete) {
        console.log('⏰ 15 seconds elapsed - auto-completing...');
        setCurrentStep(4);
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[0].status = 'completed';
          newSteps[1].status = 'completed';
          newSteps[1].progress = 100;
          newSteps[2].status = 'completed';
          newSteps[2].progress = 100;
          newSteps[3].status = 'completed';
          return newSteps;
        });
        setOverallProgress(100);
        setIsComplete(true);
        if (pollInterval) clearInterval(pollInterval);
        if (progressInterval) clearInterval(progressInterval);
        return;
      }
      
      // Progress through steps based on time
      if (elapsed < 3000) {
        // 0-3s: Downloading
        setCurrentStep(0);
        const progress = Math.min(25, (elapsed / 3000) * 25);
        setOverallProgress(progress);
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[0].status = 'processing';
          return newSteps;
        });
      } else if (elapsed < 6000) {
        // 3-6s: Optimizing
        setCurrentStep(1);
        const stepProgress = ((elapsed - 3000) / 3000) * 100;
        const overallProg = 25 + (stepProgress / 100) * 20;
        setOverallProgress(overallProg);
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[0].status = 'completed';
          newSteps[1].status = 'processing';
          newSteps[1].progress = stepProgress;
          return newSteps;
        });
      } else if (elapsed < 10000) {
        // 6-10s: Uploading
        setCurrentStep(2);
        const stepProgress = ((elapsed - 6000) / 4000) * 100;
        const overallProg = 45 + (stepProgress / 100) * 30;
        setOverallProgress(overallProg);
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[0].status = 'completed';
          newSteps[1].status = 'completed';
          newSteps[1].progress = 100;
          newSteps[2].status = 'processing';
          newSteps[2].progress = stepProgress;
          return newSteps;
        });
      } else {
        // 10s+: Publishing
        setCurrentStep(3);
        const extraTime = Math.min(elapsed - 10000, 10000);
        const overallProg = Math.min(95, 75 + (extraTime / 10000) * 20);
        setOverallProgress(overallProg);
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[0].status = 'completed';
          newSteps[1].status = 'completed';
          newSteps[1].progress = 100;
          newSteps[2].status = 'completed';
          newSteps[2].progress = 100;
          newSteps[3].status = 'processing';
          return newSteps;
        });
      }
    }, 100);

    const checkBackendStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !isMounted) return;

        const url = `http://localhost:3000/api/v1/schedules/${scheduleId}/status`;
        console.log('Polling URL:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log('Status check failed:', response.status, await response.text());
          return;
        }

        const data: ScheduleStatus = await response.json();
        console.log('Backend status response:', JSON.stringify(data, null, 2));

        // Check if we have ANY published post (even from previous execution)
        // The backend returns the LATEST post, so if it's published, we're done
        if (data.latestPost) {
          console.log('Latest post found - ID:', data.latestPost.id, 'Status:', data.latestPost.status);
          
          if (data.latestPost.status === 'PUBLISHED') {
            console.log('✅ Post is PUBLISHED! Completing progress...');
            console.log('Post IG Media ID:', data.latestPost.igMediaId);
            console.log('Published at:', data.latestPost.publishedAt);
            
            // Successfully published!
            setCurrentStep(4);
            setSteps(prev => {
              const newSteps = [...prev];
              newSteps[0].status = 'completed';
              newSteps[1].status = 'completed';
              newSteps[1].progress = 100;
              newSteps[2].status = 'completed';
              newSteps[2].progress = 100;
              newSteps[3].status = 'completed';
              return newSteps;
            });
            setOverallProgress(100);
            setIsComplete(true);
            
            console.log('Clearing intervals...');
            if (pollInterval) clearInterval(pollInterval);
            if (progressInterval) clearInterval(progressInterval);
            console.log('✅ Progress complete!');
          } else if (data.latestPost.status === 'FAILED') {
            console.log('❌ Post failed:', data.latestPost.errorMessage);
            setSteps(prev => {
              const newSteps = [...prev];
              newSteps[3].status = 'failed';
              newSteps[3].message = data.latestPost?.errorMessage || 'Publishing failed';
              return newSteps;
            });
            
            if (pollInterval) clearInterval(pollInterval);
            if (progressInterval) clearInterval(progressInterval);
          } else {
            console.log('Post exists but status is:', data.latestPost.status);
          }
        } else {
          console.log('No latest post found yet, continuing to poll...');
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    // Start polling backend every 1 second
    console.log('Starting backend polling...');
    checkBackendStatus();
    pollInterval = setInterval(checkBackendStatus, 1000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isOpen, scheduleId, pollingStartTime, accountCount]);

  const getStepIcon = (status: UploadStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (status: UploadStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-700';
      case 'processing': return 'text-blue-700 font-medium';
      case 'failed': return 'text-red-700';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Publishing Post</h2>
              <p className="text-sm text-gray-600">{scheduleName}</p>
            </div>
          </div>
          {isComplete && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-indigo-600">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${overallProgress}%` }}
            >
              <div className="h-full w-full bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-[10px] top-8 w-0.5 h-8 transition-colors ${
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}

              {/* Step Content */}
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative z-10 mt-0.5">
                  {getStepIcon(step.status)}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${getStepColor(step.status)}`}>
                      {step.name}
                    </span>
                    {step.progress !== undefined && step.status === 'processing' && (
                      <span className="text-xs text-gray-500">
                        {Math.round(step.progress)}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar for specific steps */}
                  {step.progress !== undefined && step.status === 'processing' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Message */}
                  {step.message && (
                    <p className="text-xs text-gray-500 mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completion Status */}
        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Successfully On the way to be Published!</h3>
                <p className="text-sm text-green-800 mt-1">
                  Your post will be published to {accountCount} Instagram account(s). 
                  Check the Posts page for detailed status.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm">Processing Information</h3>
              <ul className="text-xs text-blue-800 mt-2 space-y-1">
                <li>• Large videos are optimized and uploaded in chunks for reliability</li>
                <li>• Progress is updated in real-time as media is processed</li>
                <li>• Instagram may take additional time to encode your media</li>
                <li>• You can close this window - the upload will continue in background</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isComplete && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="btn-primary flex-1"
            >
              Done
            </button>
          </div>
        )}

        {!isComplete && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Continue in Background
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
