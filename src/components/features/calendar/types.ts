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
    raw?: any;
    endDate?: string;
}

export type ViewType = 'month' | 'week' | 'day' | 'agenda';
