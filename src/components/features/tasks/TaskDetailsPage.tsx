'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTask } from '@/hooks/useTask';
import { Button, Tag, Divider, Tooltip } from 'antd';
import { CheckCircle2, Loader2, AlertCircle, Clock, Calendar, User, Briefcase, FileText, Eye, XCircle, Ban } from 'lucide-react';

// Normalize backend status to match backend enum
const normalizeBackendStatus = (status: string): 'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck' => {
    if (!status) return 'Assigned';
    const normalizedStatus = status.replace(/\s+/g, '_');
    const validStatuses: Array<'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck'> = 
        ['Assigned', 'In_Progress', 'Completed', 'Delayed', 'Impediment', 'Review', 'Stuck'];
    const matchedStatus = validStatuses.find(s => s === normalizedStatus || s.toLowerCase() === normalizedStatus.toLowerCase());
    return matchedStatus || 'Assigned';
};

export function TaskDetailsPage() {
    const params = useParams();
    const taskId = params.taskId as string;
    const router = useRouter();
    const { data: taskData, isLoading } = useTask(parseInt(taskId || '0'));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-[#999999]">Loading task...</p>
            </div>
        );
    }

    const backendTask = taskData?.result;
    if (!backendTask) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-xl font-semibold mb-2">Task not found</h2>
                <Button onClick={() => router.push('/dashboard/tasks')}>Back to Tasks</Button>
            </div>
        );
    }

    // Transform backend data to UI format
    const assignedToName =
        (backendTask as any).member_user?.name ||
        (backendTask.assigned_to as any)?.name ||
        'Unassigned';

    const detailedTaskProject =
        (backendTask as any).requirement?.name
            ? (backendTask as any).requirement.name
            : backendTask.requirement_id
                ? `Requirement ${backendTask.requirement_id}`
                : 'General';

    const estTime = (backendTask as any).estimated_time || 0;
    const timeSpent = (backendTask as any).time_spent || 0;
    const isOverEstimate = estTime > 0 && timeSpent > estTime;

    const baseStatus = normalizeBackendStatus(backendTask.status || '');
    // If task is delayed by time but status is not already Delayed/Impediment/Stuck, mark as Delayed
    const effectiveStatus: 'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck' =
        baseStatus === 'Completed'
            ? 'Completed'
            : isOverEstimate && !['Delayed', 'Impediment', 'Stuck'].includes(baseStatus)
                ? 'Delayed'
                : baseStatus;

    const task = {
        id: String(backendTask.id),
        name: (backendTask as any).name || backendTask.title || '',
        taskId: String(backendTask.id),
        client: (backendTask as any).client?.name || (backendTask as any).client_company_name || 'In-House',
        project: detailedTaskProject,
        leader: (backendTask as any).leader_user?.name || (backendTask as any).leader?.name || 'Unassigned',
        assignedTo: assignedToName,
        startDate: (backendTask as any).start_date ? new Date((backendTask as any).start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        dueDate: (backendTask as any).due_date ? new Date((backendTask as any).due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        estTime,
        timeSpent,
        activities: backendTask.worklogs?.length || 0,
        status: effectiveStatus,
        priority: (typeof backendTask.priority === 'string' ? backendTask.priority.toLowerCase() : 'medium') as 'high' | 'medium' | 'low',
    };

    const getStatusConfig = (status: string) => {
        // Match backend statuses with icons and colors from old frontend
        switch (status) {
            case 'Assigned': 
                return { icon: Clock, color: 'text-[#0284c7]', bg: 'bg-[#f0f9ff]', border: 'border-[#0284c7]', label: 'Assigned' };
            case 'In_Progress': 
                return { icon: Loader2, color: 'text-[#0284c7]', bg: 'bg-[#f0f9ff]', border: 'border-[#0284c7]', label: 'In Progress' };
            case 'Completed': 
                return { icon: CheckCircle2, color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]', border: 'border-[#16a34a]', label: 'Completed' };
            case 'Delayed': 
                return { icon: AlertCircle, color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]', border: 'border-[#dc2626]', label: 'Delayed' };
            case 'Impediment': 
                return { icon: XCircle, color: 'text-[#9e36ff]', bg: 'bg-[#f5ebff]', border: 'border-[#9e36ff]', label: 'Impediment' };
            case 'Review': 
                return { icon: Eye, color: 'text-[#fbbf24]', bg: 'bg-[#fffbeb]', border: 'border-[#fbbf24]', label: 'Review' };
            case 'Stuck': 
                return { icon: Ban, color: 'text-[#9e36ff]', bg: 'bg-[#f5ebff]', border: 'border-[#9e36ff]', label: 'Stuck' };
            default: 
                return { icon: Clock, color: 'text-[#0284c7]', bg: 'bg-[#f0f9ff]', border: 'border-[#0284c7]', label: 'Assigned' };
        }
    };

    const statusConfig = getStatusConfig(task.status);
    const StatusIcon = statusConfig.icon;
    const progress = task.estTime > 0 ? (task.timeSpent / task.estTime) * 100 : 0;
    const formatHours = (hours: number | string | null | undefined) =>
        Number(Number(hours || 0).toFixed(1));
    const overtimeHours = isOverEstimate ? timeSpent - estTime : 0;
    // For delayed tasks, cap percentage at 100% and show overtime separately
    const displayProgress = isOverEstimate ? 100 : Math.round(progress);
    const progressLabel = isOverEstimate
        ? `100% of estimate`
        : `${displayProgress}% Complete`;
    // Show colors matching old frontend
    const progressBarColor = isOverEstimate
        ? 'bg-[#dc2626]'  // Red for tasks with overtime (matches old frontend)
        : task.status === 'Completed'
            ? 'bg-[#16a34a]'  // Green for completed tasks without overtime (matches old frontend)
            : task.status === 'Delayed' || task.status === 'Impediment' || task.status === 'Stuck'
                ? 'bg-[#dc2626]'  // Red for delayed/impediment/stuck (matches old frontend)
                : task.status === 'Review'
                    ? 'bg-[#fbbf24]'  // Yellow/Orange for review (matches old frontend)
                    : 'bg-[#0284c7]';  // Blue for Assigned/In_Progress (matches old frontend)

    return (
        <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button type="text" onClick={() => router.push('/dashboard/tasks')} className="pl-0 hover:bg-transparent hover:text-[#ff3b3b]">
                    ← Back to Tasks
                </Button>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-[#EEEEEE] p-8 max-w-4xl mx-auto w-full">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-[#999999]">#{task.taskId}</span>
                            <Tag className={`
                            ${task.priority === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                                    task.priority === 'medium' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                        'text-blue-600 border-blue-200 bg-blue-50'}
                        `}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </Tag>
                        </div>
                        <h1 className="text-3xl font-['Manrope:Bold',sans-serif] text-[#111111] mb-2 leading-tight">
                            {task.name}
                        </h1>
                        <div className="flex items-center gap-2 text-[#666666]">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-sm font-['Manrope:Medium',sans-serif]">
                                {task.client} • {task.project}
                            </span>
                        </div>
                    </div>
                </div>

                <Divider className="my-8" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Description</h3>
                            <p className="text-[#111111] leading-relaxed">
                                {backendTask.description || 'No description provided for this task yet.'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Progress</h3>
                            <div className="bg-[#F7F7F7] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${isOverEstimate ? 'text-[#EB5757]' : 'text-[#111111]'}`}>
                                        {progressLabel}
                                    </span>
                                    <span className="text-sm text-[#666666]">
                                        {formatHours(task.timeSpent)}h of {formatHours(task.estTime)}h
                                        {isOverEstimate && (
                                            <span className="ml-1 text-[#EB5757] font-['Manrope:Medium',sans-serif]">
                                                (+{formatHours(overtimeHours)}h overtime)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-[#EEEEEE] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${progressBarColor}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="p-5 border border-[#EEEEEE] rounded-xl space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-[#999999] mt-0.5" />
                                <div>
                                    <p className="text-xs text-[#999999] mb-1 m-0">Assigned To</p>
                                    <div className="flex items-center gap-2">
                                        <Tooltip title={task.assignedTo}>
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center text-white text-[10px] font-bold">
                                                {task.assignedTo.charAt(0)}
                                            </div>
                                        </Tooltip>
                                        <p className="text-sm font-medium text-[#111111] m-0">{task.assignedTo}</p>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-2" />

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-[#999999] mt-0.5" />
                                <div>
                                    <p className="text-xs text-[#999999] mb-1 m-0">Due Date</p>
                                    <p className="text-sm font-medium text-[#111111] m-0">{task.dueDate}</p>
                                </div>
                            </div>

                            <Divider className="my-2" />

                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-[#999999] mt-0.5" />
                                <div>
                                    <p className="text-xs text-[#999999] mb-1 m-0">Project</p>
                                    <p className="text-sm font-medium text-[#111111] m-0">{task.project}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}