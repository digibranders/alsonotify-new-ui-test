'use client';

import { Suspense } from "react";

import { NotesPage } from "@/components/features/notes/NotesPage";

export default function Page() {
    return (
    
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div>Loading notes...</div>}>
                    <NotesPage />
                </Suspense>
            </div>
    
    );
}
