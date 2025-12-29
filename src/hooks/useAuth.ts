import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { doLogin, doSignup, forgetPassword, doCompleteSignup, verifyRegisterToken } from "../services/auth";
import { setToken, deleteToken, getToken } from "../services/cookies";
import axiosApi from "../config/axios";
import { getUserDetails } from "../services/user";

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string; redirect?: string }) => doLogin(credentials),
    onSuccess: (data, variables) => {
      if (data.success && data.result.token) {
        setToken(data.result.token);
        axiosApi.defaults.headers.common["authorization"] = data.result.token;
        queryClient.setQueryData(["user"], data.result.user);

        const redirect = variables.redirect || "/dashboard";
        router.push(redirect);
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (params: { firstName: string; lastName: string; email: string; password: string; token: string | null }) =>
      doSignup(params.firstName, params.lastName, params.email, params.password, params.token),
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => forgetPassword(email),
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    deleteToken();
    delete axiosApi.defaults.headers.common["authorization"];
    queryClient.clear();
    // Clear profile completion banner dismissal so it shows again on next login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileCompletionBannerDismissed');
    }
    router.push("/login");
  };
};

export const useUser = () => {
  const token = getToken();

  return useQuery({
    queryKey: ["user"],
    queryFn: getUserDetails,
    enabled: !!token,
    retry: false,
  });
};

export const useVerifyToken = (token: string | null) => {
  return useQuery({
    queryKey: ["verify-token", token],
    queryFn: () => verifyRegisterToken(token!),
    enabled: !!token,
    retry: false,
  });
};

export const useCompleteSignup = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      registerToken: string | null;
      companyName: string;
      businessType: string;
      accountType: string;
      country: string;
      timezone: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) =>
      doCompleteSignup(
        params.registerToken,
        params.companyName,
        params.businessType,
        params.accountType,
        params.country,
        params.timezone,
        params.firstName,
        params.lastName,
        params.phone
      ),
    onSuccess: (data) => {
      if (data.success && data.result.token) {
        setToken(data.result.token);
        axiosApi.defaults.headers.common["authorization"] = data.result.token;
        if (data.result.user) {
          queryClient.setQueryData(["user"], data.result.user);
          localStorage.setItem("user", JSON.stringify(data.result.user));
        }
        // Redirect to dashboard after successful signup
        router.push("/dashboard");
      }
    },
  });
};

