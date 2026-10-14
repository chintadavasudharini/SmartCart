package com.klu.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.klu.model.BackgroundJob;
import com.klu.model.JobStatus;
import com.klu.model.JobType;

@Repository
public interface BackgroundJobRepository extends JpaRepository<BackgroundJob, Long> {
    List<BackgroundJob> findAllByOrderByCreatedAtDesc();
    List<BackgroundJob> findByOrderOrderIdOrderByCreatedAtDesc(Long orderId);
    List<BackgroundJob> findByStatusOrderByCreatedAtDesc(JobStatus status);
    List<BackgroundJob> findByJobTypeOrderByCreatedAtDesc(JobType jobType);
    List<BackgroundJob> findByStatusAndJobTypeOrderByCreatedAtDesc(JobStatus status, JobType jobType);
    boolean existsByOrderOrderIdAndJobType(Long orderId, JobType jobType);
    long countByStatus(JobStatus status);
}
