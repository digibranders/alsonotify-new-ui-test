import axiosApi, { setAuthToken } from "../config/axios";
import { ApiResponse } from "../constants/constants";

import { LoginResponse } from "../types/auth";

export const doLogin = async (params: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await axiosApi.post<ApiResponse<LoginResponse>>("/auth/login", params);
    return data;
};

export const doSignup = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  token: string | null
): Promise<ApiResponse<{ token: string }>> => {
    const { data } = await axiosApi.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
      token,
    });
    return data;
};

export const doCompleteSignup = async (
  registerToken: string | null,
  companyName: string,
  businessType: string,
  accountType: string,
  country: string,
  timezone: string,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<ApiResponse<{ token: string; user: any }>> => { // TODO: Replace 'any' with specific user type if aligned
    const { data } = await axiosApi.post<ApiResponse<{ token: string; user: any }>>("/auth/register/complete", {
      registerToken,
      companyName,
      businessType,
      accountType,
      country,
      timezone,
      firstName,
      lastName,
      phone
    });
    setAuthToken(data.result.token);
    return data;
};

export const verifyRegisterToken = async (registerToken: string): Promise<ApiResponse<any>> => {
    const { data } = await axiosApi.get<ApiResponse<any>>(`/auth/register/verify-token?registerToken=${registerToken}`);
    return data;
};

export const forgetPassword = async (email: string): Promise<ApiResponse<any>> => {
    const { data } = await axiosApi.post<ApiResponse<any>>("/auth/password/forgot", {
      email: email,
    });
    return data;
};

export const resetPassword = async (reset_token: string, password: string): Promise<ApiResponse<any>> => {
    const { data } = await axiosApi.post<ApiResponse<any>>("/auth/password/reset", {
      reset_token,
      password,
    });
    return data;
};
