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
 *
 * Backend lifecycle:
 *
 * ASSIGNED
 *    ↓
 * IN_PROGRESS
 *    ↓
 * SUBMITTED
 *    ↓
 * COMPLETED
 *
 * SUBMITTED / COMPLETED
 *    ↓
 * REOPENED
 *    ↓
 * IN_PROGRESS
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
 *
 * Lightweight lifecycle history stored directly
 * on the Task document.
 *
 * Detailed Jira-style activity history is stored
 * separately in TaskActivity.
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
 *
 * Preserves every ownership transfer of the ticket.
 *
 * Example:
 * Anand -> Rahul
 * Rahul -> Anand
 */

export interface TaskReassignmentHistoryItem {
    _id?: string;

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

    departmentId:
    | string
    | TaskDepartmentReference;

    teamId:
    | string
    | TaskTeamReference;

    title: string;

    description: string;

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
 * Complete ticket ownership-transfer history.
 */
    reassignmentHistory: TaskReassignmentHistoryItem[];

    /**
     * First actual time the employee started work.
     *
     * This remains preserved even when a ticket
     * is later reopened.
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
     *
     * A ticket may be reopened multiple times,
     * including after completion.
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

    departmentId?: string;

    teamId?: string;

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
    | "priority"
    | "status"
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
    title: string;

    description?: string;

    priority?: TaskPriority;

    /**
     * IMPORTANT:
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
 * Workflow status must never be changed through this request.
 */

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
}

/**
 * ============================================================
 * REASSIGN TASK
 * ============================================================
 *
 * Transfers responsibility for an existing ticket
 * to another employee.
 *
 * assigneeId:
 * CompanyAccess ID of the new assignee.
 *
 * reason:
 * Required audit reason for the transfer.
 *
 * Existing task progress, work note, start date and
 * lifecycle status are preserved by the backend.
 */

export interface ReassignTaskRequest {
    newAssigneeId: string;
    reassignmentReason: string;
}

/**
 * ============================================================
 * START TASK
 * ============================================================
 *
 * ASSIGNED → IN_PROGRESS
 * REOPENED → IN_PROGRESS
 *
 * No request body required.
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
 *
 * IN_PROGRESS → SUBMITTED
 */

export interface SubmitTaskRequest {
    submissionNote?: string;
}

/**
 * ============================================================
 * COMPLETE TASK
 * ============================================================
 *
 * SUBMITTED → COMPLETED
 */

export interface CompleteTaskRequest {
    completionNote?: string;
}

/**
 * ============================================================
 * REOPEN TASK
 * ============================================================
 *
 * SUBMITTED → REOPENED
 * COMPLETED → REOPENED
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
 *
 * Detailed Jira-style ticket activity timeline.
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
 * Flexible metadata because different activity
 * types store different structured data.
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
 * Response returned from:
 *
 * GET /companies/:companyId/tasks/:taskId/activities
 */
export interface TaskActivityListResult {
    taskId: string;

    records: TaskActivity[];

    totalRecords: number;
}