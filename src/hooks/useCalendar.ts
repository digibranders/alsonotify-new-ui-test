import { useQuery } from "@tanstack/react-query";
import { getTeamsConnectionStatus, getCalendarEvents } from "../services/calendar";
import dayjs from "dayjs";

export const useTeamsConnectionStatus = () => {
  return useQuery({
    queryKey: ["teamsConnectionStatus"],
    queryFn: () => getTeamsConnectionStatus(),
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds to check connection status
    staleTime: 0, // Always consider data stale to ensure fresh status
  });
};

export const useCalendarEvents = (startISO?: string, endISO?: string) => {
  const start = startISO || dayjs().startOf("day").toISOString();
  const end = endISO || dayjs().add(2, "day").endOf("day").toISOString();
  
  return useQuery({
    queryKey: ["calendarEvents", start, end],
    queryFn: () => getCalendarEvents(start, end),
    enabled: !!start && !!end,
    staleTime: 0, // Always consider data stale to allow refetching
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};
