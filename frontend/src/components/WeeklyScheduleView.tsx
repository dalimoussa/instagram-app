import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, Palette } from 'lucide-react';

interface Schedule {
  id: string;
  name: string;
  scheduledTime: string;
  caption: string;
  targetAccounts: string[];
  theme?: { name: string };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface WeeklyScheduleViewProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onDateChange?: (date: Date) => void;
}

export default function WeeklyScheduleView({ 
  schedules, 
  onScheduleClick,
  onDateChange 
}: WeeklyScheduleViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Start from Sunday
    return new Date(today.setDate(diff));
  });

  // Generate 7 days starting from currentWeekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today.setDate(diff));
    setCurrentWeekStart(weekStart);
    onDateChange?.(weekStart);
  };

  // Group schedules by day
  const schedulesByDay = weekDays.map(day => {
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledTime);
      return (
        scheduleDate.getFullYear() === day.getFullYear() &&
        scheduleDate.getMonth() === day.getMonth() &&
        scheduleDate.getDate() === day.getDate()
      );
    });

    // Sort by time
    return daySchedules.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-300';
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="btn-secondary p-2"
            title="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="btn-secondary p-2"
            title="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="btn-secondary text-sm"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {/* Day Headers */}
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`text-center pb-3 border-b-2 ${
              isToday(day) 
                ? 'border-indigo-500' 
                : 'border-gray-200'
            }`}
          >
            <div className={`text-xs font-medium uppercase tracking-wide ${
              isToday(day) ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-2xl font-bold mt-1 ${
              isToday(day) 
                ? 'text-indigo-600' 
                : 'text-gray-900'
            }`}>
              {day.getDate()}
            </div>
          </div>
        ))}

        {/* Schedule Cards */}
        {schedulesByDay.map((daySchedules, dayIndex) => (
          <div
            key={dayIndex}
            className={`min-h-[300px] p-2 rounded-lg border-2 ${
              isToday(weekDays[dayIndex])
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="space-y-2">
              {daySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">No posts</div>
                </div>
              ) : (
                daySchedules.map(schedule => (
                  <button
                    key={schedule.id}
                    onClick={() => onScheduleClick(schedule)}
                    className={`w-full text-left p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${
                      getStatusColor(schedule.status)
                    }`}
                  >
                    {/* Time */}
                    <div className="flex items-center gap-1 mb-2">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-semibold">
                        {new Date(schedule.scheduledTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Caption Preview */}
                    <p className="text-xs line-clamp-2 mb-2 font-medium">
                      {schedule.caption || schedule.name}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{schedule.targetAccounts.length}</span>
                      </div>
                      
                      {schedule.theme && (
                        <div className="flex items-center gap-1 max-w-[100px]">
                          <Palette className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{schedule.theme.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50">
                        {schedule.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
            <span>Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span>Failed</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {schedulesByDay.flat().filter(s => s.status === 'PENDING').length}
          </div>
          <div className="text-xs text-blue-800">Pending</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {schedulesByDay.flat().filter(s => s.status === 'PROCESSING').length}
          </div>
          <div className="text-xs text-yellow-800">Processing</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {schedulesByDay.flat().filter(s => s.status === 'COMPLETED').length}
          </div>
          <div className="text-xs text-green-800">Completed</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {schedulesByDay.flat().filter(s => s.status === 'FAILED').length}
          </div>
          <div className="text-xs text-red-800">Failed</div>
        </div>
      </div>
    </div>
  );
}
