"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTabSync } from '@/hooks/useTabSync';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video, X } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { Popover, Spin, Tag, Button, Modal, Input, Select, DatePicker, App, Avatar, Tooltip, Segmented, Radio } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);

import { useTasks } from '@/hooks/useTask';
import { useMeetings } from '@/hooks/useMeeting';
import { useLeaves, useApplyForLeave, useCompanyLeaves } from '@/hooks/useLeave';
import { useTeamsConnectionStatus, useCalendarEvents } from '@/hooks/useCalendar';
import { usePublicHolidays } from '@/hooks/useHoliday';
import { MicrosoftUserOAuth, createCalendarEvent, CreateEventPayload, GraphEvent } from '@/services/calendar';
import { useEmployees, useCurrentUserCompany, useUserDetails } from '@/hooks/useUser';
import { TaskType } from '@/services/task';
import { MeetingType } from '@/services/meeting';
import { LeaveType } from '@/services/leave';
import { Holiday } from '@/types/domain';

import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CalendarEventPopup } from './CalendarEventPopup';
import { CalendarEvent } from './types';

const { TextArea } = Input;
const { Option } = Select;

interface Attendee {
  email: string;
  name?: string;
}

export function CalendarPage() {
  const { message } = App.useApp();
  const router = useRouter();
  
  const [activeView, setActiveView] = useTabSync<'month' | 'week' | 'day'>({
    defaultTab: 'month',
    validTabs: ['month', 'week', 'day']
  });

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(dayjs().format('YYYY-MM-DD'));
  const [connecting, setConnecting] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventType, setEventType] = useState<'event' | 'leave'>('event');

  // Fetch employees for autocomplete
  const { data: employeesData } = useEmployees(showEventDialog ? 'limit=100' : '');

  // Get company timezone
  const { data: companyData } = useCurrentUserCompany();
  const companyTimeZone = companyData?.result?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Fetch calendar events
  const startISO = currentDate.startOf('month').subtract(7, 'day').toISOString();
  const endISO = currentDate.endOf('month').add(7, 'day').toISOString();
  
  const { data: calendarEventsData, refetch: refetchCalendarEvents } = useCalendarEvents(startISO, endISO);

  const [formData, setFormData] = useState({
    title: '',
    startDateTime: null as dayjs.Dayjs | null,
    endDateTime: null as dayjs.Dayjs | null,
    duration: '',
    customTime: '',
    attendees: [] as Attendee[],
    description: '',
    leaveType: undefined as string | undefined,
    dayType: 'Full Day'
  });

  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { data: meetings, isLoading: isLoadingMeetings } = useMeetings();
  const { data: leaves, isLoading: isLoadingLeaves } = useLeaves();
  const { data: holidays, isLoading: isLoadingHolidays } = usePublicHolidays();
  const { data: teamsStatus, isLoading: isLoadingTeamsStatus, refetch: refetchTeamsStatus } = useTeamsConnectionStatus();
  const { data: leavesData } = useCompanyLeaves();
  const applyLeaveMutation = useApplyForLeave();

  const isLoading = isLoadingTasks || isLoadingMeetings || isLoadingLeaves || isLoadingHolidays;
  const isConnected = teamsStatus?.result?.connected ?? false;

  const availableLeaveTypes = useMemo((): string[] => {
    if (!leavesData?.result) return ['Sick Leave', 'Casual Leave', 'Vacation'];
    const types = new Set((leavesData.result as any[]).map((leave: any) => leave.leave_type)); // leavesData type might be generic, casting to any[] for map if needed or strictly typing if possible. Assuming leavesData result is generic array.
    return Array.from(types).filter(Boolean).length > 0
      ? Array.from(types).filter((t): t is string => Boolean(t))
      : ['Sick Leave', 'Casual Leave', 'Vacation'];
  }, [leavesData]);

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

  useEffect(() => {
    refetchTeamsStatus();
  }, [refetchTeamsStatus]);

  const handleCancel = () => {
      setShowEventDialog(false);
      setFormData({ 
          title: '', 
          startDateTime: null, 
          endDateTime: null,
          duration: '', 
          customTime: '', 
          attendees: [], 
          description: '',
          leaveType: undefined,
          dayType: 'Full Day'
      });
      setEventType('event');
  };

  const handleCreate = useCallback(async () => {
    if (eventType === 'event') {
        if (!formData.title.trim()) { message.error("Title is required"); return; }
        if (!formData.startDateTime) { message.error("Start Date & Time is required"); return; }
        if (!formData.duration && !formData.customTime) { message.error("Please select a duration or enter custom time"); return; }
        
        try {
            setSubmitting(true);
            let endTime: dayjs.Dayjs;
            if (formData.customTime) {
              const [hours, minutes] = formData.customTime.split(':').map(Number);
              endTime = formData.startDateTime.hour(hours).minute(minutes || 0);
            } else {
              const durationMap: Record<string, number> = {
                '30 mins': 30, '45 mins': 45, '1 hour': 60, '1.5 hours': 90, '2 hours': 120,
              };
              const minutes = durationMap[formData.duration] || 60;
              endTime = formData.startDateTime.add(minutes, 'minute');
            }

            const payload: CreateEventPayload = {
              subject: formData.title.trim(),
              start: { dateTime: formData.startDateTime.toISOString(), timeZone: companyTimeZone },
              end: { dateTime: endTime.toISOString(), timeZone: companyTimeZone },
              body: { contentType: "HTML", content: formData.description?.trim() ? formData.description : "<p>Microsoft Teams meeting</p>" },
              attendees: formData.attendees.filter((a) => !!a.email).map((a) => ({ emailAddress: { address: a.email, name: a.name }, type: "required" as const })),
              isOnlineMeeting: true,
              onlineMeetingProvider: "teamsForBusiness",
            };

            await createCalendarEvent(payload);
            message.success("Event created successfully!");
            handleCancel();
            await refetchCalendarEvents();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Failed to create event";
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    } else {
        if (!formData.leaveType) { message.error("Leave Type is required"); return; }
        if (!formData.startDateTime) { message.error("Start Date is required"); return; }
        // For leaves, endDateTime defaults to startDateTime if missing usually, but let's enforce it
        if (!formData.endDateTime) { message.error("End Date is required"); return; }
        if (!formData.description) { message.error("Reason is required"); return; }

        try {
            setSubmitting(true);
            await applyLeaveMutation.mutateAsync({
                start_date: formData.startDateTime.format('YYYY-MM-DD'),
                end_date: formData.endDateTime.format('YYYY-MM-DD'),
                day_type: formData.dayType,
                leave_type: formData.leaveType,
                reason: formData.description
            });
            message.success("Leave applied successfully!");
            handleCancel();
        } catch (error: any) {
             // Error already handled generally
        } finally {
            setSubmitting(false);
        }
    }
  }, [formData, eventType, companyTimeZone, refetchCalendarEvents, applyLeaveMutation]);


  const handleTimeSlotClick = useCallback((dateTime: dayjs.Dayjs) => {
    console.log('handleTimeSlotClick triggered:', dateTime.format('YYYY-MM-DD HH:mm'));
    setFormData(prev => ({ 
        ...prev, 
        startDateTime: dateTime, 
        endDateTime: dateTime, 
        duration: '1 hour' 
    }));
    setEventType('event');
    setShowEventDialog(true);
  }, []);

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const calendarEvents = calendarEventsData?.result;

    if (tasks?.result) {
      tasks.result.forEach((task: TaskType) => {
        if (task.due_date) {
            allEvents.push({
                id: `task-${task.id}`,
                title: task.title || task.name || 'Untitled',
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

    if (calendarEvents) {
      (calendarEvents as GraphEvent[]).forEach((event: GraphEvent) => {
        if (event.isCancelled) return;
        const startTime = dayjs.utc(event.start.dateTime).tz(companyTimeZone);
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
          startDateTime: startTime, // Pass the timezone-converted Dayjs object
          raw: event
        });
      });
    }

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
          participants: meeting.participants?.map((p: any) => ({ name: p.name || 'Unknown', avatar: p.avatar })), // meeting participants typed as unknown[] in service. keeping any cast or refining if possible. defining strictly:
          // We can try to cast p as {name: string, avatar: string} if we trust backend
          color: '#3B82F6',
          raw: meeting
        });
      });
    }

    if (leaves?.result) {
      leaves.result.forEach((leave: LeaveType) => {
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

    if (holidays?.result) {
      holidays.result.forEach((holiday: Holiday) => {
        if (holiday.is_deleted) return;
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
  }, [tasks, meetings, leaves, calendarEventsData, holidays, companyTimeZone]);

  const handlePrev = () => {
      if (activeView === 'month') setCurrentDate(currentDate.subtract(1, 'month'));
      else if (activeView === 'week') setCurrentDate(currentDate.subtract(1, 'week'));
      else setCurrentDate(currentDate.subtract(1, 'day'));
  };

  const handleNext = () => {
      if (activeView === 'month') setCurrentDate(currentDate.add(1, 'month'));
      else if (activeView === 'week') setCurrentDate(currentDate.add(1, 'week'));
      else setCurrentDate(currentDate.add(1, 'day'));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  };

  const dateLabel = useMemo(() => {
      if (activeView === 'month') return currentDate.format('MMMM YYYY');
      if (activeView === 'week') {
          const start = currentDate.startOf('week');
          const end = currentDate.endOf('week');
          if (start.month() === end.month()) {
              return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
          } else {
              if (start.year() === end.year()) {
                  return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
              }
              return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
          }
      }
      return currentDate.format('MMMM D, YYYY');
  }, [currentDate, activeView]);

  // Fetch current user details for leave filtering
  const { data: userDetails } = useUserDetails();
  const currentUserId = userDetails?.result?.id;

  const todayEvents = events.filter(e => e.date === dayjs().format('YYYY-MM-DD'));
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => {
        const isFuture = dayjs(e.date).isAfter(dayjs(), 'day');
        if (!isFuture) return false;

        if (e.type === 'meeting') return true;
        if (e.type === 'leave') return e.raw.user_id === currentUserId;
        if (e.type === 'holiday') {
          const eventDate = dayjs(e.date);
          const now = dayjs();
          return eventDate.month() === now.month() && eventDate.year() === now.year();
        }
        
        // Exclude others (tasks/deadlines) based on request "only show..."
        return false;
      })
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
      .slice(0, 10);
  }, [events, currentUserId]);

  return (
    <PageLayout
      title="Calendar"
      tabs={[
        { id: 'month', label: 'Month' },
        { id: 'week', label: 'Week' },
        { id: 'day', label: 'Day' }
      ]}
      activeTab={activeView}
      onTabChange={(tabId) => setActiveView(tabId as any)}
      titleAction={{ onClick: () => { setShowEventDialog(true); setEventType('event'); } }}
      action={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleToday} 
              className="h-9 px-4 rounded-[8px] border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] focus:ring-2 focus:ring-[#111111] focus:outline-none"
            >
              Today
            </button>
            <button onClick={handlePrev} className="w-9 h-9 rounded-[8px] border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors focus:ring-2 focus:ring-[#111111] focus:outline-none">
              <ChevronLeft className="w-4 h-4 text-[#666666]" />
            </button>
            <div className="px-4 py-2 bg-[#F7F7F7] rounded-[8px] border border-[#EEEEEE]" role="status">
              <span className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                {dateLabel}
              </span>
            </div>
            <button onClick={handleNext} className="w-9 h-9 rounded-[8px] border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors focus:ring-2 focus:ring-[#111111] focus:outline-none">
              <ChevronRight className="w-4 h-4 text-[#666666]" />
            </button>
          </div>
          {!isLoadingTeamsStatus && (
            <>
              {isConnected ? (
                <Tag color="green" className="m-0 font-['Manrope:SemiBold',sans-serif] text-[12px]">Connected to Teams</Tag>
              ) : (
                <Button type="primary" icon={<Video className="w-4 h-4" />} loading={connecting} onClick={connectToTeams} className="h-9 px-4 text-[13px] font-['Manrope:SemiBold',sans-serif] bg-[#111111] hover:bg-[#000000]/90 border-none">Connect to Teams</Button>
              )}
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full"> 
        <div className="flex-1 grid grid-cols-[1fr_280px] gap-6 overflow-hidden min-h-0">
          
          <div className="overflow-hidden h-full flex flex-col">
              {activeView === 'month' && (
                  <MonthView
                      currentDate={currentDate}
                      events={events}
                      isLoading={isLoading}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                  />
              )}
              {activeView === 'week' && (
                  <WeekView 
                      currentDate={currentDate}
                      events={events}
                      isLoading={isLoading}
                      onTimeSlotClick={handleTimeSlotClick}
                  />
              )}
              {activeView === 'day' && (
                  <DayView
                      currentDate={currentDate}
                      events={events}
                      isLoading={isLoading}
                      onTimeSlotClick={handleTimeSlotClick}
                  />
              )}

          </div>

          <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide">
            {/* Today's Events */}
            <div className="bg-[#F7F7F7] rounded-[16px] p-5">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-4">
                Today&apos;s Events
              </h4>
              <div className="space-y-3">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <Popover key={event.id} content={<CalendarEventPopup event={event} />} title="" trigger="click" placement="left">
                      <div className="bg-white rounded-[12px] p-4 border border-[#EEEEEE] cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-full rounded-full mt-1" style={{ backgroundColor: event.color }} />
                          <div className="flex-1">
                            <div className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] mb-1">{event.title}</div>
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
            <div className="bg-[#F7F7F7] rounded-[16px] p-5 min-h-[300px]">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-4">Upcoming</h4>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (upcomingEvents.map((event) => (
                   <Popover key={event.id} content={<CalendarEventPopup event={event} />} title="" trigger="click" placement="left">
                    <div key={event.id} className="bg-white rounded-[12px] p-4 border border-[#EEEEEE] cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-full rounded-full mt-1" style={{ backgroundColor: event.color }} />
                        <div className="flex-1">
                          <div className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] mb-1">{event.title}</div>
                          <div className="flex items-center gap-1 text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                            <CalendarIcon className="w-3 h-3" />
                            {event.endDate ? (
                              dayjs(event.date).month() === dayjs(event.endDate).month() ?
                                `${dayjs(event.date).format('MMM D')} - ${dayjs(event.endDate).format('D')}` :
                                `${dayjs(event.date).format('MMM D')} - ${dayjs(event.endDate).format('MMM D')}`
                            ) : (
                              dayjs(event.date).format('MMM D')
                            )} • {event.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popover>
                ))) : (
                  <div className="text-center py-6 text-[13px] font-['Manrope:Regular',sans-serif] text-[#999999]">No upcoming events</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={null}
        open={showEventDialog}
        onCancel={handleCancel}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        closeIcon={<X className="w-5 h-5 text-[#666666]" />}
        styles={{ body: { padding: 0 } }}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                    <div className="p-2 rounded-full bg-[#F7F7F7]">
                        <CalendarIcon className="w-5 h-5 text-[#666666]" />
                    </div>
                    {eventType === 'event' ? 'Create Event' : 'Apply Leave'}
                </div>
                <Segmented
                    options={[
                        { label: 'Event', value: 'event' },
                        { label: 'Leave', value: 'leave' }
                    ]}
                    value={eventType}
                    onChange={(val) => setEventType(val as 'event' | 'leave')}
                    className="bg-[#F7F7F7] p-1 rounded-lg"
                />
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
                {eventType === 'event' 
                    ? 'Schedule a new meeting or event with your team.' 
                    : 'Apply for leave request to your manager.'}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              
              {eventType === 'event' ? (
                  <>
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> Title</span>
                        <Input placeholder="Event title" className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.title ? 'bg-white' : 'bg-[#F9FAFB]'}`} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> Start Date & Time</span>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" placeholder="Select start date & time" className={`w-full h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.startDateTime ? 'bg-white' : 'bg-[#F9FAFB]'}`} value={formData.startDateTime} onChange={(date) => setFormData({ ...formData, startDateTime: date })} suffixIcon={<CalendarIcon className="w-4 h-4 text-[#666666]" />} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> End Time</span>
                        <div className="flex items-center gap-3">
                          <Select placeholder="Select duration" className={`flex-1 h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.duration ? 'bg-white' : 'bg-[#F9FAFB]'}`} value={formData.duration} onChange={(value) => setFormData({ ...formData, duration: value })}>
                            <Option value="30 mins">30 mins</Option>
                            <Option value="45 mins">45 mins</Option>
                            <Option value="1 hour">1 hour</Option>
                            <Option value="1.5 hours">1.5 hours</Option>
                            <Option value="2 hours">2 hours</Option>
                          </Select>
                          <Input placeholder="Custom time" className={`flex-1 h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.customTime ? 'bg-white' : 'bg-[#F9FAFB]'}`} value={formData.customTime} onChange={(e) => setFormData({ ...formData, customTime: e.target.value })} suffix={<Clock className="w-4 h-4 text-[#666666]" />} />
                        </div>
                      </div>
                      <AttendeesField attendees={formData.attendees} onAddAttendee={(attendee) => { if (!formData.attendees.some(a => a.email.toLowerCase() === attendee.email.toLowerCase())) { setFormData({ ...formData, attendees: [...formData.attendees, attendee] }); } }} onRemoveAttendee={(index) => { setFormData({ ...formData, attendees: formData.attendees.filter((_, i) => i !== index) }); }} employeesData={employeesData} />
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
                        <TextArea placeholder="Agenda, notes, etc." className={`min-h-[120px] rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] resize-none ${formData.description ? 'bg-white' : 'bg-[#F9FAFB]'}`} rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                      </div>
                  </>
              ) : (
                  <>
                      {/* Leave Type */}
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> Leave Type</span>
                        <Select 
                            placeholder="Select leave type" 
                            className={`w-full h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.leaveType ? 'bg-white' : 'bg-[#F9FAFB]'}`} 
                            value={formData.leaveType} 
                            onChange={(value) => setFormData({ ...formData, leaveType: value })}
                        >
                             {availableLeaveTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> Start Date</span>
                            <DatePicker format="YYYY-MM-DD" placeholder="Start Date" className={`w-full h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.startDateTime ? 'bg-white' : 'bg-[#F9FAFB]'}`} value={formData.startDateTime} onChange={(date) => setFormData({ ...formData, startDateTime: date })} suffixIcon={<CalendarIcon className="w-4 h-4 text-[#666666]" />} />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> End Date</span>
                            <DatePicker format="YYYY-MM-DD" placeholder="End Date" className={`w-full h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.endDateTime ? 'bg-white' : 'bg-[#F9FAFB]'}`} value={formData.endDateTime} onChange={(date) => setFormData({ ...formData, endDateTime: date })} suffixIcon={<CalendarIcon className="w-4 h-4 text-[#666666]" />} />
                          </div>
                      </div>

                      {/* Day Type */}
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> Day Type</span>
                        <Radio.Group 
                            value={formData.dayType} 
                            onChange={(e) => setFormData({ ...formData, dayType: e.target.value })}
                            className="flex gap-4"
                        >
                            <Radio value="Full Day">Full Day</Radio>
                            <Radio value="First Half">First Half</Radio>
                            <Radio value="Second Half">Second Half</Radio>
                        </Radio.Group>
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"><span className="text-[#ff3b3b]">*</span> Reason</span>
                        <TextArea placeholder="Reason for leave" className={`min-h-[120px] rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] resize-none ${formData.description ? 'bg-white' : 'bg-[#F9FAFB]'}`} rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                      </div>
                  </>
              )}

              <div className="flex items-center justify-end gap-4 pt-6">
                <Button type="text" onClick={handleCancel} className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg">Cancel</Button>
                <Button type="primary" onClick={handleCreate} loading={submitting} className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none">
                    {eventType === 'event' ? 'Create Event' : 'Apply Leave'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}

// Reuse AttendeesField as is or keep it here if not moved
function AttendeesField({ attendees, onAddAttendee, onRemoveAttendee, employeesData }: { attendees: Attendee[]; onAddAttendee: (attendee: Attendee) => void; onRemoveAttendee: (index: number) => void; employeesData: any; }) {
  const [searchValue, setSearchValue] = useState('');
  
  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchValue || !employeesData?.result) return [];
    return employeesData.result.filter((emp: any) => 
      emp.name.toLowerCase().includes(searchValue.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchValue.toLowerCase())
    ).slice(0, 5);
  }, [searchValue, employeesData]);

  return (
    <div className="space-y-2">
      <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Attendees</span>
      <div className="flex flex-wrap gap-2 mb-2">
        {attendees.map((attendee, index) => (
          <div key={index} className="flex items-center gap-1 bg-[#F7F7F7] px-2 py-1 rounded-md border border-[#EEEEEE]">
            <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">{attendee.name || attendee.email}</span>
            <button onClick={() => onRemoveAttendee(index)} className="text-[#666666] hover:text-[#FF3B3B]">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <Input 
          placeholder="Add attendees by email" 
          className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] bg-[#F9FAFB]" 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchValue) {
              e.preventDefault();
              if (searchValue.includes('@')) {
                  onAddAttendee({ email: searchValue, name: searchValue.split('@')[0] });
                  setSearchValue('');
              }
            }
          }}
        />
        {searchValue && filteredEmployees.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white border border-[#EEEEEE] rounded-lg shadow-lg mt-1 z-50">
            {filteredEmployees.map((emp: any) => (
              <div 
                key={emp.id} 
                className="px-4 py-2 hover:bg-[#F7F7F7] cursor-pointer flex items-center gap-2"
                onClick={() => {
                  onAddAttendee({ email: emp.email, name: emp.name });
                  setSearchValue('');
                }}
              >
                <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px]">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">{emp.name}</div>
                  <div className="text-[11px] text-[#666666]">{emp.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}