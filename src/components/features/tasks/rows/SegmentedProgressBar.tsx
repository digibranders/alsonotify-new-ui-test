import React from 'react';
import { Tooltip } from 'antd';

interface Member {
    id: number;
    user: { name: string };
    estimated_time: number | null;
    seconds_spent: number; // LIVE seconds (calculated in parent)
    status: string; // Member status or Task status context?
    // Ideally, we might need task-level status to know if "Blocked/Delayed" applies to everyone?
    // User says: "Red... If Task is Blocked/Delayed OR if that specific member is over..."
    // So we might need a prop `isTaskBlocked`?
}

interface SegmentedProgressBarProps {
    members: Member[];
    totalEstimate: number; // In hours (from Task)
    taskStatus: string; // To check Blocked/Delayed top-level
}

export function SegmentedProgressBar({ members, totalEstimate, taskStatus }: SegmentedProgressBarProps) {
    if (!totalEstimate || totalEstimate <= 0) {
        // If no total estimate, maybe show a generic bar or nothing?
        // User: "Width: (member.est / task.total) * 100". Undefined if total=0.
        // If total=0, we can't segment by estimate.
        return (
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden" />
        );
    }

    // Helper to determine color
    const getSegmentColor = (member: Member, ratio: number) => {
        // 1. Red: Task Blocked/Delayed OR Member Overtime
        const isOvertime = ratio > 1; // spent > est
        const isTaskProblematic = ['Impediment', 'Stuck', 'Delayed'].includes(taskStatus);

        if (isTaskProblematic || isOvertime) {
            return 'bg-[#ff3b3b]'; // Red
        }

        // 2. Green: Completed
        if (member.status === 'Completed') {
            return 'bg-[#16a34a]'; // Green (Google Greenish) or #0F9D58
        }

        // 3. Blue: In Progress (Started work or status In_Progress)
        if (member.status === 'In_Progress' || member.seconds_spent > 0) {
            return 'bg-[#2F80ED]'; // Blue
        }

        // 4. Gray: Not started
        return 'bg-[#E0E0E0]';
    };

    const segments = members.map((member) => {
        const est = member.estimated_time || 0;
        const spent = member.seconds_spent / 3600; // hours

        const widthPercent = (est / totalEstimate) * 100;

        // Progress ratio for overlay (capped at 100% physically, but color handles 'over')
        const progressRatio = est > 0 ? spent / est : 0;
        const overlayPercent = Math.min(progressRatio * 100, 100);

        const colorClass = getSegmentColor(member, progressRatio);

        return {
            ...member,
            widthPercent,
            colorClass,
            overlayPercent,
            spentHours: spent
        };
    });

    return (
        <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-[#E5E5E5]">
            {segments.map((seg, idx) => (
                <Tooltip
                    key={seg.id || idx}
                    title={`${seg.user.name} | ${seg.status} | ${seg.spentHours.toFixed(1)}h of ${seg.estimated_time ?? 0}h`}
                >
                    <div
                        className="h-full bg-[#E5E5E5] relative first:rounded-l-full last:rounded-r-full border-r border-white/50 last:border-0"
                        style={{ width: `${seg.widthPercent}%` }}
                    >
                        {/* Colored Progress Fill - only the spent portion gets color */}
                        {seg.overlayPercent > 0 && (
                            <div
                                className={`h-full ${seg.colorClass} absolute left-0 top-0 first:rounded-l-full`}
                                style={{ width: `${seg.overlayPercent}%` }}
                            />
                        )}
                    </div>
                </Tooltip>
            ))}
        </div>
    );
}
