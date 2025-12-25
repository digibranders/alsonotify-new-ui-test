
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface DateRangeSelectorProps {
    value: [Dayjs | null, Dayjs | null] | null;
    onChange: (range: [Dayjs | null, Dayjs | null] | null) => void;
    defaultRangeType?: string;
    className?: string;
    availablePresets?: string[];
}

export function DateRangeSelector({
    value,
    onChange,
    defaultRangeType = 'this_month',
    className = '',
    availablePresets
}: DateRangeSelectorProps) {
    const [selectedRangeType, setSelectedRangeType] = useState<string>(defaultRangeType);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Internal state for manual selection in calendar
    const [startDate, setStartDate] = useState<Dayjs | null>(value?.[0] || null);
    const [endDate, setEndDate] = useState<Dayjs | null>(value?.[1] || null);
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

    const dropdownRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Sync internal state with props when value changes externally (and not in custom mode)
    useEffect(() => {
        if (value && value[0]) {
            // If we are not in custom mode, we might want to infer range type or just keep as is
            // For now, just sync start/end dates for calendar
            setStartDate(value[0]);
            setEndDate(value[1]);
            if (value[0]) setCurrentMonth(value[0]);
        }
    }, [value]);

    // Handle Range Type Selection
    const handleRangeTypeChange = (type: string) => {
        setSelectedRangeType(type);
        setIsDropdownOpen(false);

        if (type === 'custom') {
            setCalendarOpen(true);
            // Initialize calendar with current selection
            if (value && value[0] && value[1]) {
                setStartDate(value[0]);
                setEndDate(value[1]);
                setCurrentMonth(value[0]);
            } else {
                setStartDate(null);
                setEndDate(null);
                setCurrentMonth(dayjs());
            }
            return;
        }

        setCalendarOpen(false);
        const now = dayjs();
        let newRange: [Dayjs, Dayjs] | null = null;

        switch (type) {
            case 'today':
                newRange = [now.startOf('day'), now.endOf('day')];
                break;
            case 'yesterday':
                const yesterday = now.subtract(1, 'day');
                newRange = [yesterday.startOf('day'), yesterday.endOf('day')];
                break;
            case 'this_week':
                newRange = [now.startOf('isoWeek'), now.endOf('isoWeek')];
                break;
            case 'this_month':
                newRange = [now.startOf('month'), now.endOf('month')];
                break;
            case 'last_month':
                const lastMonth = now.subtract(1, 'month');
                newRange = [lastMonth.startOf('month'), lastMonth.endOf('month')];
                break;
            case 'last_90_days':
                newRange = [now.subtract(90, 'day').startOf('day'), now.endOf('day')];
                break;
            case 'this_year':
                newRange = [now.startOf('year'), now.endOf('year')];
                break;
            case 'all_time':
                newRange = null; // Represents All Time
                break;
            default:
                newRange = null;
        }

        onChange(newRange);
    };

    // Get display label
    const getRangeLabel = () => {
        if (selectedRangeType === 'custom') {
            if (value && value[0] && value[1]) {
                return `${value[0].format('MMM D')} - ${value[1].format('MMM D')}`;
            }
            return 'Custom';
        }
        switch (selectedRangeType) {
            case 'today': return 'Today';
            case 'yesterday': return 'Yesterday';
            case 'this_week': return 'This Week';
            case 'this_month': return 'This Month';
            case 'last_month': return 'Last Month';
            case 'last_90_days': return 'Last 90 Days';
            case 'this_year': return 'This Year';
            case 'all_time': return 'All Time';
            default: return 'Select Range';
        }
    };

    // Check highlighting
    const isDateInRange = (date: Dayjs) => {
        if (!startDate || !endDate) return false;
        const start = startDate.isBefore(endDate) ? startDate : endDate;
        const end = startDate.isBefore(endDate) ? endDate : startDate;
        return date.isAfter(start.startOf('day')) && date.isBefore(end.endOf('day'));
    };

    const isDateStartOrEnd = (date: Dayjs) => {
        if (!startDate) return false;
        if (!endDate) return date.isSame(startDate, 'day');
        return date.isSame(startDate, 'day') || date.isSame(endDate, 'day');
    };

    const getCalendarDays = () => {
        const start = currentMonth.startOf('month').startOf('week');
        const end = currentMonth.endOf('month').endOf('week');
        const days: Dayjs[] = [];
        let current = start;
        while (current.isSameOrBefore(end, 'day')) {
            days.push(current);
            current = current.add(1, 'day');
        }
        return days;
    };

    const handleDateClick = (date: Dayjs) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else if (startDate && !endDate) {
            let finalStart = startDate;
            let finalEnd = date;
            if (date.isBefore(startDate)) {
                finalStart = date;
                finalEnd = startDate;
            }
            setStartDate(finalStart);
            setEndDate(finalEnd);
            onChange([finalStart, finalEnd]);
            // Keep calendar open? Or close? Dashboard closes it.
            setCalendarOpen(false);
            setSelectedRangeType('custom');
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node) && !dropdownRef.current?.contains(event.target as Node)) {
                setCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-full hover:border-[#CCCCCC] transition-colors"
            >
                <span className="font-['Manrope:Regular',sans-serif] text-[14px] text-[#111111]">
                    {getRangeLabel()}
                </span>
                <ChevronDown className="w-4 h-4 text-[#111111]" />
            </button>

            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg z-50 min-w-[160px] overflow-hidden">
                    {[
                        { value: 'today', label: 'Today' },
                        { value: 'yesterday', label: 'Yesterday' },
                        { value: 'this_week', label: 'This Week' },
                        { value: 'this_month', label: 'This Month' },
                        { value: 'last_month', label: 'Last Month' },
                        { value: 'last_90_days', label: 'Last 90 Days' },
                        { value: 'this_year', label: 'This Year' },
                        { value: 'all_time', label: 'All Time' },
                        { value: 'custom', label: 'Custom' },
                    ]
                        .filter(option => !availablePresets || availablePresets.includes(option.value))
                        .map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleRangeTypeChange(option.value)}
                                className="w-full text-left px-3 py-2.5 font-['Manrope:Regular',sans-serif] text-[14px] text-[#111111] hover:bg-[#F7F7F7] transition-colors flex items-center justify-between"
                            >
                                <span>{option.label}</span>
                                {selectedRangeType === option.value && (
                                    <CheckSquare className="w-4 h-4 text-[#ff3b3b] flex-shrink-0" />
                                )}
                            </button>
                        ))}
                </div>
            )}

            {calendarOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg z-50 w-[280px] p-3" ref={calendarRef}>
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={() => {
                                setCalendarOpen(false);
                                setIsDropdownOpen(false);
                            }}
                            className="w-5 h-5 flex items-center justify-center hover:bg-[#F7F7F7] rounded transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 text-[#666666]" />
                        </button>
                        <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                            Select Range
                        </h4>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                            className="w-7 h-7 rounded-lg bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 text-[#111111]" />
                        </button>
                        <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                            {currentMonth.format('MMMM YYYY')}
                        </h4>
                        <button
                            onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                            className="w-7 h-7 rounded-lg bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5 text-[#111111]" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-center text-[11px] font-['Manrope:Regular',sans-serif] text-[#999999] py-0.5">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                        {getCalendarDays().map((date, index) => {
                            const isCurrentMonth = date.month() === currentMonth.month();
                            const isInRange = isDateInRange(date);
                            const isStartOrEnd = isDateStartOrEnd(date);

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleDateClick(date)}
                                    className={`
                    w-8 h-8 rounded-lg text-[12px] font-['Manrope:Regular',sans-serif] transition-colors
                    ${!isCurrentMonth ? 'text-[#CCCCCC]' : 'text-[#111111]'}
                    ${isStartOrEnd
                                            ? 'bg-[#111111] text-white'
                                            : isInRange
                                                ? 'bg-[#F7F7F7]'
                                                : 'hover:bg-[#F7F7F7]'
                                        }
                  `}
                                >
                                    {date.date()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
