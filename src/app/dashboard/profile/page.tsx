'use client';

import { Suspense } from 'react';


import { ProfilePage } from '@/components/features/profile/ProfilePage';

export default function ProfilePageRoute() {
    return (
    
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div>Loading profile...</div>}>
                    <ProfilePage />
                </Suspense>
            </div>
    
    );
}
