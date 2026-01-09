'use client';

import { Suspense } from 'react';


import dynamic from 'next/dynamic';
const SettingsPage = dynamic(() => import('@/components/features/settings/SettingsPage').then(mod => mod.SettingsPage), {
  loading: () => <div className="flex h-full items-center justify-center">Loading settings...</div>
});

export default function SettingsPageRoute() {
    return (

            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div>Loading settings...</div>}>
                    <SettingsPage />
                </Suspense>
            </div>

    );
}
