import svgPaths from "../../constants/iconPaths";
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon, Clock, Plus, ExternalLink, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Modal, Input, Button, Select, DatePicker, Spin, Tag, Popover, App } from 'antd';
import { Skeleton } from '../ui/Skeleton';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useEmployees, useCurrentUserCompany } from '@/hooks/useUser';
import { useTeamsConnectionStatus, useCalendarEvents } from '../../hooks/useCalendar';
import { MicrosoftUserOAuth, GraphEvent, createCalendarEvent, CreateEventPayload } from '../../services/calendar';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';

dayjs.extend(utc);
dayjs.extend(timezone);

const { TextArea } = Input;
const { Option } = Select;

interface Attendee {
  email: string;
  name?: string;
}

export function MeetingsWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch employees for autocomplete (only when modal is open)
  const { data: employeesData } = useEmployees(showDialog ? 'limit=100' : '');

  const [formData, setFormData] = useState({
    title: '',
    startDateTime: null as dayjs.Dayjs | null,
    duration: '',
    customTime: '',
    attendees: [] as Attendee[],
    description: ''
  });

  // Fetch Teams connection status
  const { data: teamsStatus, isLoading: isLoadingTeamsStatus, refetch: refetchTeamsStatus } = useTeamsConnectionStatus();
  const isConnected = teamsStatus?.result?.connected ?? false;

  // Get company timezone from backend, fallback to browser timezone
  const { data: companyData } = useCurrentUserCompany();
  const companyTimeZone = companyData?.result?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Fetch calendar events (meetings) from backend
  const startISO = dayjs().startOf("day").toISOString();
  const endISO = dayjs().add(7, "day").endOf("day").toISOString();
  const { data: eventsData, isLoading, error, isError, refetch: refetchCalendarEvents } = useCalendarEvents(startISO, endISO);

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

  // Check connection status on mount
  useEffect(() => {
    refetchTeamsStatus();
  }, [refetchTeamsStatus]);

  // Periodically refresh meetings to remove ended meetings in real-time
  useEffect(() => {
    if (!isConnected) return;

    // Refresh every minute to check for ended meetings
    const interval = setInterval(() => {
      refetchCalendarEvents();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isConnected, refetchCalendarEvents]);

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
      setShowDialog(false);
      setFormData({
        title: '',
        startDateTime: null,
        duration: '',
        customTime: '',
        attendees: [],
        description: ''
      });

      // Invalidate and refetch calendar events to show the new event
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.eventsRoot() });
      await refetchCalendarEvents();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create event";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [formData, companyTimeZone, refetchCalendarEvents, queryClient]);

  // Transform and filter meetings
  const processedMeetings = useMemo(() => {
    if (!eventsData?.result) return [];

    const now = dayjs().tz(companyTimeZone);

    // Filter meetings that haven't ended yet (show until meeting end time)
    // Parse event times properly - they come in ISO format and may be in UTC
    const upcoming = (eventsData.result as GraphEvent[])
      .filter((event: GraphEvent) => {
        if (event.isCancelled) return false;

        // Parse end time - event.end.dateTime is in ISO format
        // Convert to company timezone for proper comparison
        const endTime = dayjs.utc(event.end.dateTime).tz(companyTimeZone);

        // Show meeting if current time is before the meeting end time
        // This means meetings will be shown until they end (including in-progress meetings)
        // Use 'minute' precision to avoid microsecond comparison issues
        const shouldShow = now.isBefore(endTime, 'minute') || now.isSame(endTime, 'minute');

        return shouldShow;
      })
      .sort((a: GraphEvent, b: GraphEvent) =>
        dayjs.utc(a.start.dateTime).tz(companyTimeZone).valueOf() - dayjs.utc(b.start.dateTime).tz(companyTimeZone).valueOf()
      )
      .slice(0, 3) // Show only first 3 meetings (upcoming or in-progress)
      .map((event: GraphEvent) => {
        // Parse times with timezone awareness - convert to company timezone
        const startTime = dayjs.utc(event.start.dateTime).tz(companyTimeZone);
        const endTime = dayjs.utc(event.end.dateTime).tz(companyTimeZone);
        const durationMinutes = endTime.diff(startTime, 'minute');

        // Format duration
        let duration = '';
        if (durationMinutes < 60) {
          duration = `${durationMinutes} mins`;
        } else if (durationMinutes === 60) {
          duration = '1 hour';
        } else {
          const hours = Math.floor(durationMinutes / 60);
          const mins = durationMinutes % 60;
          duration = mins > 0 ? `${hours}.${Math.round(mins / 60 * 10)} hours` : `${hours} hour${hours > 1 ? 's' : ''}`;
        }

        // Get attendees from event attendees
        const attendees = (event.attendees || []).slice(0, 3).map((attendee: { emailAddress?: { name?: string; address?: string } }) => ({
          name: attendee?.emailAddress?.name || attendee?.emailAddress?.address?.split('@')[0] || 'Unknown',
          avatar: '' // GraphEvent doesn't have avatar, use empty string
        }));

        // Determine status - use company timezone for now
        const nowTz = dayjs().tz(companyTimeZone);
        const isInProgress = nowTz.isAfter(startTime) && nowTz.isBefore(endTime);
        const status = isInProgress ? 'in-progress' : 'upcoming';

        // Get platform from onlineMeeting
        // Priority: 1. onlineMeetingProvider, 2. Check joinUrl/onlineMeetingUrl for platform indicators
        let platform = 'Teams'; // Default to Teams for Microsoft Graph API events
        if (event.isOnlineMeeting) {
          // Check onlineMeetingProvider first (most reliable)
          if (event.onlineMeetingProvider === 'teamsForBusiness') {
            platform = 'Teams';
          } else {
            // Check URLs for platform indicators
            const joinUrl = event.onlineMeeting?.joinUrl || event.onlineMeetingUrl || '';
            const urlLower = joinUrl.toLowerCase();

            if (urlLower.includes('teams.microsoft.com') || urlLower.includes('teams.live.com') || urlLower.includes('/meetup-join/')) {
              platform = 'Teams';
            } else if (urlLower.includes('zoom.us') || urlLower.includes('zoom.com')) {
              platform = 'Zoom';
            } else if (urlLower.includes('meet.google.com') || urlLower.includes('google.com/meet')) {
              platform = 'Meet';
            } else if (event.onlineMeetingProvider) {
              // If provider is set but not teamsForBusiness, default to Teams for Microsoft Graph
              platform = 'Teams';
            }
            // If no indicators found and isOnlineMeeting is true, default to Teams (Microsoft Graph API)
          }
        }

        // Get organizer
        const organizer = event.organizer?.emailAddress?.name || event.organizer?.emailAddress?.address?.split('@')[0] || 'Unknown';

        // Get join URL for the meeting
        const joinUrl = event.onlineMeeting?.joinUrl || event.onlineMeetingUrl || event.webLink || null;

        // Get full attendees list for details modal
        const allAttendees = (event.attendees || []).map((attendee: { emailAddress?: { name?: string; address?: string } }) => ({
          name: attendee?.emailAddress?.name || attendee?.emailAddress?.address?.split('@')[0] || 'Unknown',
          email: attendee?.emailAddress?.address || '',
          avatar: ''
        }));

        return {
          id: event.id,
          title: event.subject || 'Untitled Meeting',
          time: startTime.format('h:mm A'),
          duration: duration,
          date: {
            month: startTime.format('MMM').toUpperCase(),
            day: startTime.date()
          },
          attendees: attendees,
          totalAttendees: event.attendees?.length || 0,
          status: status,
          platform: platform,
          organizer: organizer,
          joinUrl: joinUrl,
          allAttendees: allAttendees,
          description: event.body?.content || null,
          startDateTime: startTime.toISOString(),
          endDateTime: endTime.toISOString()
        };
      });

    return upcoming;
  }, [eventsData, companyTimeZone]);

  return (
    <>
      <div className="bg-white rounded-[24px] p-5 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Meetings</h3>
            <button onClick={() => setShowDialog(true)} className="hover:scale-110 active:scale-95 transition-transform">
              <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-[#666666] text-[14px] font-['Manrope:SemiBold',sans-serif] hover:text-[#111111] transition-colors" onClick={() => onNavigate && onNavigate('calendar')}>
              <span>View All</span>
              <svg className="size-[17px]" fill="none" viewBox="0 0 17 17">
                <path d={svgPaths.p3ac7a560} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meetings List */}
        <div className="flex flex-col gap-2.5 flex-1 mt-2 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col p-3 rounded-[16px] border border-gray-100 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-2">
                       <Skeleton className="h-4 w-32 rounded-md" />
                       <div className="flex items-center gap-2">
                         <Skeleton className="h-3 w-16 rounded-md" />
                         <Skeleton className="h-3 w-12 rounded-md" />
                       </div>
                    </div>
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex -space-x-2">
                      <Skeleton className="w-6 h-6 rounded-full border-2 border-white" />
                      <Skeleton className="w-6 h-6 rounded-full border-2 border-white" />
                      <Skeleton className="w-6 h-6 rounded-full border-2 border-white" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError && !eventsData ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                Unable to load meetings at the moment. Please connect to Teams.
              </p>
            </div>
          ) : processedMeetings.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-dashed border-[#CCCCCC] py-4 flex items-center justify-center">
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#888888]">No upcoming meetings</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {processedMeetings.map((meeting) => (
                <MeetingItem
                  key={meeting.id}
                  {...meeting}
                  onJoin={(joinUrl) => {
                    if (joinUrl) {
                      window.open(joinUrl, '_blank');
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal
        title={null}
        open={showDialog}
        onCancel={() => {
          setShowDialog(false);
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
                    setShowDialog(false);
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
    </>
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
  employeesData: { result?: Array<{ email?: string; name?: string }> } | undefined;
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
    const filtered = employees.filter((emp: { email?: string; name?: string }) => {
      const email = (emp.email || '').toLowerCase();
      const name = (emp.name || '').toLowerCase();
      // Check if already selected
      const isSelected = attendees.some(a => a.email.toLowerCase() === email);
      return !isSelected && (email.includes(query) || name.includes(query));
    });

    // Also check if input is a valid email format and not already in attendees
    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
    const isAlreadyAdded = attendees.some(a => a.email.toLowerCase() === inputValue.toLowerCase());

    if (isEmailFormat && !isAlreadyAdded && !filtered.some((emp: { email?: string }) => emp.email?.toLowerCase() === inputValue.toLowerCase())) {
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

  const handleSelectSuggestion = (suggestion: { email?: string; name?: string }) => {
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
            {suggestions.map((suggestion: { email?: string; name?: string }, idx: number) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${idx === selectedIndex
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

function MeetingItem({
  title,
  time,
  duration,
  date,
  attendees,
  totalAttendees,
  platform,
  organizer,
  joinUrl,
  allAttendees = [],
  description,
  startDateTime,
  endDateTime,
  onJoin
}: {
  title: string;
  time: string;
  duration: string;
  date: { month: string; day: number };
  attendees: { name: string; avatar: string | null }[];
  totalAttendees: number;
  platform: string;
  organizer: string;
  joinUrl?: string | null;
  allAttendees?: Array<{ name: string; email: string; avatar: string }>;
  description?: string | null;
  startDateTime?: string;
  endDateTime?: string;
  onJoin?: (joinUrl: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Strip HTML tags from description
  const stripHtml = (html: string | null): string => {
    if (!html) return '';
    if (typeof document === 'undefined') {
      // SSR fallback - simple regex strip
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (joinUrl && onJoin) {
      onJoin(joinUrl);
    }
  };

  const handleCardClick = () => {
    setShowDetails(true);
  };
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Truncate organizer name to 12 characters (to fit before attendees section)
  const truncateOrganizer = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + '...';
  };

  // Truncate meeting title to 27 characters (to align with red line position)
  const truncateTitle = (title: string, maxLength: number = 36) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  };

  // Platform colors
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'teams':
        return { bg: '#E3F2FD', text: '#1565C0' };
      case 'zoom':
        return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'meet':
        return { bg: '#FFF3E0', text: '#E65100' };
      default:
        return { bg: '#F7F7F7', text: '#666666' };
    }
  };

  const platformColor = getPlatformColor(platform);
  const today = dayjs();
  // Check if the meeting date matches today
  const isToday = today.date() === date.day && today.format('MMM').toUpperCase() === date.month;
  const isRedDate = isToday; // Red for today's date, grey for future

  return (
    <>
      <Popover
        open={showDetails}
        onOpenChange={setShowDetails}
        trigger="click"
        placement="right"
        overlayInnerStyle={{ padding: 0 }}
        content={
          <div className="w-[300px] bg-white rounded-[12px] shadow-lg border border-[#EEEEEE] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-[#FAFAFA] border-b border-[#EEEEEE]">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-1.5 line-clamp-2 leading-tight">
                {title}
              </h4>
              <div className="flex items-center gap-1.5 text-[#666666] text-[11px] font-['Manrope:Regular',sans-serif]">
                <Clock className="size-3" strokeWidth={2} />
                <span>{time}</span>
                <span className="text-[#CCCCCC]">•</span>
                {/* <span>{duration}</span> */}
              </div>
            </div>

            {/* Content - Compact & Clean */}
            <div className="px-4 py-3 space-y-2.5 bg-white">
              {/* Host */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] uppercase tracking-wide min-w-[45px]">Host</span>
                <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#111111]">{organizer}</span>
              </div>

              {/* Date & Time */}
              {startDateTime && endDateTime && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] uppercase tracking-wide min-w-[45px]">When</span>
                  <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#111111]">
                    {dayjs(startDateTime).format('MMM D, YYYY')} • {time} - {dayjs(endDateTime).format('h:mm A')}
                  </span>
                </div>
              )}

              {/* Attendees - Compact */}
              {allAttendees && allAttendees.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] uppercase tracking-wide min-w-[45px] pt-0.5">With</span>
                  <div className="flex-1">
                    <div className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#111111] leading-relaxed">
                      {allAttendees.slice(0, 3).map((a, i) => a.name).join(', ')}
                      {allAttendees.length > 3 && (
                        <span className="text-[#999999]"> +{allAttendees.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Join Button */}
            {joinUrl && (
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#EEEEEE]">
                <Button
                  type="primary"
                  onClick={() => {
                    if (joinUrl && onJoin) {
                      onJoin(joinUrl);
                    }
                    setShowDetails(false);
                  }}
                  className="w-full h-9 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all active:scale-95 border-none flex items-center justify-center gap-2 shadow-sm"
                  icon={<Video className="w-3.5 h-3.5" />}
                >
                  Join {platform} Meeting
                </Button>
              </div>
            )}
          </div>
        }
      >
        <div
          className="group p-3 rounded-xl border border-[#EEEEEE] hover:border-[#ff3b3b]/20 transition-all duration-300 hover:shadow-lg cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-start gap-2.5">
            {/* Date Badge - Rounded Square */}
            <div className="flex-shrink-0">
              <div className={`w-[48px] h-[48px] rounded-[12px] flex flex-col items-center justify-center ${isRedDate
                ? 'bg-[#ff3b3b]'
                : 'bg-[#E5E5E5]'
                }`}>
                <span className={`text-[10px] font-['Manrope:Medium',sans-serif] uppercase leading-none mb-0.5 ${isRedDate ? 'text-white' : 'text-[#666666]'
                  }`}>
                  {date.month}
                </span>
                <span className={`text-[20px] font-['Manrope:Bold',sans-serif] leading-none ${isRedDate ? 'text-white' : 'text-[#111111]'
                  }`}>
                  {date.day}
                </span>
              </div>
            </div>

            {/* Meeting Info */}
            <div className="flex-1 min-w-0">
              {/* Title & Platform Tag */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] line-clamp-1 flex-1">
                  {truncateTitle(title)}
                </h4>
                {joinUrl ? (
                  <button
                    onClick={handleJoinClick}
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-['Manrope:Medium',sans-serif] flex-shrink-0 flex items-center gap-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ backgroundColor: platformColor.bg, color: platformColor.text }}
                    title={`Join ${platform} meeting`}
                  >
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    {platform}
                  </button>
                ) : (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-['Manrope:Medium',sans-serif] flex-shrink-0 flex items-center gap-0.5"
                    style={{ backgroundColor: platformColor.bg, color: platformColor.text }}
                  >
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    {platform}
                  </span>
                )}
              </div>

              {/* Time, Duration, Host & Attendees - All in one line */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[#666666] text-[11px] font-['Manrope:Regular',sans-serif]">
                    <Clock className="size-3.5" strokeWidth={2} />
                    <span>{time}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#CCCCCC]" />
                  <span className="text-[#666666] text-[11px] font-['Manrope:Regular',sans-serif]">Host: {truncateOrganizer(organizer)}</span>
                </div>

                {/* Attendees - Aligned to the right on same line */}
                <div className="flex items-center -space-x-2 flex-shrink-0">
                  {attendees.slice(0, 3).map((attendee, index) => {
                    const initials = getInitials(attendee.name);
                    return (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm relative z-[5] hover:z-10 transition-all"
                      >
                        <span className="text-[9px] text-white font-['Manrope:Bold',sans-serif]">{initials}</span>
                      </div>
                    );
                  })}
                  {totalAttendees > attendees.length && (
                    <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm relative z-[1] ${isRedDate ? 'bg-[#ff3b3b]' : 'bg-[#E5E5E5]'
                      }`}>
                      <span className={`text-[9px] font-['Manrope:SemiBold',sans-serif] ${isRedDate ? 'text-white' : 'text-[#666666]'
                        }`}>
                        +{totalAttendees - attendees.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popover>
    </>
  );
}