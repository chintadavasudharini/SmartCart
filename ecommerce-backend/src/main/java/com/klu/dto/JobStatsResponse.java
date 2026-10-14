package com.klu.dto;

public class JobStatsResponse {
    private long totalJobs;
    private long pendingJobs;
    private long processingJobs;
    private long completedJobs;
    private long failedJobs;

    public JobStatsResponse() {
    }

    public JobStatsResponse(long totalJobs, long pendingJobs, long processingJobs, long completedJobs, long failedJobs) {
        this.totalJobs = totalJobs;
        this.pendingJobs = pendingJobs;
        this.processingJobs = processingJobs;
        this.completedJobs = completedJobs;
        this.failedJobs = failedJobs;
    }

    public long getTotalJobs() { return totalJobs; }
    public void setTotalJobs(long totalJobs) { this.totalJobs = totalJobs; }

    public long getPendingJobs() { return pendingJobs; }
    public void setPendingJobs(long pendingJobs) { this.pendingJobs = pendingJobs; }

    public long getProcessingJobs() { return processingJobs; }
    public void setProcessingJobs(long processingJobs) { this.processingJobs = processingJobs; }

    public long getCompletedJobs() { return completedJobs; }
    public void setCompletedJobs(long completedJobs) { this.completedJobs = completedJobs; }

    public long getFailedJobs() { return failedJobs; }
    public void setFailedJobs(long failedJobs) { this.failedJobs = failedJobs; }
}
