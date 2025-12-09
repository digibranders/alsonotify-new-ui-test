'use client';

import { useRouter } from 'next/navigation';
import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { ProgressWidget } from '../../components/ProgressWidget';
import { MeetingsWidget } from '../../components/MeetingsWidget';
import { TodoWidget } from '../../components/TodoWidget';
import { LeavesWidget } from '../../components/LeavesWidget';
import { ProductivityWidget } from '../../components/ProductivityWidget';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <AlsonotifyLayoutWrapper>
      {/* Row 2 & 3: Widgets - Fill remaining space */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {/* Row 2: Task/Progress Widget & Meetings */}
        <div className="grid grid-cols-3 gap-5 flex-1 overflow-hidden">
          <div className="col-span-2 h-full overflow-hidden">
            <ProgressWidget onNavigate={() => router.push('/tasks')} />
          </div>
          <div className="col-span-1 h-full overflow-hidden">
            <MeetingsWidget onNavigate={() => router.push('/calendar')} />
          </div>
        </div>

        {/* Row 3: Notes & Leaves */}
        <div className="grid grid-cols-3 gap-5 flex-1 overflow-hidden">
          <div className="col-span-2 h-full overflow-hidden">
            <TodoWidget onNavigate={() => router.push('/tasks')} />
          </div>
          <div className="col-span-1 h-full overflow-hidden">
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
