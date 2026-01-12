'use client';

import { Suspense } from 'react';

import { TasksPage } from '../../../components/features/tasks/TasksPage';

export default function TasksPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex-1" />}>
          <TasksPage />
        </Suspense>
      </div>

  );
}
