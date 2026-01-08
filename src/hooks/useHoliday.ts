import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicHolidays, createPublicHoliday, updatePublicHoliday, deletePublicHoliday, CreateHolidayPayload } from "../services/holiday";
import { App } from "antd";
import { getErrorMessage } from "../types/errors";

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
        onError: (error: unknown) => {
            message.error(getErrorMessage(error));
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
        onError: (error: unknown) => {
            message.error(getErrorMessage(error));
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
        onError: (error: unknown) => {
            message.error(getErrorMessage(error));
        },
    });
};

