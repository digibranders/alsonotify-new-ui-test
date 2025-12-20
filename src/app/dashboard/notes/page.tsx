"use client";

import { NotesPage } from "@/components/features/notes/NotesPage";
import { AlsonotifyLayoutWrapper } from "../../AlsonotifyLayoutWrapper";

export default function Page() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <NotesPage />
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
