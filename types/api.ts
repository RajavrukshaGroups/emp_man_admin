export interface ApiErrorItem {
    path?: Array<string | number>;
    message: string;
    code?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    errors?: ApiErrorItem[];
    stack?: string;
}

export interface Pagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
    records: T[];
    pagination: Pagination;
}