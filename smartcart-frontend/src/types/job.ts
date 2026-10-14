export type JobType = "EMAIL" | "INVOICE" | "NOTIFICATION";
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface BackgroundJob {
    jobId: number;
    orderId: number;
    jobType: JobType;
    status: JobStatus;
    message: string;
    createdAt: string;
    updatedAt: string;
}

export interface JobStats {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
}
