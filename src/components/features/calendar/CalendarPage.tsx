import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Info, Video, X } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { Popover, Spin, Tag, Badge, Avatar, Tooltip, Button, Modal, Input, Select, DatePicker, App } from 'antd';
import dayjs from 'dayjs';
import { useTasks } from '@/hooks/useTask';
import { useMeetings } from '@/hooks/useMeeting';
import { useLeaves } from '@/hooks/useLeave';
import { useTeamsConnectionStatus, useCalendarEvents } from '@/hooks/useCalendar';
import { usePublicHolidays } from '@/hooks/useHoliday';
import { MicrosoftUserOAuth, createCalendarEvent, CreateEventPayload, GraphEvent } from '@/services/calendar';
import { useEmployees, useCurrentUserCompany } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { TaskType } from '@/services/task';
import { MeetingType } from '@/services/meeting';
import { LeaveType } from '@/services/leave';

const { TextArea } = Input;
const { Option } = Select;

interface Attendee {
  email: string;
  name?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'event' | 'leave' | 'holiday';
  participants?: { name: string; avatar?: string }[];
  location?: string;
  description?: string;
  status?: string;
  color: string;
  raw?: any;
}

export function CalendarPage() {
  const { message } = App.useApp();
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(dayjs().format('YYYY-MM-DD'));
  const [connecting, setConnecting] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();
  
  // Fetch employees for autocomplete (only when modal is open)
  const { data: employeesData } = useEmployees(showEventDialog ? 'limit=100' : '');
  
  // Get company timezone from backend, fallback to browser timezone
  const { data: companyData } = useCurrentUserCompany();
  const companyTimeZone = companyData?.result?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  
  // Fetch calendar events for refreshing after creation
  const startISO = dayjs().startOf("day").toISOString();
  const endISO = dayjs().add(7, "day").endOf("day").toISOString();
  const { data: calendarEventsData, refetch: refetchCalendarEvents } = useCalendarEvents(startISO, endISO);

  const [formData, setFormData] = useState({
    title: '',
    startDateTime: null as dayjs.Dayjs | null,
    duration: '',
    customTime: '',
    attendees: [] as Attendee[],
    description: ''
  });

  // Fetch data
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { data: meetings, isLoading: isLoadingMeetings } = useMeetings();
  const { data: leaves, isLoading: isLoadingLeaves } = useLeaves();
  const { data: holidays, isLoading: isLoadingHolidays } = usePublicHolidays();
  const { data: teamsStatus, isLoading: isLoadingTeamsStatus, refetch: refetchTeamsStatus } = useTeamsConnectionStatus();

  const isLoading = isLoadingTasks || isLoadingMeetings || isLoadingLeaves || isLoadingHolidays;
  const isConnected = teamsStatus?.result?.connected ?? false;

  // Connect to Teams
  const connectToTeams = useCallback(async () => {
    try {
      setConnecting(true);
      const response = await MicrosoftUserOAuth();
      if (response?.result) {
        window.location.href = response.result;
      }
    } catch (error) {
      message.error("Failed to connect to Microsoft Teams");
    } finally {
      setConnecting(false);
    }
  }, []);

  // Check connection status on mount and after potential redirect
  useEffect(() => {
    refetchTeamsStatus();
  }, [refetchTeamsStatus]);

  // Handle event form submission
  const handleCreateEvent = useCallback(async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      message.error("Title is required");
      return;
    }
    if (!formData.startDateTime) {
      message.error("Start Date & Time is required");
      return;
    }
    if (!formData.duration && !formData.customTime) {
      message.error("Please select a duration or enter custom time");
      return;
    }

    try {
      setSubmitting(true);

      // Calculate end time
      let endTime: dayjs.Dayjs;
      if (formData.customTime) {
        // Parse custom time (format: "HH:mm" or "H:mm")
        const [hours, minutes] = formData.customTime.split(':').map(Number);
        endTime = formData.startDateTime.hour(hours).minute(minutes || 0);
      } else {
        // Calculate from duration
        const durationMap: Record<string, number> = {
          '30 mins': 30,
          '45 mins': 45,
          '1 hour': 60,
          '1.5 hours': 90,
          '2 hours': 120,
        };
        const minutes = durationMap[formData.duration] || 60;
        endTime = formData.startDateTime.add(minutes, 'minute');
      }

      // Format payload
      const payload: CreateEventPayload = {
        subject: formData.title.trim(),
        start: {
          dateTime: formData.startDateTime.toISOString(),
          timeZone: companyTimeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: companyTimeZone,
        },
        body: {
          contentType: "HTML",
          content: formData.description?.trim()
            ? formData.description
            : "<p>Microsoft Teams meeting</p>",
        },
        attendees: formData.attendees
          .filter((attendee) => !!attendee.email)
          .map((attendee) => ({
            emailAddress: {
              address: attendee.email,
              name: attendee.name,
            },
            type: "required" as const,
          })),
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
      };

      await createCalendarEvent(payload);
      message.success("Event created successfully!");
      
      // Reset form and close modal
      setShowEventDialog(false);
      setFormData({
        title: '',
        startDateTime: null,
        duration: '',
        customTime: '',
        attendees: [],
        description: ''
      });

      // Refresh calendar events
      await refetchCalendarEvents();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to create event";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [formData, companyTimeZone, refetchCalendarEvents]);

  // Extract calendar events result for dependency tracking
  const calendarEvents = calendarEventsData?.result;

  // Process and merge events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Process Tasks (Deadlines)
    if (tasks?.result) {
      tasks.result.forEach((task: TaskType) => {
        if (task.due_date) {
          allEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            date: dayjs(task.due_date).format('YYYY-MM-DD'),
            time: 'Deadline',
            type: 'deadline',
            description: task.description,
            status: task.status,
            color: '#ff3b3b',
            raw: task
          });
        }
      });
    }

    // Process Calendar Events (Teams meetings) - Priority over old meetings API
    if (calendarEvents) {
      (calendarEvents as GraphEvent[]).forEach((event: GraphEvent) => {
        if (event.isCancelled) return;
        const startTime = dayjs(event.start.dateTime);
        allEvents.push({
          id: `calendar-event-${event.id}`,
          title: event.subject || 'Untitled Meeting',
          date: startTime.format('YYYY-MM-DD'),
          time: startTime.format('h:mm A'),
          type: 'meeting',
          location: event.isOnlineMeeting ? 'Microsoft Teams' : undefined,
          description: event.body?.content || '',
          status: 'scheduled',
          participants: event.attendees?.map((a: any) => ({ 
            name: a.emailAddress?.name || a.emailAddress?.address?.split('@')[0] || 'Unknown', 
            avatar: undefined 
          })),
          color: '#3B82F6',
          raw: event
        });
      });
    }

    // Process Old Meetings API (fallback if calendar events not available)
    if (meetings?.result && (!calendarEvents || calendarEvents.length === 0)) {
      meetings.result.forEach((meeting: MeetingType) => {
        allEvents.push({
          id: `meeting-${meeting.id}`,
          title: meeting.title,
          date: dayjs(meeting.start_time).format('YYYY-MM-DD'),
          time: dayjs(meeting.start_time).format('h:mm A'),
          type: 'meeting',
          location: meeting.platform || meeting.meeting_link,
          description: meeting.description,
          status: meeting.status,
          participants: meeting.participants?.map((p: any) => ({ name: p.name || 'Unknown', avatar: p.avatar })),
          color: '#3B82F6',
          raw: meeting
        });
      });
    }

    // Process Leaves
    if (leaves?.result) {
      leaves.result.forEach((leave: LeaveType) => {
        // Handle multi-day leaves? For now, just mark the start date
        // Ideally we should expand this to cover the range
        const start = dayjs(leave.start_date);
        const end = dayjs(leave.end_date);
        const diff = end.diff(start, 'day');

        for (let i = 0; i <= diff; i++) {
          const date = start.add(i, 'day').format('YYYY-MM-DD');
          allEvents.push({
            id: `leave-${leave.id}-${i}`,
            title: `${leave.user?.name || 'Employee'} - ${leave.leave_type} Leave`,
            date: date,
            time: 'All Day',
            type: 'leave',
            description: leave.reason,
            status: leave.status,
            color: '#f59e0b',
            raw: leave
          });
        }
      });
    }

    // Process Public Holidays
    if (holidays?.result) {
      holidays.result.forEach((holiday: any) => {
        if (holiday.is_deleted) return; // Skip deleted holidays
        allEvents.push({
          id: `holiday-${holiday.id}`,
          title: holiday.name,
          date: dayjs(holiday.date).format('YYYY-MM-DD'),
          time: 'All Day',
          type: 'holiday',
          description: `Public Holiday: ${holiday.name}`,
          status: 'holiday',
          color: '#8b5cf6',
          raw: holiday
        });
      });
    }

    return allEvents;
  }, [tasks, meetings, leaves, calendarEvents, holidays]);

  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = currentDate.daysInMonth();

    const days = [];

    // Previous month filler
    const prevMonth = currentDate.subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonth.date(daysInPrevMonth - i);
      days.push({
        day: d.date(),
        isCurrentMonth: false,
        date: d.format('YYYY-MM-DD')
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = currentDate.date(i);
      days.push({
        day: i,
        isCurrentMonth: true,
        date: d.format('YYYY-MM-DD')
      });
    }

    // Next month filler - only fill to complete current row, not entire rows
    const totalDays = days.length;
    const remainingSlotsInLastRow = totalDays % 7;
    if (remainingSlotsInLastRow > 0) {
      // Only fill the remaining slots in the current row
      const nextMonth = currentDate.add(1, 'month');
      for (let i = 1; i <= (7 - remainingSlotsInLastRow); i++) {
        const d = nextMonth.date(i);
        days.push({
          day: i,
          isCurrentMonth: false,
          date: d.format('YYYY-MM-DD')
        });
      }
    }

    // Remove last row if it contains only next month days
    if (days.length >= 7) {
      const lastRow = days.slice(-7);
      const allNextMonth = lastRow.every(day => !day.isCurrentMonth);
      if (allNextMonth) {
        return days.slice(0, -7);
      }
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const handleToday = () => {
    const today = dayjs();
    setCurrentDate(today);
    setSelectedDate(today.format('YYYY-MM-DD'));
  };

  const todayEvents = events.filter(e => e.date === dayjs().format('YYYY-MM-DD'));
  const upcomingEvents = events
    .filter(e => dayjs(e.date).isAfter(dayjs(), 'day'))
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    .slice(0, 5);

  const renderEventPopup = (event: CalendarEvent) => {
    // Extract Teams meeting details from raw GraphEvent
    const graphEvent = event.raw as GraphEvent | undefined;
    const isTeamsMeeting = graphEvent?.isOnlineMeeting || event.location === 'Microsoft Teams';
    const joinUrl = graphEvent?.onlineMeeting?.joinUrl || graphEvent?.onlineMeetingUrl;
    const webLink = graphEvent?.webLink;
    
    // Extract meeting ID and passcode from description or body content
    let meetingId: string | null = null;
    let passcode: string | null = null;
    
    if (graphEvent?.body?.content) {
      // Remove HTML tags for text extraction
      const textContent = graphEvent.body.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Try to extract meeting ID (format: numbers separated by spaces, e.g., "415 314 166 645 2")
      const meetingIdPatterns = [
        /Meeting ID[:\s]+([\d\s]+)/i,
        /(\d{3}\s+\d{3}\s+\d{3}\s+\d{3}\s+\d+)/,
        /ID[:\s]+([\d\s]{10,})/i
      ];
      
      for (const pattern of meetingIdPatterns) {
        const match = textContent.match(pattern);
        if (match) {
          meetingId = match[1].trim().replace(/\s+/g, ' ');
          break;
        }
      }
      
      // Try to extract passcode (alphanumeric, typically 6-10 characters)
      const passcodePatterns = [
        /Passcode[:\s]+([A-Za-z0-9]{4,12})/i,
        /Password[:\s]+([A-Za-z0-9]{4,12})/i,
        /Code[:\s]+([A-Za-z0-9]{4,12})/i
      ];
      
      for (const pattern of passcodePatterns) {
        const match = textContent.match(pattern);
        if (match) {
          passcode = match[1].trim();
          break;
        }
      }
    }

    return (
      <div className="w-[320px] p-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Tag color={event.color} className="m-0">{event.type.toUpperCase()}</Tag>
          {event.status && <span className="text-[12px] text-[#999999] font-['Manrope:Regular',sans-serif] capitalize">{event.status}</span>}
        </div>

        {/* Title */}
        <h4 className="font-['Manrope:Bold',sans-serif] text-[16px] text-[#111111] mb-3">{event.title}</h4>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-[#666666] text-[13px] font-['Manrope:Regular',sans-serif] mb-3">
          <Clock className="w-4 h-4" />
          <span>{dayjs(event.date).format('MMM D, YYYY')} • {event.time}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-[#666666] text-[13px] font-['Manrope:Regular',sans-serif] mb-4">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Meeting Details (for Teams meetings) */}
        {isTeamsMeeting && (meetingId || passcode || joinUrl) && (
          <div className="border-t border-[#EEEEEE] pt-4 mt-4 space-y-3">
            {meetingId && (
              <div>
                <span className="text-[13px] text-[#616161] font-['Manrope:Regular',sans-serif] mb-1 block">Meeting ID:</span>
                <span className="text-[13px] text-[#242424] font-['Manrope:Regular',sans-serif]">{meetingId}</span>
              </div>
            )}
            {passcode && (
              <div>
                <span className="text-[13px] text-[#616161] font-['Manrope:Regular',sans-serif] mb-1 block">Passcode:</span>
                <span className="text-[13px] text-[#242424] font-['Manrope:Regular',sans-serif]">{passcode}</span>
              </div>
            )}
            
            {/* Meeting Link - For organizers */}
            {webLink && (
              <div className="mt-4">
                <span className="text-[13px] text-[#616161] font-['Manrope:Regular',sans-serif] mb-2 block">For organizers:</span>
                <a
                  href={webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#5B5FC7] font-['Manrope:Regular',sans-serif] underline hover:text-[#4A4FC7] transition-colors"
                >
                  Meeting options
                </a>
              </div>
            )}
          </div>
        )}

        {/* Join Meeting Button */}
        {isTeamsMeeting && joinUrl && (
          <div className="mt-4 pt-4 border-t border-[#EEEEEE]">
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5FC7] hover:bg-[#4A4FC7] text-white text-[13px] font-['Manrope:SemiBold',sans-serif] rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              Join Meeting
            </a>
          </div>
        )}

        {/* Description */}
        {event.description && !isTeamsMeeting && (
          <div className="mt-4 pt-4 border-t border-[#EEEEEE]">
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Participants */}
        {event.participants && event.participants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#EEEEEE]">
            <p className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#999999] mb-2">Participants</p>
            <Avatar.Group maxCount={5} size="small">
              {event.participants.map((p, idx) => (
                <Tooltip title={p.name} key={idx}>
                  <Avatar src={p.avatar}>{p.name[0]}</Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageLayout
      title="Calendar"
      tabs={[
        { id: 'month', label: 'Month' },
        { id: 'week', label: 'Week' },
        { id: 'day', label: 'Day' },
        { id: 'agenda', label: 'Agenda' }
      ]}
      activeTab={activeView}
      onTabChange={(tabId) => setActiveView(tabId as any)}
      titleAction={{
        onClick: () => setShowEventDialog(true)
      }}
      action={
        <div className="flex items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="w-9 h-9 rounded-[8px] border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#666666]" />
            </button>
            <div className="px-4 py-2 bg-[#F7F7F7] rounded-[8px] border border-[#EEEEEE]">
              <span className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                {currentDate.format('MMMM YYYY')}
              </span>
            </div>
            <button onClick={handleNextMonth} className="w-9 h-9 rounded-[8px] border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors">
              <ChevronRight className="w-4 h-4 text-[#666666]" />
            </button>
            <button onClick={handleToday} className="px-4 py-2 text-[13px] font-['Manrope:Medium',sans-serif] text-[#666666] hover:text-[#111111] transition-colors">
              Today
            </button>
          </div>
          {!isLoadingTeamsStatus && (
            <>
              {isConnected ? (
                <Tag color="green" className="m-0 font-['Manrope:SemiBold',sans-serif] text-[12px]">
                  Connected to Teams
                </Tag>
              ) : (
                <Button
                  type="primary"
                  icon={<Video className="w-4 h-4" />}
                  loading={connecting}
                  onClick={connectToTeams}
                  className="h-9 px-4 text-[13px] font-['Manrope:SemiBold',sans-serif] bg-[#111111] hover:bg-[#000000]/90 border-none"
                >
                  Connect to Teams
                </Button>
              )}
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full">

        <div className="flex-1 grid grid-cols-[1fr_320px] gap-6 overflow-hidden min-h-0">
          {/* Calendar Grid */}
          <div
            className="overflow-y-auto h-full pr-2"
            style={{
              scrollbarWidth: 'none',  /* Firefox */
              msOverflowStyle: 'none',  /* IE and Edge */
            }}
          >
            <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            ) : (
              <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-4 min-h-full">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center py-2">
                      <span className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#666666]">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((dayObj, index) => {
                    const dayEvents = getEventsForDate(dayObj.date);
                    const isToday = dayObj.date === dayjs().format('YYYY-MM-DD');
                    const isSelected = selectedDate === dayObj.date;

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 rounded-[8px] border transition-all cursor-pointer flex flex-col ${dayObj.isCurrentMonth
                          ? 'bg-white border-[#EEEEEE] hover:border-[#ff3b3b] hover:bg-[#FFF5F5]'
                          : 'bg-[#F7F7F7] border-transparent'
                          } ${isToday ? 'border-[#ff3b3b] bg-[#FFF5F5]' : ''} ${isSelected && !isToday ? 'border-gray-400' : ''}`}
                        onClick={() => setSelectedDate(dayObj.date)}
                      >
                        <div className={`font-['Manrope:SemiBold',sans-serif] text-[13px] mb-1 flex justify-between items-center ${dayObj.isCurrentMonth ? 'text-[#111111]' : 'text-[#999999]'
                          } ${isToday ? 'text-[#ff3b3b]' : ''}`}>
                          <span>{dayObj.day}</span>
                          {isToday && <span className="text-[10px] bg-[#ff3b3b] text-white px-1.5 rounded">Today</span>}
                        </div>
                        <div className="space-y-1 flex-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <Popover key={event.id} content={renderEventPopup(event)} trigger="click">
                              <div
                                className="px-2 py-1 rounded-[4px] text-[10px] font-['Manrope:Medium',sans-serif] text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: event.color }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {event.title}
                              </div>
                            </Popover>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] font-['Manrope:Medium',sans-serif] text-[#666666] px-2">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* Today's Events */}
            <div className="bg-[#F7F7F7] rounded-[16px] p-5">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-4">
                Today&apos;s Events
              </h4>
              <div className="space-y-3">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <Popover key={event.id} content={renderEventPopup(event)} title="" trigger="click" placement="left">
                      <div className="bg-white rounded-[12px] p-4 border border-[#EEEEEE] cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-1 h-full rounded-full mt-1"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1">
                            <div className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] mb-1">
                              {event.title}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666] mb-2">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Popover>
                  ))
                ) : (
                  <div className="text-center py-6 text-[13px] font-['Manrope:Regular',sans-serif] text-[#999999]">
                    No events today
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-[#F7F7F7] rounded-[16px] p-5">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-4">
                Upcoming
              </h4>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (upcomingEvents.map((event) => (
                  <Popover key={event.id} content={renderEventPopup(event)} title="" trigger="click" placement="left">
                    <div key={event.id} className="bg-white rounded-[12px] p-4 border border-[#EEEEEE] cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 h-full rounded-full mt-1"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1">
                          <div className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] mb-1">
                            {event.title}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                            <CalendarIcon className="w-3 h-3" />
                            {dayjs(event.date).format('MMM D')} • {event.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popover>
                ))) : (
                  <div className="text-center py-6 text-[13px] font-['Manrope:Regular',sans-serif] text-[#999999]">
                    No upcoming events
                  </div>
                )}
              </div>
            </div>

            {/* Event Types Legend */}
            <div className="bg-[#F7F7F7] rounded-[16px] p-5">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-4">
                Event Types
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                  <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">Meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff3b3b]" />
                  <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">Deadlines</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                  <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">Leaves</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                  <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">Holidays</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal
        title={null}
        open={showEventDialog}
        onCancel={() => {
          setShowEventDialog(false);
          setFormData({
            title: '',
            startDateTime: null,
            duration: '',
            customTime: '',
            attendees: [],
            description: ''
          });
        }}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        closeIcon={<X className="w-5 h-5 text-[#666666]" />}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
            <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">
              <div className="p-2 rounded-full bg-[#F7F7F7]">
                <CalendarIcon className="w-5 h-5 text-[#666666]" />
              </div>
              Create Event
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
              Schedule a new meeting or event with your team.
            </p>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Form Fields */}
            <div className="space-y-5">
              {/* Title Field */}
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <span className="text-[#ff3b3b]">*</span> Title
                </span>
                <Input
                  placeholder="Event title"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.title ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Start Date & Time Field */}
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <span className="text-[#ff3b3b]">*</span> Start Date & Time
                </span>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Select start date & time"
                  className={`w-full h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.startDateTime ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={formData.startDateTime}
                  onChange={(date) => setFormData({ ...formData, startDateTime: date })}
                  suffixIcon={<CalendarIcon className="w-4 h-4 text-[#666666]" />}
                />
              </div>

              {/* End Time Field */}
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <span className="text-[#ff3b3b]">*</span> End Time
                </span>
                <div className="flex items-center gap-3">
                  <Select
                    placeholder="Select duration"
                    className={`flex-1 h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.duration ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                    value={formData.duration}
                    onChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <Option value="30 mins">30 mins</Option>
                    <Option value="45 mins">45 mins</Option>
                    <Option value="1 hour">1 hour</Option>
                    <Option value="1.5 hours">1.5 hours</Option>
                    <Option value="2 hours">2 hours</Option>
                  </Select>
                  <Input
                    placeholder="Custom time"
                    className={`flex-1 h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.customTime ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                    value={formData.customTime}
                    onChange={(e) => setFormData({ ...formData, customTime: e.target.value })}
                    suffix={<Clock className="w-4 h-4 text-[#666666]" />}
                  />
                </div>
              </div>

              {/* Attendees Field */}
              <AttendeesField
                attendees={formData.attendees}
                onAddAttendee={(attendee) => {
                  if (!formData.attendees.some(a => a.email.toLowerCase() === attendee.email.toLowerCase())) {
                    setFormData({
                      ...formData,
                      attendees: [...formData.attendees, attendee],
                    });
                  }
                }}
                onRemoveAttendee={(index) => {
                  setFormData({
                    ...formData,
                    attendees: formData.attendees.filter((_, i) => i !== index),
                  });
                }}
                employeesData={employeesData}
              />

              {/* Description Field */}
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  Description
                </span>
                <TextArea
                  placeholder="Agenda, notes, etc."
                  className={`min-h-[120px] rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] resize-none ${formData.description ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6">
                <Button
                  type="text"
                  onClick={() => {
                    setShowEventDialog(false);
                    setFormData({
                      title: '',
                      startDateTime: null,
                      duration: '',
                      customTime: '',
                      attendees: [],
                      description: ''
                    });
                  }}
                  className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleCreateEvent}
                  loading={submitting}
                  className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}

// Attendees Field Component with Autocomplete
function AttendeesField({
  attendees,
  onAddAttendee,
  onRemoveAttendee,
  employeesData
}: {
  attendees: Attendee[];
  onAddAttendee: (attendee: Attendee) => void;
  onRemoveAttendee: (index: number) => void;
  employeesData: any;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get employees list
  const employees = useMemo(() => {
    return employeesData?.result || [];
  }, [employeesData]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    
    const query = inputValue.toLowerCase();
    const filtered = employees.filter((emp: any) => {
      const email = (emp.email || '').toLowerCase();
      const name = (emp.name || '').toLowerCase();
      // Check if already selected
      const isSelected = attendees.some(a => a.email.toLowerCase() === email);
      return !isSelected && (email.includes(query) || name.includes(query));
    });

    // Also check if input is a valid email format and not already in attendees
    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
    const isAlreadyAdded = attendees.some(a => a.email.toLowerCase() === inputValue.toLowerCase());
    
    if (isEmailFormat && !isAlreadyAdded && !filtered.some((emp: any) => emp.email?.toLowerCase() === inputValue.toLowerCase())) {
      // Add custom email as first suggestion
      return [{ email: inputValue, name: inputValue }, ...filtered];
    }

    return filtered.slice(0, 5); // Limit to 5 suggestions
  }, [inputValue, employees, attendees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        // Select from suggestions
        const selected = suggestions[selectedIndex];
        onAddAttendee({
          email: selected.email || inputValue,
          name: selected.name
        });
      } else if (inputValue.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue.trim())) {
        // Add custom email
        onAddAttendee({
          email: inputValue.trim(),
          name: inputValue.trim()
        });
      }
      setInputValue('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    onAddAttendee({
      email: suggestion.email || inputValue,
      name: suggestion.name
    });
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-2">
      <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
        Attendees
      </span>
      
      {/* Attendee Chips (Gmail style) */}
      {attendees.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] p-2 border border-[#EEEEEE] rounded-lg bg-[#F9FAFB]">
          {attendees.map((attendee, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EEEEEE] rounded-full text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif] hover:border-[#ff3b3b]/30 transition-colors"
            >
              <span>{attendee.name || attendee.email}</span>
              <button
                onClick={() => onRemoveAttendee(idx)}
                className="ml-0.5 hover:bg-[#FEE2E2] rounded-full p-0.5 transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5 text-[#666666] hover:text-[#ff3b3b]" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <Input
          placeholder="Type email address and press Enter"
          className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${inputValue ? 'bg-white' : 'bg-[#F9FAFB]'}`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) setShowSuggestions(true);
          }}
          suffix={
            <svg className="w-4 h-4 text-[#666666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          }
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-[#EEEEEE] rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
          >
            {suggestions.map((suggestion: any, idx: number) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-[#F7F7F7]'
                    : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                      {suggestion.name || suggestion.email}
                    </div>
                    {suggestion.name && suggestion.email && (
                      <div className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                        {suggestion.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}