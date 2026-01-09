import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeaves, getLeaveById, getCompanyLeaves, getLeaveBalance, updateLeaveStatus, applyForLeave, ApplyLeaveDto } from "../services/leave";
import { App } from "antd";
import { getErrorMessage } from "../types/errors";
import { queryKeys } from "../lib/queryKeys";

export const useLeaves = (options: string = "") => {
    return useQuery({
        queryKey: queryKeys.leaves.list(options),
        queryFn: () => getLeaves(options),
    });
};

export const useCompanyLeaves = () => {
    return useQuery({
        queryKey: queryKeys.leaves.company(),
        queryFn: () => getCompanyLeaves(),
    });
};

export const useLeave = (id: number) => {
    return useQuery({
        queryKey: queryKeys.leaves.detail(id),
        queryFn: () => getLeaveById(id),
        enabled: !!id,
    });
};

export const useLeaveBalance = () => {
    return useQuery({
        queryKey: queryKeys.leaves.balance(),
        queryFn: () => getLeaveBalance(),
    });
};

export const useUpdateLeaveStatus = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
    
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }) => 
            updateLeaveStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaves.company() });
            queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all() });
            message.success("Leave status updated successfully");
        },
        onError: (error: unknown) => {
            message.error(getErrorMessage(error));
        },
    });
};

export const useApplyForLeave = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
    
    return useMutation({
        mutationFn: (payload: ApplyLeaveDto) => applyForLeave(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.leaves.company() });
            message.success("Leave request submitted successfully");
        },
        onError: (error: unknown) => {
            message.error(getErrorMessage(error));
        },
    });
};
