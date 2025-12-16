import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeaves, getLeaveById, getCompanyLeaves, getLeaveBalance, updateLeaveStatus, applyForLeave, ApplyLeaveDto } from "../services/leave";
import { message } from "antd";

export const useLeaves = (options: string = "") => {
    return useQuery({
        queryKey: ["leaves", options],
        queryFn: () => getLeaves(options),
    });
};

export const useCompanyLeaves = () => {
    return useQuery({
        queryKey: ["companyLeaves"],
        queryFn: () => getCompanyLeaves(),
    });
};

export const useLeave = (id: number) => {
    return useQuery({
        queryKey: ["leave", id],
        queryFn: () => getLeaveById(id),
        enabled: !!id,
    });
};

export const useLeaveBalance = () => {
    return useQuery({
        queryKey: ["leaveBalance"],
        queryFn: () => getLeaveBalance(),
    });
};

export const useUpdateLeaveStatus = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }) => 
            updateLeaveStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyLeaves"] });
            queryClient.invalidateQueries({ queryKey: ["leaves"] });
            message.success("Leave status updated successfully");
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || "Failed to update leave status");
        },
    });
};

export const useApplyForLeave = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (payload: ApplyLeaveDto) => applyForLeave(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leaves"] });
            queryClient.invalidateQueries({ queryKey: ["companyLeaves"] });
            message.success("Leave request submitted successfully");
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || "Failed to submit leave request");
        },
    });
};
