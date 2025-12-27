import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicHolidays, createPublicHoliday, updatePublicHoliday, deletePublicHoliday, CreateHolidayPayload } from "../services/holiday";
import { App } from "antd";

export const usePublicHolidays = () => {
    return useQuery({
        queryKey: ["publicHolidays"],
        queryFn: () => getPublicHolidays(),
    });
};

export const useCreateHoliday = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
    
    return useMutation({
        mutationFn: (payload: CreateHolidayPayload) => createPublicHoliday(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["publicHolidays"] });
            message.success("Holiday created successfully");
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || "Failed to create holiday");
        },
    });
};

export const useUpdateHoliday = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
    
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: CreateHolidayPayload }) => 
            updatePublicHoliday(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["publicHolidays"] });
            message.success("Holiday updated successfully");
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || "Failed to update holiday");
        },
    });
};

export const useDeleteHoliday = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
    
    return useMutation({
        mutationFn: (id: number) => deletePublicHoliday(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["publicHolidays"] });
            message.success("Holiday deleted successfully");
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || "Failed to delete holiday");
        },
    });
};

