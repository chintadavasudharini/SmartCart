package com.klu.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.klu.dto.BackgroundJobResponse;
import com.klu.dto.JobStatsResponse;
import com.klu.service.BackgroundJobService;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:5173")
public class BackgroundJobController {

    private final BackgroundJobService jobService;

    public BackgroundJobController(BackgroundJobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public ResponseEntity<List<BackgroundJobResponse>> getAllJobs(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String jobType) {
        return ResponseEntity.ok(jobService.getAllJobs(status, jobType));
    }

    @GetMapping("/stats")
    public ResponseEntity<JobStatsResponse> getJobStats() {
        return ResponseEntity.ok(jobService.getJobStats());
    }

    @PostMapping("/{jobId}/retry")
    public ResponseEntity<String> retryJob(@PathVariable Long jobId) {
        jobService.processJobAsync(jobId);
        return ResponseEntity.ok("Job #" + jobId + " queued for retry");
    }
}
