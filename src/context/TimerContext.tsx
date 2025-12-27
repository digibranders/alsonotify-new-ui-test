"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getCurrentActiveTimer } from "../services/task";
import { startWorkLog, updateWorklog } from "../services/task";

type TimerState = {
    isRunning: boolean;
    taskId: number | null;
    taskName: string | null;
    projectName: string | null;
    worklogId: number | null;
    startTime: Date | null;
    elapsedSeconds: number;
};

type TimerContextType = {
    timerState: TimerState;
    startTimer: (taskId: number, taskName: string, projectName: string) => Promise<void>;
    stopTimer: () => Promise<void>;
    isLoading: boolean;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [timerState, setTimerState] = useState<TimerState>({
        isRunning: false,
        taskId: null,
        taskName: null,
        projectName: null,
        worklogId: null,
        startTime: null,
        elapsedSeconds: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with Server on Load
    useEffect(() => {
        const syncTimer = async () => {
            try {
                const { result } = await getCurrentActiveTimer();
                if (result) {
                    const start = new Date(result.start_datetime);
                    const now = new Date();
                    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);

                    setTimerState({
                        isRunning: true,
                        taskId: result.task_id,
                        taskName: result.task_name,
                        projectName: result.project_name,
                        worklogId: result.worklog_id,
                        startTime: start,
                        elapsedSeconds: elapsed,
                    });
                }
            } catch (err) {
                console.error("Failed to sync timer", err);
            } finally {
                setIsLoading(false);
            }
        };
        syncTimer();
    }, []);

    // Local Ticking
    useEffect(() => {
        if (timerState.isRunning) {
            intervalRef.current = setInterval(() => {
                setTimerState((prev) => ({
                    ...prev,
                    elapsedSeconds: prev.elapsedSeconds + 1,
                }));
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timerState.isRunning]);

    const startTimer = async (taskId: number, taskName: string, projectName: string) => {
        if (timerState.isRunning) {
            // Auto-stop previous if needed, or block
            await stopTimer();
        }

        setIsLoading(true);
        try {
            const now = new Date();
            // Using existing service structure
            // Note: Backend might expect BigInt handling if not parsed
            const data = await startWorkLog(taskId, now.toISOString()); // Changed call signature to match startWorkLog

            setTimerState({
                isRunning: true,
                taskId,
                taskName,
                projectName,
                worklogId: data.result.id, // Assuming structure based on ApiResponse
                startTime: now,
                elapsedSeconds: 0,
            });
        } catch (err) {
            console.error("Failed to start timer", err);
        } finally {
            setIsLoading(false);
        }
    };

    const stopTimer = async () => {
        if (!timerState.worklogId) return;

        setIsLoading(true);
        try {
            const now = new Date();
            await updateWorklog({ // Changed to use updateWorklog signature
                task_id: timerState.taskId!,
                start_datetime: timerState.startTime!.toISOString(),
                end_datetime: now.toISOString(),
                description: "", // Add logic to prompt for description if needed
                // time_in_seconds: timerState.elapsedSeconds // updateWorklog payload doesn't seem to take seconds directly, it calculates or expects end_datetime? Checked service: it takes start, end, description.
            }, timerState.worklogId);

            setTimerState({
                isRunning: false,
                taskId: null,
                taskName: null,
                projectName: null,
                worklogId: null,
                startTime: null,
                elapsedSeconds: 0,
            });
        } catch (err) {
            console.error("Failed to stop timer", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TimerContext.Provider value={{ timerState, startTimer, stopTimer, isLoading }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
}
