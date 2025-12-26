"use client";

import { useTimer } from "../../context/TimerContext";
import { Button } from "antd";
import { Pause, Play, Square } from "lucide-react";
import React from "react";

export function GlobalTimerPlayer() {
    const { timerState, stopTimer } = useTimer();

    if (!timerState.isRunning) return null;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#111111] text-white border-t border-[#333] h-16 flex items-center justify-between px-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Left: Task Info */}
            <div className="flex flex-col min-w-0">
                <span className="font-['Manrope:Bold',sans-serif] text-sm text-white truncate">
                    {timerState.taskName}
                </span>
                <span className="font-['Manrope:Medium',sans-serif] text-xs text-[#888] truncate">
                    {timerState.projectName}
                </span>
            </div>

            {/* Center: Timer Display */}
            <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
                <span className="font-['Manrope:Bold',sans-serif] text-2xl tracking-widest text-[#FFF]">
                    {formatTime(timerState.elapsedSeconds)}
                </span>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                {/* We can add Pause later if backend supports pausing worklogs without closing */}
                <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="large"
                    className="flex items-center justify-center !w-10 !h-10 hover:scale-110 transition-transform"
                    onClick={stopTimer}
                >
                    <Square fill="currentColor" className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
