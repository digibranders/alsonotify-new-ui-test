import axiosApi, { setAuthToken } from "../config/axios";
import { ApiResponse } from "../constants/constants";

export const doLogin = async (params: { email: string; password: string }) => {
    const { data } = await axiosApi.post("/auth/login", params);
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
) => {
    const { data } = await axiosApi.post("/auth/register/complete", {
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

export const verifyRegisterToken = async (registerToken: string) => {
    const { data } = await axiosApi.get(`/auth/register/verify-token?registerToken=${registerToken}`);
    return data;
};

export const forgetPassword = async (email: string) => {
    const { data } = await axiosApi.post("/auth/password/forgot", {
      email: email,
    });
    return data;
};

export const resetPassword = async (reset_token: string, password: string) => {
    const { data } = await axiosApi.post("/auth/password/reset", {
      reset_token,
      password,
    });
    return data;
};
