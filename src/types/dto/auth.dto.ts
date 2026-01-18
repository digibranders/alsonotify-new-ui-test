import { UserDto } from "./user.dto";

export interface LoginResponseDTO {
  token: string;
  user: UserDto;
}

export interface RegisterCompleteResponseDTO {
  token: string;
  user: UserDto;
}

export interface VerifyTokenResponseDTO {
  isValid: boolean;
  email?: string;
  name?: string;
}

export interface GenericSuccessDTO {
  success: boolean;
  message?: string;
}
