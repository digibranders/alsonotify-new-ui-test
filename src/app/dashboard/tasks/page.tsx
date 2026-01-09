'use client';

import { Suspense } from 'react';

import { TasksPage } from '../../../components/features/tasks/TasksPage';

export default function TasksPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-[#999999]">Loading...</p></div>}>
          <TasksPage />
        </Suspense>
      </div>

  );
}
