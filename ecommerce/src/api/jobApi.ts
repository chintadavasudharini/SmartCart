import apiClient from "./apiClient";
import type { BackgroundJob, JobStats } from "../types/job";

export const getJobs = async (status?: string, jobType?: string): Promise<BackgroundJob[]> => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (jobType && jobType !== "ALL") params.append("jobType", jobType);

    const url = `/jobs${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get<BackgroundJob[]>(url);
    return response.data;
};

export const getJobStats = async (): Promise<JobStats> => {
    const response = await apiClient.get<JobStats>("/jobs/stats");
    return response.data;
};

export const retryJob = async (jobId: number): Promise<string> => {
    const response = await apiClient.post<string>(`/jobs/${jobId}/retry`);
    return response.data;
};
