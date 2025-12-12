'use client';

import { useRouter } from 'next/navigation';
import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { ProgressWidget } from '../../components/dashboard/ProgressWidget';
import { MeetingsWidget } from '../../components/dashboard/MeetingsWidget';
import { TodoWidget } from '../../components/dashboard/TodoWidget';
import { LeavesWidget } from '../../components/dashboard/LeavesWidget';
import { ProductivityWidget } from '../../components/dashboard/ProductivityWidget';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <AlsonotifyLayoutWrapper>
      {/* Row 2 & 3: Widgets - Fill remaining space */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto min-h-0 pr-1">
        {/* Row 2: Task/Progress Widget & Meetings */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          <div className="col-span-2 h-full">
            <ProgressWidget onNavigate={(page: string) => {
              if (page === 'requirements') {
                router.push('/requirements');
              } else if (page === 'tasks') {
                router.push('/tasks');
              }
            }} />
          </div>
          <div className="col-span-1 h-full">
            <MeetingsWidget onNavigate={() => router.push('/calendar')} />
          </div>
        </div>

        {/* Row 3: Notes & Leaves */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          <div className="col-span-2 h-full">
            <TodoWidget onNavigate={() => router.push('/tasks')} />
          </div>
          <div className="col-span-1 h-full">
            <LeavesWidget onNavigate={() => router.push('/leaves')} />
          </div>
        </div>
      </div>

      {/* Row 4: Command Centre - Fixed Height at Bottom */}
      <div className="shrink-0">
        <ProductivityWidget />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
