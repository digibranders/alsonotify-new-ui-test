import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export const doLogin = async (params: { email: string; password: string }) => {
  try {
    const { data } = await axiosApi.post("/auth/login", params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const doSignup = async (
  name: string,
  email: string,
  password: string,
  token: string | null
): Promise<ApiResponse<{ token: string }>> => {
  try {
    const { data } = await axiosApi.post("/auth/register", {
      name,
      email,
      password,
      token,
    });
    return data;
  } catch (error) {
    throw error;
  }
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
  try {
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
    axiosApi.defaults.headers.common["Authorization"] = data.result.token;
    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyRegisterToken = async (registerToken: string) => {
  try {
    const { data } = await axiosApi.get(`/auth/register/verify-token?registerToken=${registerToken}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const forgetPassword = async (email: string) => {
  try {
    const { data } = await axiosApi.post("/auth/password/forgot", {
      email: email,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (reset_token: string, password: string) => {
  try {
    const { data } = await axiosApi.post("/auth/password/reset", {
      reset_token,
      password,
    });
    return data;
  } catch (error) {
    throw error;
  }
};
