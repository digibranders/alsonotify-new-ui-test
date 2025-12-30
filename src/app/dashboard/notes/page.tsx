"use client";

import { Suspense } from "react";

import { NotesPage } from "@/components/features/notes/NotesPage";
import { AlsonotifyLayoutWrapper } from "../../AlsonotifyLayoutWrapper";

export default function Page() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div>Loading notes...</div>}>
                    <NotesPage />
                </Suspense>
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
