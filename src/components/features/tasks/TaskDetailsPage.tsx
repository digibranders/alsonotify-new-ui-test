'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTask, useWorklogs } from '@/hooks/useTask';
import { Button, Tag, Divider, Tooltip } from 'antd';
import { CheckCircle2, Loader2, AlertCircle, Clock, Calendar, User, Briefcase, FileText, Eye, XCircle, Ban, Activity, ClipboardList } from 'lucide-react';

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
    const { data: worklogsData, isLoading: isLoadingWorklogs } = useWorklogs(parseInt(taskId || '0'), 50, 0);

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

    // Get workspace/project name - workspace and project are the same in backend
    const detailedTaskWorkspace =
        (backendTask as any).task_project?.name ||
        (backendTask as any).requirement?.name ||
        (backendTask.requirement_id
            ? `Requirement ${backendTask.requirement_id}`
            : 'General');

    // Get requirement name
    const requirementName =
        (backendTask as any).requirement?.name ||
        (backendTask.requirement_id
            ? `Requirement ${backendTask.requirement_id}`
            : 'No Requirement');

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

    // Determine company/client name: if client exists, it's client work, otherwise show company name for in-house
    // Client company comes from task_project.client_user.company.name
    const clientCompanyName = (backendTask as any).task_project?.client_user?.company?.name || 
                               (backendTask as any).client?.name || 
                               (backendTask as any).client_company_name || 
                               null;
    
    // For in-house tasks, get company name from task's company relation or project's company
    const inHouseCompanyName = (backendTask as any).company?.name || 
                                (backendTask as any).company_name || 
                                (backendTask as any).task_project?.company?.name ||
                                (backendTask as any).task_project?.company_name ||
                                null;
    
    // If there's a client company, it's client work; otherwise show in-house company name
    const displayCompanyName = clientCompanyName || inHouseCompanyName || 'In-House';

    const task = {
        id: String(backendTask.id),
        name: (backendTask as any).name || backendTask.title || '',
        taskId: String(backendTask.id),
        client: displayCompanyName,
        project: detailedTaskWorkspace,
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

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    <span className={`text-sm font-['Manrope:SemiBold',sans-serif] ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-[#EEEEEE] p-8 max-w-6xl mx-auto w-full">
                {/* Task Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-mono text-[#999999]">#{task.taskId}</span>
                            <Tag className={`
                                ${task.priority === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                                    task.priority === 'medium' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                        'text-blue-600 border-blue-200 bg-blue-50'}
                            `}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </Tag>
                        </div>
                        <h1 className="text-3xl font-['Manrope:Bold',sans-serif] text-[#111111] mb-3 leading-tight">
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

                <Divider className="my-6" />

                {/* Main Layout: Grid with better organization */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Description and Progress (8 columns) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Description Section - Scrollable for large content */}
                        <div className="border border-[#EEEEEE] rounded-xl p-6">
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Description</h3>
                            <div 
                                className="text-[#111111] leading-relaxed prose prose-sm max-w-none [&>p]:mb-3 [&>p]:last:mb-0 max-h-[400px] overflow-y-auto pr-2"
                                dangerouslySetInnerHTML={{ 
                                    __html: backendTask.description || '<p class="text-[#999999]">No description provided for this task yet.</p>' 
                                }}
                            />
                        </div>

                        {/* Progress Section */}
                        <div className="border border-[#EEEEEE] rounded-xl p-6">
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Progress</h3>
                            <div className="bg-[#F7F7F7] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
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
                                <div className="w-full h-2.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${progressBarColor}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Activity / Worklogs Section - Better organized */}
                        <div className="border border-[#EEEEEE] rounded-xl p-6">
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Activity / Worklogs</h3>
                            {isLoadingWorklogs ? (
                                <div className="bg-[#F7F7F7] rounded-lg p-6 text-center">
                                    <p className="text-[#999999] text-sm">Loading activities...</p>
                                </div>
                            ) : worklogsData?.result && worklogsData.result.length > 0 ? (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {worklogsData.result.map((worklog: any, index: number) => {
                                        // Calculate duration
                                        let duration = '';
                                        if (worklog.time_in_seconds) {
                                            const hours = Math.floor(worklog.time_in_seconds / 3600);
                                            const minutes = Math.floor((worklog.time_in_seconds % 3600) / 60);
                                            if (hours > 0) {
                                                duration = `${hours}h ${minutes}m`;
                                            } else {
                                                duration = `${minutes}m`;
                                            }
                                        } else if (worklog.hours) {
                                            const hours = Math.floor(worklog.hours);
                                            const minutes = Math.floor((worklog.hours - hours) * 60);
                                            if (hours > 0) {
                                                duration = `${hours}h ${minutes}m`;
                                            } else {
                                                duration = `${minutes}m`;
                                            }
                                        } else if (worklog.start_datetime && worklog.end_datetime) {
                                            const start = new Date(worklog.start_datetime);
                                            const end = new Date(worklog.end_datetime);
                                            const diffMs = end.getTime() - start.getTime();
                                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                            if (diffHours > 0) {
                                                duration = `${diffHours}h ${diffMinutes}m`;
                                            } else {
                                                duration = `${diffMinutes}m`;
                                            }
                                        }

                                        // Format date - separate date and time
                                        const worklogDate = worklog.date || worklog.start_datetime || worklog.created_at;
                                        let dateStr = '';
                                        let timeStr = '';
                                        if (worklogDate) {
                                            const date = new Date(worklogDate);
                                            dateStr = date.toLocaleDateString('en-GB', { 
                                                day: '2-digit', 
                                                month: 'short', 
                                                year: 'numeric'
                                            });
                                            timeStr = date.toLocaleTimeString('en-GB', { 
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                        }

                                        return (
                                            <div key={worklog.id} className="flex gap-4 pb-4 border-b border-[#EEEEEE] last:border-0 last:pb-0">
                                                {/* Timeline indicator */}
                                                <div className="flex flex-col items-center flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
                                                        <Activity className="w-4 h-4 text-white" />
                                                    </div>
                                                    {index < worklogsData.result.length - 1 && (
                                                        <div className="w-0.5 h-full bg-[#EEEEEE] mt-2 flex-1 min-h-[40px]" />
                                                    )}
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pb-2">
                                                    {/* Header: Date, Time, Duration */}
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        {dateStr && (
                                                            <span className="text-[12px] text-[#666666] font-['Manrope:SemiBold',sans-serif]">
                                                                {dateStr}
                                                            </span>
                                                        )}
                                                        {timeStr && (
                                                            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                                                                {timeStr}
                                                            </span>
                                                        )}
                                                        {duration && (
                                                            <span className="px-2.5 py-1 rounded-full bg-[#FEF3F2] border border-[#FECACA] text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#ff3b3b]">
                                                                {duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Description - Handles large text */}
                                                    {worklog.description ? (
                                                        <div className="text-[13px] text-[#111111] font-['Manrope:Regular',sans-serif] leading-relaxed break-words">
                                                            {worklog.description}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[13px] text-[#999999] font-['Manrope:Regular',sans-serif] italic">
                                                            No description provided
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-[#F7F7F7] rounded-lg p-6 text-center">
                                    <p className="text-[#999999] text-sm">No worklogs or activities recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar: Task Metadata (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="border border-[#EEEEEE] rounded-xl p-5 space-y-4 sticky top-6">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-[#999999] mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#999999] mb-1.5 m-0 font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide">Assigned To</p>
                                    <div className="flex items-center gap-2">
                                        <Tooltip title={task.assignedTo}>
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                                                {task.assignedTo.charAt(0)}
                                            </div>
                                        </Tooltip>
                                        <p className="text-sm font-medium text-[#111111] m-0 truncate">{task.assignedTo}</p>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-3" />

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-[#999999] mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#999999] mb-1.5 m-0 font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide">Due Date</p>
                                    <p className="text-sm font-medium text-[#111111] m-0">{task.dueDate}</p>
                                </div>
                            </div>

                            <Divider className="my-3" />

                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-[#999999] mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#999999] mb-1.5 m-0 font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide">Workspace</p>
                                    <p className="text-sm font-medium text-[#111111] m-0 truncate">{task.project}</p>
                                </div>
                            </div>

                            <Divider className="my-3" />

                            <div className="flex items-start gap-3">
                                <ClipboardList className="w-5 h-5 text-[#999999] mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#999999] mb-1.5 m-0 font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide">Requirement</p>
                                    <p className="text-sm font-medium text-[#111111] m-0 truncate">{requirementName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}