'use client';

import { Suspense } from 'react';

import { PartnersPageContent } from '../../../components/features/partners/PartnersPage';

export const dynamic = 'force-dynamic';

export default function PartnersPageRoute() {
    return (
    
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="p-8 text-center text-[#999999]">Loading partners...</div>}>
                    <PartnersPageContent />
                </Suspense>
            </div>
    
    );
}
