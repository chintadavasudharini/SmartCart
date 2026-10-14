package com.klu.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.klu.dto.BackgroundJobResponse;
import com.klu.dto.JobStatsResponse;
import com.klu.model.*;
import com.klu.repository.BackgroundJobRepository;
import com.klu.repository.OrderRepository;

@Service
public class BackgroundJobService {
    private static final Logger logger = LoggerFactory.getLogger(BackgroundJobService.class);

    private final BackgroundJobRepository jobRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Lazy
    private final BackgroundJobService self;

    public BackgroundJobService(BackgroundJobRepository jobRepository,
                                OrderRepository orderRepository,
                                EmailService emailService,
                                InvoiceService invoiceService,
                                NotificationService notificationService,
                                SimpMessagingTemplate messagingTemplate,
                                @Lazy BackgroundJobService self) {
        this.jobRepository = jobRepository;
        this.orderRepository = orderRepository;
        this.emailService = emailService;
        this.invoiceService = invoiceService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
        this.self = self;
    }

    /**
     * Creates PENDING background jobs idempotently and triggers async execution.
     */
    @Transactional
    public List<BackgroundJob> createJobsForOrder(Order order) {
        List<BackgroundJob> createdJobs = new ArrayList<>();
        JobType[] types = {JobType.EMAIL, JobType.INVOICE, JobType.NOTIFICATION};

        for (JobType type : types) {
            boolean exists = jobRepository.existsByOrderOrderIdAndJobType(order.getOrderId(), type);
            if (!exists) {
                BackgroundJob job = new BackgroundJob(order, type, JobStatus.PENDING, "Job queued for Order #" + order.getOrderId());
                job = jobRepository.save(job);
                createdJobs.add(job);
                logger.info("Created BackgroundJob #{} [{} - PENDING] for Order #{}", job.getJobId(), type, order.getOrderId());
                publishJobUpdate(job);
            } else {
                logger.info("Idempotency check: Job [{}] already exists for Order #{}", type, order.getOrderId());
            }
        }

        // Trigger async execution
        if (!createdJobs.isEmpty()) {
            for (BackgroundJob job : createdJobs) {
                self.processJobAsync(job.getJobId());
            }
        }

        return createdJobs;
    }

    /**
     * Executes individual job asynchronously.
     */
    @Async
    public void processJobAsync(Long jobId) {
        BackgroundJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            logger.warn("Job #{} not found for async processing", jobId);
            return;
        }

        // Move to PROCESSING
        job.setStatus(JobStatus.PROCESSING);
        job.setMessage("Processing " + job.getJobType() + " for Order #" + job.getOrder().getOrderId() + "...");
        job = jobRepository.save(job);
        logger.info("BackgroundJob #{} [{} - PROCESSING] started", job.getJobId(), job.getJobType());
        publishJobUpdate(job);

        // Small delay so admin dashboard sees real-time state transition
        try {
            Thread.sleep(1200);
        } catch (InterruptedException ignored) {}

        Order order = orderRepository.findById(job.getOrder().getOrderId()).orElse(null);
        if (order == null) {
            markJobFailed(job, "Associated order not found");
            return;
        }

        try {
            String resultMessage;
            switch (job.getJobType()) {
                case EMAIL -> resultMessage = emailService.sendOrderConfirmation(order);
                case INVOICE -> resultMessage = invoiceService.generateInvoice(order);
                case NOTIFICATION -> resultMessage = notificationService.sendOrderNotification(order);
                default -> throw new IllegalArgumentException("Unknown job type: " + job.getJobType());
            }

            job.setStatus(JobStatus.COMPLETED);
            job.setMessage(resultMessage);
            job = jobRepository.save(job);
            logger.info("BackgroundJob #{} [{} - COMPLETED]: {}", job.getJobId(), job.getJobType(), resultMessage);
            publishJobUpdate(job);

        } catch (Exception e) {
            logger.error("Error executing BackgroundJob #{}: {}", job.getJobId(), e.getMessage(), e);
            markJobFailed(job, "Failed: " + e.getMessage());
        }
    }

    private void markJobFailed(BackgroundJob job, String errorMsg) {
        job.setStatus(JobStatus.FAILED);
        job.setMessage(errorMsg);
        job = jobRepository.save(job);
        logger.warn("BackgroundJob #{} [{} - FAILED]: {}", job.getJobId(), job.getJobType(), errorMsg);
        publishJobUpdate(job);
    }

    public void publishJobUpdate(BackgroundJob job) {
        try {
            BackgroundJobResponse response = BackgroundJobResponse.fromEntity(job);
            messagingTemplate.convertAndSend("/topic/jobs", response);
            logger.debug("Published WebSocket event for Job #{} to /topic/jobs", job.getJobId());
        } catch (Exception e) {
            logger.warn("Could not publish WebSocket update: {}", e.getMessage());
        }
    }

    public List<BackgroundJobResponse> getAllJobs(String statusStr, String typeStr) {
        List<BackgroundJob> list;

        JobStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = JobStatus.valueOf(statusStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        JobType jobType = null;
        if (typeStr != null && !typeStr.isBlank() && !"ALL".equalsIgnoreCase(typeStr)) {
            try {
                jobType = JobType.valueOf(typeStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        if (status != null && jobType != null) {
            list = jobRepository.findByStatusAndJobTypeOrderByCreatedAtDesc(status, jobType);
        } else if (status != null) {
            list = jobRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (jobType != null) {
            list = jobRepository.findByJobTypeOrderByCreatedAtDesc(jobType);
        } else {
            list = jobRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream().map(BackgroundJobResponse::fromEntity).collect(Collectors.toList());
    }

    public JobStatsResponse getJobStats() {
        long total = jobRepository.count();
        long pending = jobRepository.countByStatus(JobStatus.PENDING);
        long processing = jobRepository.countByStatus(JobStatus.PROCESSING);
        long completed = jobRepository.countByStatus(JobStatus.COMPLETED);
        long failed = jobRepository.countByStatus(JobStatus.FAILED);
        return new JobStatsResponse(total, pending, processing, completed, failed);
    }
}
