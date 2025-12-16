import { useQuery } from "@tanstack/react-query";
import { getMeetings, getMeetingById } from "../services/meeting";

export const useMeetings = (options: string = "") => {
    return useQuery({
        queryKey: ["meetings", options],
        queryFn: () => getMeetings(options),
    });
};

export const useMeeting = (id: number) => {
    return useQuery({
        queryKey: ["meeting", id],
        queryFn: () => getMeetingById(id),
        enabled: !!id,
    });
};
