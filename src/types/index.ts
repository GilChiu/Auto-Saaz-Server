export interface User {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface FileUploadResponse {
    url: string;
    fileName: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
}