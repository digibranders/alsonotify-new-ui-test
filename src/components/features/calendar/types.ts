import { MeetingType } from '@/services/meeting';
import { LeaveType } from '@/services/leave';
import { GraphEvent } from '@/services/calendar';
import { TaskType } from '@/services/task';
import { Holiday } from '@/types/domain';

export interface CalendarEvent {
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
    raw?: MeetingType | LeaveType | GraphEvent | TaskType | Holiday | unknown;
    endDate?: string;
    startDateTime?: any; // dayjs.Dayjs - keep as is or import dayjs
}

export type ViewType = 'month' | 'week' | 'day';
