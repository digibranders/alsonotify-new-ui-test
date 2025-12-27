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

    return null;
}
