import { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { getJobs, getJobStats, retryJob } from "../api/jobApi";
import { websocketService } from "../services/websocketService";
import { useAuthStore } from "../store/authStore";
import type { BackgroundJob, JobStats, JobStatus, JobType } from "../types/job";

function BackgroundJobMonitor() {
    const user = useAuthStore((state) => state.user);
    const [jobs, setJobs] = useState<BackgroundJob[]>([]);
    const [stats, setStats] = useState<JobStats>({
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [isWsConnected, setIsWsConnected] = useState(false);
    const [retryingJobId, setRetryingJobId] = useState<number | null>(null);

    // Manual refresh action
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [jobsData, statsData] = await Promise.all([
                getJobs(),
                getJobStats()
            ]);
            setJobs(jobsData);
            setStats(statsData);
            setError("");
        } catch (err: unknown) {
            console.error("Failed to load jobs", err);
            setError("Unable to load background jobs. Please verify admin privileges.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([getJobs(), getJobStats()])
            .then(([jobsData, statsData]) => {
                if (isMounted) {
                    setJobs(jobsData);
                    setStats(statsData);
                    setError("");
                    setLoading(false);
                }
            })
            .catch((err: unknown) => {
                if (isMounted) {
                    console.error("Failed to load jobs", err);
                    setError("Unable to load background jobs. Please verify admin privileges.");
                    setLoading(false);
                }
            });

        // Connect WebSocket and subscribe to STOMP /topic/jobs
        websocketService.connect(() => {
            setIsWsConnected(true);
        });

        const unsubscribe = websocketService.subscribe((updatedJob: BackgroundJob) => {
            setIsWsConnected(true);

            setJobs((prevJobs) => {
                const index = prevJobs.findIndex((j) => j.jobId === updatedJob.jobId);
                if (index !== -1) {
                    const newJobs = [...prevJobs];
                    newJobs[index] = updatedJob;
                    return newJobs;
                } else {
                    return [updatedJob, ...prevJobs];
                }
            });

            // Re-fetch stats dynamically
            getJobStats()
                .then(setStats)
                .catch(() => {});
        });

        // Periodic check on connection state
        const interval = setInterval(() => {
            setIsWsConnected(websocketService.getConnectedStatus());
        }, 3000);

        return () => {
            isMounted = false;
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const handleRetry = async (jobId: number) => {
        try {
            setRetryingJobId(jobId);
            await retryJob(jobId);
        } catch (err) {
            console.error("Retry failed:", err);
            alert("Failed to retry job #" + jobId);
        } finally {
            setRetryingJobId(null);
        }
    };

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
            const matchesType = typeFilter === "ALL" || job.jobType === typeFilter;
            return matchesStatus && matchesType;
        });
    }, [jobs, statusFilter, typeFilter]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
                " (" + d.toLocaleDateString() + ")";
        } catch {
            return dateStr;
        }
    };

    const getTypeIcon = (type: JobType) => {
        switch (type) {
            case "EMAIL": return "✉️";
            case "INVOICE": return "📄";
            case "NOTIFICATION": return "🔔";
            default: return "⚙️";
        }
    };

    const getStatusBadge = (status: JobStatus) => {
        switch (status) {
            case "PENDING":
                return <span className="job-status-badge status-pending">⏳ PENDING</span>;
            case "PROCESSING":
                return <span className="job-status-badge status-processing">⚙️ PROCESSING</span>;
            case "COMPLETED":
                return <span className="job-status-badge status-completed">✅ COMPLETED</span>;
            case "FAILED":
                return <span className="job-status-badge status-failed">❌ FAILED</span>;
            default:
                return <span className="job-status-badge">{status}</span>;
        }
    };

    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="admin-theme">
            <div className="container">
            {/* Header Breadcrumb & Live Indicator */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <Link to="/admin" className="btn-secondary btn-sm">
                            ← Admin Panel
                        </Link>
                        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}>
                            Real-Time Background Job Monitor
                        </h1>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                        Live STOMP WebSocket stream from <code>/topic/jobs</code>. Updates occur automatically without refreshing.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className={`live-indicator-pill ${!isWsConnected ? "disconnected" : ""}`}>
                        <span className="live-dot" />
                        <span>{isWsConnected ? "STOMP LIVE: /topic/jobs" : "CONNECTING WS..."}</span>
                    </div>
                    <button className="btn-secondary btn-sm" onClick={fetchInitialData}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: "28px" }}>
                <div className="stat-card">
                    <div className="stat-title">Total Jobs</div>
                    <div className="stat-value">{stats.totalJobs}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Pending</div>
                    <div className="stat-value" style={{ color: "#b45309" }}>{stats.pendingJobs}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Processing</div>
                    <div className="stat-value" style={{ color: "var(--primary)" }}>{stats.processingJobs}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Completed</div>
                    <div className="stat-value" style={{ color: "var(--accent)" }}>{stats.completedJobs}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Failed</div>
                    <div className="stat-value" style={{ color: "var(--danger)" }}>{stats.failedJobs}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filters-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "13px", color: "var(--text-muted)" }}>STATUS:</strong>
                        <div className="category-pills">
                            {["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((s) => (
                                <button
                                    key={s}
                                    className={`category-pill-btn ${statusFilter === s ? "active" : ""}`}
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "13px", color: "var(--text-muted)" }}>TYPE:</strong>
                        <div className="category-pills">
                            {["ALL", "EMAIL", "INVOICE", "NOTIFICATION"].map((t) => (
                                <button
                                    key={t}
                                    className={`category-pill-btn ${typeFilter === t ? "active" : ""}`}
                                    onClick={() => setTypeFilter(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    Showing {filteredJobs.length} of {jobs.length} jobs
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "14px", borderRadius: "8px", marginBottom: "20px" }}>
                    <p className="error-message" style={{ margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {/* Jobs Table */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div className="brand-logo-icon" style={{ fontSize: "36px", marginBottom: "12px" }}>⚙️</div>
                    <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading background jobs...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="cart-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <span style={{ fontSize: "48px" }}>📋</span>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "12px 0 6px" }}>No Background Jobs Found</h3>
                    <p style={{ color: "var(--text-muted)" }}>
                        When orders are paid, background jobs (Email, Invoice, Notification) will appear here in real-time.
                    </p>
                </div>
            ) : (
                <div className="jobs-table-container">
                    <table className="jobs-table">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Order ID</th>
                                <th>Job Type</th>
                                <th>Status</th>
                                <th>Message / Output</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map((job) => (
                                <tr key={job.jobId}>
                                    <td>
                                        <strong>#{job.jobId}</strong>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                                            Order #{job.orderId}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="job-type-badge">
                                            {getTypeIcon(job.jobType)} {job.jobType}
                                        </span>
                                    </td>
                                    <td>
                                        {getStatusBadge(job.status)}
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: "340px", wordBreak: "break-word", fontSize: "13px" }}>
                                            {job.message || "-"}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                        {formatDate(job.createdAt)}
                                    </td>
                                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                        {formatDate(job.updatedAt)}
                                    </td>
                                    <td>
                                        {job.status === "FAILED" && (
                                            <button
                                                className="btn-outline-danger btn-sm"
                                                onClick={() => handleRetry(job.jobId)}
                                                disabled={retryingJobId === job.jobId}
                                            >
                                                {retryingJobId === job.jobId ? "Retrying..." : "🔄 Retry"}
                                            </button>
                                        )}
                                        {job.status === "COMPLETED" && (
                                            <span style={{ color: "var(--accent)", fontSize: "12px", fontWeight: 700 }}>
                                                ✓ Done
                                            </span>
                                        )}
                                        {job.status === "PROCESSING" && (
                                            <span style={{ color: "var(--primary)", fontSize: "12px", fontWeight: 700 }}>
                                                ⏳ Working
                                            </span>
                                        )}
                                        {job.status === "PENDING" && (
                                            <span style={{ color: "#b45309", fontSize: "12px", fontWeight: 700 }}>
                                                Queued
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            </div>
        </div>
    );
}

export default BackgroundJobMonitor;
