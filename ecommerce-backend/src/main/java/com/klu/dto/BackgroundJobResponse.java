package com.klu.dto;

import java.time.LocalDateTime;
import com.klu.model.BackgroundJob;

public class BackgroundJobResponse {
    private Long jobId;
    private Long orderId;
    private String jobType;
    private String status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BackgroundJobResponse() {
    }

    public BackgroundJobResponse(Long jobId, Long orderId, String jobType, String status,
                                 String message, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.jobId = jobId;
        this.orderId = orderId;
        this.jobType = jobType;
        this.status = status;
        this.message = message;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static BackgroundJobResponse fromEntity(BackgroundJob job) {
        return new BackgroundJobResponse(
                job.getJobId(),
                job.getOrder() != null ? job.getOrder().getOrderId() : null,
                job.getJobType() != null ? job.getJobType().name() : null,
                job.getStatus() != null ? job.getStatus().name() : null,
                job.getMessage(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
