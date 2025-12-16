'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { TasksPage } from '../../../components/features/tasks/TasksPage';

export default function TasksPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <TasksPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
