export interface RegisterUserRequest {
    fullName: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    role: number;
    buildingIds: string[] | null;
}
