'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, isSameDay, getDay } from 'date-fns';
import { BarChart2 } from 'lucide-react';

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assignee: string;
  status: 'completed' | 'in-progress' | 'delayed';
  isRevision?: boolean;
}

type TimeScale = 'day' | 'week' | 'month';

interface GanttChartProps {
  tasks: GanttTask[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('week');

  // Generate mock tasks if none provided
  const mockTasks: GanttTask[] = useMemo(() => {
    if (tasks.length > 0) return tasks;
    
    const today = new Date();
    const baseDate = new Date(today.getFullYear(), today.getMonth(), 20); // Start from 20th
    
    return [
      {
        id: '101',
        name: 'Homepage UI Design',
        startDate: new Date(baseDate),
        endDate: addDays(baseDate, 0),
        assignee: 'Siddique',
        status: 'completed',
      },
      {
        id: '102',
        name: 'User Dashboard Layout',
        startDate: addDays(baseDate, 1),
        endDate: addDays(baseDate, 3),
        assignee: 'Siddique',
        status: 'in-progress',
      },
      {
        id: '103',
        name: 'Login Flow Integration',
        startDate: addDays(baseDate, 2),
        endDate: addDays(baseDate, 6),
        assignee: 'Appurva',
        status: 'in-progress',
      },
      {
        id: '104',
        name: 'Reporting Module - Backend',
        startDate: addDays(baseDate, 4),
        endDate: addDays(baseDate, 5),
        assignee: 'Appurva',
        status: 'in-progress',
      },
      {
        id: '105',
        name: 'Chart Components Implementation',
        startDate: addDays(baseDate, 6),
        endDate: addDays(baseDate, 8),
        assignee: 'Siddique',
        status: 'in-progress',
      },
      {
        id: '106',
        name: 'Export Functionality (PDF/CSV)',
        startDate: new Date(baseDate),
        endDate: addDays(baseDate, 2),
        assignee: 'Appurva',
        status: 'delayed',
      },
      {
        id: 'REV-01',
        name: 'Fix Mobile Responsiveness',
        startDate: addDays(baseDate, 1),
        endDate: addDays(baseDate, 3),
        assignee: 'Siddique',
        status: 'delayed',
        isRevision: true,
      },
      {
        id: 'REV-02',
        name: 'Update Color Contrast for Accessibility',
        startDate: addDays(baseDate, 3),
        endDate: addDays(baseDate, 5),
        assignee: 'Siddique',
        status: 'in-progress',
        isRevision: true,
      },
    ];
  }, [tasks]);

  // Calculate date range based on tasks
  const dateRange = useMemo(() => {
    if (mockTasks.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 7)),
      };
    }

    const dates = mockTasks.flatMap(t => [t.startDate, t.endDate]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    let start: Date, end: Date;
    if (timeScale === 'day') {
      start = new Date(minDate);
      end = addDays(maxDate, 1);
    } else if (timeScale === 'week') {
      start = startOfWeek(minDate);
      end = endOfWeek(addDays(maxDate, 7));
    } else {
      start = startOfMonth(minDate);
      end = endOfMonth(maxDate);
    }

    return { start, end };
  }, [mockTasks, timeScale]);

  // Generate timeline dates
  const timelineDates = useMemo(() => {
    if (timeScale === 'day') {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    } else if (timeScale === 'week') {
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      // Show each day in week view
      return days;
    } else {
      // For month view, show first day of each month
      const months: Date[] = [];
      let current = new Date(dateRange.start);
      while (current <= dateRange.end) {
        months.push(startOfMonth(current));
        current = addDays(endOfMonth(current), 1);
      }
      return months;
    }
  }, [dateRange, timeScale]);

  // Calculate bar position and width
  const getBarStyle = (task: GanttTask) => {
    const start = dateRange.start.getTime();
    const taskStart = task.startDate.getTime();
    const taskEnd = task.endDate.getTime();
    
    let dayWidth = 60; // Base width per day
    if (timeScale === 'week') {
      dayWidth = 80;
    } else if (timeScale === 'month') {
      dayWidth = 100;
    }

    const left = ((taskStart - start) / (1000 * 60 * 60 * 24)) * dayWidth;
    const width = ((taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1) * dayWidth;

    return {
      left: Math.max(0, left),
      width: Math.max(60, width),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#0F9D58]';
      case 'delayed':
        return 'bg-[#EB5757]';
      default:
        return 'bg-[#2F80ED]';
    }
  };

  const taskListWidth = 300;
  const timelineWidth = timelineDates.length * (timeScale === 'week' ? 80 : timeScale === 'month' ? 100 : 60);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header with Time Scale Selectors */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[#ff3b3b]" />
          Gantt Chart
        </h3>
        <div className="flex items-center gap-2 bg-[#F7F7F7] p-1 rounded-lg border border-[#EEEEEE]">
          <button
            onClick={() => setTimeScale('day')}
            className={`px-4 py-1.5 rounded-md text-[13px] font-['Manrope:SemiBold',sans-serif] transition-colors ${
              timeScale === 'day'
                ? 'bg-white text-[#ff3b3b] shadow-sm'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeScale('week')}
            className={`px-4 py-1.5 rounded-md text-[13px] font-['Manrope:SemiBold',sans-serif] transition-colors ${
              timeScale === 'week'
                ? 'bg-white text-[#ff3b3b] shadow-sm'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeScale('month')}
            className={`px-4 py-1.5 rounded-md text-[13px] font-['Manrope:SemiBold',sans-serif] transition-colors ${
              timeScale === 'month'
                ? 'bg-white text-[#ff3b3b] shadow-sm'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="flex-1 overflow-auto border border-[#EEEEEE] rounded-[16px]">
        <div className="flex" style={{ minWidth: taskListWidth + timelineWidth }}>
          {/* Task List (Left Side) */}
          <div
            className="border-r border-[#EEEEEE] bg-[#FAFAFA] sticky left-0 z-10"
            style={{ width: taskListWidth, minWidth: taskListWidth }}
          >
            <div className="p-4 border-b border-[#EEEEEE] bg-white">
              <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
                Task Name
              </p>
            </div>
            <div className="divide-y divide-[#EEEEEE]">
              {mockTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-white hover:bg-[#FAFAFA] transition-colors"
                  style={{ minHeight: '50px' }}
                >
                  <p className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                    #{task.id} {task.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline (Right Side) */}
          <div className="flex-1 overflow-x-auto">
            {/* Timeline Header */}
            <div
              className="border-b border-[#EEEEEE] bg-white sticky top-0 z-20"
              style={{ minWidth: timelineWidth }}
            >
              <div className="flex">
                {timelineDates.map((date, idx) => {
                  const dayWidth = timeScale === 'week' ? 80 : timeScale === 'month' ? 100 : 60;
                  return (
                    <div
                      key={idx}
                      className="border-r border-[#EEEEEE] p-3 text-center"
                      style={{ width: dayWidth, minWidth: dayWidth }}
                    >
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
                        {timeScale === 'week' 
                          ? format(date, 'EEE d').toUpperCase()
                          : timeScale === 'month'
                          ? format(date, 'MMM yyyy').toUpperCase()
                          : format(date, 'EEE d').toUpperCase()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gantt Bars */}
            <div className="relative" style={{ minWidth: timelineWidth, minHeight: mockTasks.length * 50 }}>
              {mockTasks.map((task, taskIdx) => {
                const barStyle = getBarStyle(task);
                return (
                  <div
                    key={task.id}
                    className="absolute"
                    style={{
                      top: `${taskIdx * 50 + 10}px`,
                      left: `${taskListWidth + barStyle.left}px`,
                      width: `${barStyle.width}px`,
                      height: '30px',
                    }}
                  >
                    <div
                      className={`${getStatusColor(task.status)} rounded-md h-full flex items-center px-2 text-white text-[11px] font-['Manrope:Medium',sans-serif] shadow-sm`}
                    >
                      {task.assignee}
                    </div>
                  </div>
                );
              })}

              {/* Grid Lines */}
              {timelineDates.map((date, idx) => {
                const dayWidth = timeScale === 'week' ? 80 : timeScale === 'month' ? 100 : 60;
                return (
                  <div
                    key={idx}
                    className="absolute border-r border-[#EEEEEE]"
                    style={{
                      left: `${taskListWidth + idx * dayWidth}px`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
