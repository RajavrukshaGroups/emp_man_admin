import apiClient from "@/lib/axios";

import type { ApiResponse } from "@/types/api";

import type {
    CreateEmployeePayload,
    Employee,
    EmployeeListParams,
    EmployeeListResult,
} from "../types/employee.types";

export const employeeService = {
    async createEmployee(
        companyId: string,
        payload: CreateEmployeePayload,
    ): Promise<Employee> {
        const response = await apiClient.post<ApiResponse<Employee>>(
            `/companies/${companyId}/employees`,
            payload,
        );

        return response.data.data;
    },

    async getEmployees(
        companyId: string,
        params: EmployeeListParams = {},
    ): Promise<EmployeeListResult> {
        const response = await apiClient.get<ApiResponse<EmployeeListResult>>(
            `/companies/${companyId}/employees`,
            {
                params,
            },
        );

        return response.data.data;
    },

    async getEmployeeById(
        companyId: string,
        employeeId: string,
    ): Promise<Employee> {
        const response = await apiClient.get<ApiResponse<Employee>>(
            `/companies/${companyId}/employees/${employeeId}`,
        );

        return response.data.data;
    },
};