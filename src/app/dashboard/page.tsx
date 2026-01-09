'use client';

import { useRouter } from 'next/navigation';

import { ProgressWidget } from '../../components/dashboard/ProgressWidget';
import { MeetingsWidget } from '../../components/dashboard/MeetingsWidget';
import { TodoWidget } from '../../components/dashboard/TodoWidget';
import { LeavesWidget } from '../../components/dashboard/LeavesWidget';
import { NotesWidget } from '../../components/dashboard/NotesWidget';
import { ProductivityWidget } from '../../components/dashboard/ProductivityWidget';

// ... (imports)

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      {/* Row 2 & 3: Widgets - Fill remaining space */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto min-h-0 pr-1">
        {/* Row 2: Task/Progress Widget & Meetings */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          <div className="col-span-2 h-full">
            <ProgressWidget onNavigate={(page: string) => {
              // Handle filtered navigation with query params
              if (page.startsWith('requirements')) {
                // Extract query string if present (e.g., "requirements?tab=active")
                const queryPart = page.includes('?') ? page.substring(page.indexOf('?')) : '';
                router.push(`/dashboard/requirements${queryPart}`);
              } else if (page.startsWith('tasks')) {
                // Extract query string if present (e.g., "tasks?tab=In_Progress")
                const queryPart = page.includes('?') ? page.substring(page.indexOf('?')) : '';
                router.push(`/dashboard/tasks${queryPart}`);
              }
            }} />
          </div>
          <div className="col-span-1 h-full">
            <MeetingsWidget onNavigate={() => router.push('/dashboard/calendar')} />
          </div>
        </div>

        {/* Row 3: Notes & Leaves */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          <div className="col-span-2 h-full">
            <NotesWidget />
          </div>
          <div className="col-span-1 h-full">
            <LeavesWidget onNavigate={() => router.push('/dashboard/leaves')} />
          </div>
        </div>
      </div>

      {/* Row 4: Command Centre - Fixed Height at Bottom */}
      <div className="shrink-0">
        <ProductivityWidget />
      </div>
    </>
  );
}
