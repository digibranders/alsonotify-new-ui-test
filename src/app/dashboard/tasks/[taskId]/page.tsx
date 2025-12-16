'use client';

import { AlsonotifyLayoutWrapper } from '../../../AlsonotifyLayoutWrapper';
import { TaskDetailsPage } from '@/components/features/tasks/TaskDetailsPage';

export default function TaskDetailsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <TaskDetailsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
