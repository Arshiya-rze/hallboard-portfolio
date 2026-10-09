export interface VerifyPasswordResetRequest {
    phoneNumber: string;
    otpCode: string;
    password: string;
    confirmPassword: string;
}
