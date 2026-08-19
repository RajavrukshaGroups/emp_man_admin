/**
 * ============================================================
 * TASK PRIORITY
 * ============================================================
 */

export type TaskPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

/**
 * ============================================================
 * JIRA-STYLE TASK STATUS
 * ============================================================
 */

export type TaskStatus =
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "COMPLETED"
    | "REOPENED"
    | "CANCELLED";

/**
 * ============================================================
 * REFERENCES
 * ============================================================
 */

export interface TaskUserReference {
    _id: string;

    firstName: string;

    middleName?: string;

    lastName: string;

    displayName: string;

    email: string;

    mobile?: string;

    profilePhoto?: string;

    status: string;
}

export interface TaskRoleReference {
    _id: string;

    name: string;

    code: string;

    scopeType:
    | "GLOBAL"
    | "COMPANY"
    | "DEPARTMENT"
    | "TEAM";

    status: string;
}

export interface TaskDepartmentReference {
    _id: string;

    name: string;

    code: string;

    description?: string;

    status: string;
}

export interface TaskTeamReference {
    _id: string;

    name: string;

    code: string;

    description?: string;

    status: string;
}

export interface TaskCompanyReference {
    _id: string;

    name: string;

    legalName?: string;

    code: string;

    slug?: string;

    logo?: string;

    status: string;
}

/**
 * ============================================================
 * CLIENT REFERENCE
 * ============================================================
 */

export interface TaskClientReference {
    _id: string;

    name: string;

    code: string;

    clientType?: string;

    engagementType?: string;

    contactPerson?: string;

    email?: string;

    mobile?: string;

    website?: string;

    industry?: string;

    status: string;
}

/**
 * ============================================================
 * WORK CATEGORY REFERENCE
 * ============================================================
 */

export interface TaskWorkCategoryReference {
    _id: string;

    departmentId:
    | string
    | TaskDepartmentReference;

    teamId:
    | string
    | TaskTeamReference;

    name: string;

    code: string;

    description?: string;

    unitLabel: string;

    workloadWeight: number;

    status: string;
}

/**
 * References CompanyAccess.
 *
 * Task assignment always uses CompanyAccess ID,
 * not User ID or Employee document ID.
 */
export interface TaskCompanyAccessReference {
    _id: string;

    userId: string | TaskUserReference;

    roleId?: string | TaskRoleReference;

    employeeCode?: string | null;

    designation?: string;

    employmentType?: string;

    departmentId?:
    | string
    | TaskDepartmentReference
    | null;

    teamId?:
    | string
    | TaskTeamReference
    | null;

    status: string;
}

export interface TaskAuditUserReference {
    _id: string;

    firstName?: string;

    lastName?: string;

    displayName?: string;

    email?: string;
}

/**
 * ============================================================
 * STATUS HISTORY
 * ============================================================
 */

export interface TaskStatusHistoryItem {
    _id?: string;

    fromStatus: TaskStatus | null;

    toStatus: TaskStatus;

    changedById:
    | string
    | TaskCompanyAccessReference;

    note: string;

    changedAt: string;
}

/**
 * ============================================================
 * REASSIGNMENT HISTORY
 * ============================================================
 */

export interface TaskReassignmentHistoryItem {
    _id: string;

    fromAssigneeId:
    | string
    | TaskCompanyAccessReference;

    toAssigneeId:
    | string
    | TaskCompanyAccessReference;

    reassignedById:
    | string
    | TaskCompanyAccessReference;

    reason: string;

    progressAtReassignment: number;

    reassignedAt: string;
}

/**
 * ============================================================
 * TASK
 * ============================================================
 */

export interface Task {
    _id: string;

    companyId:
    | string
    | TaskCompanyReference;

    /**
     * Client for whom this task is being performed.
     */
    clientId:
    | string
    | TaskClientReference;

    departmentId:
    | string
    | TaskDepartmentReference;

    teamId:
    | string
    | TaskTeamReference;

    /**
     * Work category assigned to this ticket.
     */
    workCategoryId:
    | string
    | TaskWorkCategoryReference;

    title: string;

    description: string;

    /**
     * Number of work units represented by the ticket.
     *
     * Example:
     * 5 creatives
     * 3 reels
     * 2 landing pages
     */
    quantity: number;

    priority: TaskPriority;

    /**
     * CompanyAccess ID/reference.
     */
    assigneeId:
    | string
    | TaskCompanyAccessReference;

    /**
     * CompanyAccess ID/reference of whoever
     * originally assigned the task.
     */
    assignedById:
    | string
    | TaskCompanyAccessReference;

    /**
     * Complete ownership-transfer history.
     */
    reassignmentHistory: TaskReassignmentHistoryItem[];

    /**
     * First actual time the employee started work.
     */
    startDate: string | null;

    dueDate: string;

    status: TaskStatus;

    statusHistory: TaskStatusHistoryItem[];

    /**
     * Current progress.
     */
    progressPercentage: number;

    /**
     * Latest employee working note.
     */
    workNote: string;

    /**
     * ==========================================================
     * SUBMISSION
     * ==========================================================
     */

    submittedAt: string | null;

    submittedById:
    | string
    | TaskCompanyAccessReference
    | null;

    submissionNote: string;

    /**
     * ==========================================================
     * COMPLETION
     * ==========================================================
     */

    completedAt: string | null;

    completedById:
    | string
    | TaskCompanyAccessReference
    | null;

    completionNote: string;

    /**
     * ==========================================================
     * REOPEN
     * ==========================================================
     */

    reopenCount: number;

    lastReopenedAt: string | null;

    lastReopenedById:
    | string
    | TaskCompanyAccessReference
    | null;

    reopenReason: string;

    /**
     * ==========================================================
     * CANCELLATION
     * ==========================================================
     */

    cancelledAt: string | null;

    cancelledById:
    | string
    | TaskCompanyAccessReference
    | null;

    cancellationReason: string;

    /**
     * ==========================================================
     * AUDIT
     * ==========================================================
     */

    createdBy:
    | string
    | TaskAuditUserReference
    | null;

    updatedBy:
    | string
    | TaskAuditUserReference
    | null;

    deletedBy:
    | string
    | TaskAuditUserReference
    | null;

    deletedAt: string | null;

    isDeleted: boolean;

    createdAt: string;

    updatedAt: string;
}

/**
 * ============================================================
 * PAGINATION
 * ============================================================
 */

export interface TaskPagination {
    page: number;

    limit: number;

    totalRecords: number;

    totalPages: number;

    hasNextPage: boolean;

    hasPreviousPage: boolean;
}

export interface TaskListResult {
    records: Task[];

    pagination: TaskPagination;
}

/**
 * ============================================================
 * LIST QUERY
 * ============================================================
 */

export interface TaskListQuery {
    page?: number;

    limit?: number;

    search?: string;

    status?: TaskStatus;

    priority?: TaskPriority;

    /**
     * Client ID.
     */
    clientId?: string;

    departmentId?: string;

    teamId?: string;

    /**
     * WorkCategory ID.
     */
    workCategoryId?: string;

    /**
     * CompanyAccess ID.
     */
    assigneeId?: string;

    /**
     * CompanyAccess ID.
     */
    assignedById?: string;

    dueDateFrom?: string;

    dueDateTo?: string;

    overdue?: boolean;

    sortBy?:
    | "title"
    | "quantity"
    | "priority"
    | "status"
    | "progressPercentage"
    | "startDate"
    | "dueDate"
    | "submittedAt"
    | "completedAt"
    | "createdAt"
    | "updatedAt";

    sortOrder?: "asc" | "desc";
}

/**
 * ============================================================
 * CREATE TASK
 * ============================================================
 */

export interface CreateTaskRequest {
    /**
     * Client ID.
     */
    clientId: string;

    /**
     * WorkCategory ID.
     */
    workCategoryId: string;

    title: string;

    description?: string;

    /**
     * Number of units being assigned.
     */
    quantity?: number;

    priority?: TaskPriority;

    /**
     * CompanyAccess ID.
     */
    assigneeId: string;

    dueDate: string;
}

/**
 * ============================================================
 * UPDATE TASK METADATA
 * ============================================================
 *
 * Workflow status and reassignment must not be changed here.
 */

export interface UpdateTaskRequest {
    clientId?: string;

    workCategoryId?: string;

    title?: string;

    description?: string;

    quantity?: number;

    priority?: TaskPriority;

    dueDate?: string;
}

/**
 * ============================================================
 * REASSIGN TASK
 * ============================================================
 */

export interface ReassignTaskRequest {
    newAssigneeId: string;

    reassignmentReason: string;
}

/**
 * ============================================================
 * START TASK
 * ============================================================
 */

export type StartTaskRequest = Record<
    string,
    never
>;

/**
 * ============================================================
 * UPDATE PROGRESS
 * ============================================================
 */

export interface UpdateTaskProgressRequest {
    progressPercentage: number;

    workNote?: string;
}

/**
 * ============================================================
 * SUBMIT TASK
 * ============================================================
 */

export interface SubmitTaskRequest {
    submissionNote?: string;
}

/**
 * ============================================================
 * COMPLETE TASK
 * ============================================================
 */

export interface CompleteTaskRequest {
    completionNote?: string;
}

/**
 * ============================================================
 * REOPEN TASK
 * ============================================================
 */

export interface ReopenTaskRequest {
    reopenReason: string;
}

/**
 * ============================================================
 * CANCEL TASK
 * ============================================================
 */

export interface CancelTaskRequest {
    cancellationReason: string;
}

/**
 * ============================================================
 * TASK ACTIVITY
 * ============================================================
 */

export type TaskActivityType =
    | "CREATED"
    | "STARTED"
    | "PROGRESS_UPDATED"
    | "SUBMITTED"
    | "COMPLETED"
    | "REOPENED"
    | "UPDATED"
    | "REASSIGNED"
    | "DUE_DATE_CHANGED"
    | "PRIORITY_CHANGED"
    | "CANCELLED"
    | "DELETED";

/**
 * Flexible metadata because different activities
 * store different structured evidence.
 */
export type TaskActivityMetadata =
    Record<string, unknown>;

export interface TaskActivity {
    _id: string;

    companyId: string;

    taskId: string;

    departmentId:
    | string
    | TaskDepartmentReference;

    teamId:
    | string
    | TaskTeamReference;

    performedById:
    | string
    | TaskCompanyAccessReference;

    performedByUserId:
    | string
    | TaskAuditUserReference;

    activityType: TaskActivityType;

    fromStatus: TaskStatus | null;

    toStatus: TaskStatus | null;

    note: string;

    metadata?: TaskActivityMetadata;

    createdAt: string;

    updatedAt: string;
}

/**
 * ============================================================
 * ACTIVITY LIST RESULT
 * ============================================================
 */

export interface TaskActivityListResult {
    taskId: string;

    records: TaskActivity[];

    totalRecords: number;
}