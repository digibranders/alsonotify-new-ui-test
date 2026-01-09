import { useQuery } from "@tanstack/react-query";
import { getMeetings, getMeetingById } from "../services/meeting";
import { queryKeys } from "../lib/queryKeys";

export const useMeetings = (options: string = "") => {
    return useQuery({
        queryKey: queryKeys.meetings.list(options),
        queryFn: () => getMeetings(options),
    });
};

export const useMeeting = (id: number) => {
    return useQuery({
        queryKey: queryKeys.meetings.detail(id),
        queryFn: () => getMeetingById(id),
        enabled: !!id,
    });
};
