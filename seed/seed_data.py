"""
Synthetic Dataset Generator for SLO Decision Dashboard
Learning Platform Examination Load Scenario

Generates:
- 5 services (Exam Submission, Authentication/Login, Video Streaming, Course Content, API Gateway)
- 120+ SLI metric records
- 55+ support incidents
- 16+ feature plans
- 16+ reliability tasks
- 5 configurable rules
- Demo users (Engineer and Engineering Manager)

Labels all datasets clearly as DEMO / SYNTHETIC DATA.
"""

import json
import random
import os
from datetime import datetime, timedelta, timezone

def generate_synthetic_data():
    now = datetime(2026, 9, 3, 6, 0, 0, tzinfo=timezone.utc)

    # 1. Users
    users = [
        {
            "id": "usr_mgr_1",
            "name": "Elena Rostova",
            "email": "elena.rostova@examlearn.edu",
            "password_hash": "demo_argon2_hash_mgr",
            "role": "ENGINEERING_MANAGER",
            "created_at": (now - timedelta(days=180)).isoformat()
        },
        {
            "id": "usr_eng_1",
            "name": "Marcus Chen",
            "email": "marcus.chen@examlearn.edu",
            "password_hash": "demo_argon2_hash_eng",
            "role": "ENGINEER",
            "created_at": (now - timedelta(days=90)).isoformat()
        }
    ]

    # 2. Services
    services = [
        {
            "id": "srv_exam_sub",
            "name": "Exam Submission Service",
            "description": "Critical student test answer submission, timed upload, and integrity hashing.",
            "slo_target": 99.99,
            "sli_type": "AVAILABILITY_HTTP",
            "tier": "TIER_1",
            "created_at": (now - timedelta(days=120)).isoformat()
        },
        {
            "id": "srv_auth_login",
            "name": "Login & Identity Service",
            "description": "Student single sign-on, proctoring session tokens, multi-factor verification.",
            "slo_target": 99.95,
            "sli_type": "AVAILABILITY_HTTP",
            "tier": "TIER_1",
            "created_at": (now - timedelta(days=120)).isoformat()
        },
        {
            "id": "srv_video_stream",
            "name": "Video Streaming Service",
            "description": "Lecture replay, pre-recorded exam prep lectures, and asynchronous demos.",
            "slo_target": 99.50,
            "sli_type": "AVAILABILITY_HTTP",
            "tier": "TIER_2",
            "created_at": (now - timedelta(days=120)).isoformat()
        },
        {
            "id": "srv_course_content",
            "name": "Course Content Service",
            "description": "Syllabus, reading materials, problem sets, and downloadable PDF assets.",
            "slo_target": 99.90,
            "sli_type": "AVAILABILITY_HTTP",
            "tier": "TIER_2",
            "created_at": (now - timedelta(days=120)).isoformat()
        },
        {
            "id": "srv_api_gateway",
            "name": "API Gateway & Edge Proxy",
            "description": "Global TLS termination, edge rate limiting, exam traffic routing.",
            "slo_target": 99.99,
            "sli_type": "AVAILABILITY_HTTP",
            "tier": "TIER_1",
            "created_at": (now - timedelta(days=120)).isoformat()
        }
    ]

    # 3. SLI Metrics (24 time buckets per service = 120 records)
    # Reflect realistic exam surge: Exam Submission suffers severe breach during peak hours
    sli_metrics = []
    metric_id_counter = 1

    # Base characteristics for synthetic generation
    service_profiles = {
        "srv_exam_sub": {
            "base_req": 85000,
            "fail_rate_normal": 0.00005,
            "fail_rate_breach": 0.024, # 2.4% failure = SLI 97.6% (Severe breach of 99.99%)
            "resp_time_base": 120.0,
            "resp_time_spike": 1850.0
        },
        "srv_auth_login": {
            "base_req": 120000,
            "fail_rate_normal": 0.0002,
            "fail_rate_breach": 0.0035, # 99.65% vs 99.95% target
            "resp_time_base": 95.0,
            "resp_time_spike": 650.0
        },
        "srv_video_stream": {
            "base_req": 45000,
            "fail_rate_normal": 0.004, # 99.6% vs 99.5% (healthy for tier 2)
            "fail_rate_breach": 0.008,
            "resp_time_base": 320.0,
            "resp_time_spike": 940.0
        },
        "srv_course_content": {
            "base_req": 60000,
            "fail_rate_normal": 0.0005, # 99.95% vs 99.90% (healthy)
            "fail_rate_breach": 0.0012,
            "resp_time_base": 140.0,
            "resp_time_spike": 380.0
        },
        "srv_api_gateway": {
            "base_req": 310000,
            "fail_rate_normal": 0.00004, # 99.996% vs 99.99% (healthy)
            "fail_rate_breach": 0.0004,  # 99.96% slight breach
            "resp_time_base": 18.0,
            "resp_time_spike": 110.0
        }
    }

    # Generate 24 hourly buckets leading up to current time
    for hours_ago in range(24, 0, -1):
        bucket_time = now - timedelta(hours=hours_ago)
        # Peak exam surge occurred between 2 and 8 hours ago
        is_exam_surge = 2 <= hours_ago <= 8

        for srv in services:
            srv_id = srv["id"]
            prof = service_profiles[srv_id]
            
            # Exam Submission experiences intense failure surge during exam peak
            if srv_id == "srv_exam_sub" and is_exam_surge:
                fail_rate = prof["fail_rate_breach"]
                resp_time = prof["resp_time_spike"] + random.uniform(-100, 200)
                total_req = int(prof["base_req"] * random.uniform(2.5, 3.8)) # heavy surge
            elif srv_id == "srv_auth_login" and is_exam_surge:
                fail_rate = prof["fail_rate_breach"]
                resp_time = prof["resp_time_spike"] + random.uniform(-50, 100)
                total_req = int(prof["base_req"] * random.uniform(1.8, 2.4))
            else:
                fail_rate = prof["fail_rate_normal"] * random.uniform(0.8, 1.2)
                resp_time = prof["resp_time_base"] + random.uniform(-10, 20)
                total_req = int(prof["base_req"] * random.uniform(0.9, 1.3))

            failed_req = max(1, int(total_req * fail_rate))
            success_req = total_req - failed_req
            avail = round((success_req / total_req) * 100.0, 3)

            sli_metrics.append({
                "id": f"sli_{metric_id_counter:04d}",
                "service_id": srv_id,
                "timestamp": bucket_time.isoformat(),
                "total_requests": total_req,
                "successful_requests": success_req,
                "failed_requests": failed_req,
                "response_time": round(resp_time, 2),
                "availability": avail
            })
            metric_id_counter += 1

    # 4. Support Incidents (55 realistic records)
    incident_templates = [
        # Exam Submission incidents (Critical during exams)
        ("srv_exam_sub", "Student upload timeout during Midterm calculus submission", "CRITICAL", 3450, 48, "INVESTIGATING", True),
        ("srv_exam_sub", "Database transaction deadlock on submission ledger partition", "CRITICAL", 2900, 65, "OPEN", True),
        ("srv_exam_sub", "File integrity SHA-256 validation microservice 504 gateway timeout", "HIGH", 1200, 35, "RESOLVED", True),
        ("srv_exam_sub", "Late submission grace-period clock sync discrepancy", "HIGH", 850, 25, "MITIGATED", True),
        ("srv_exam_sub", "Payload size limitation rejection on PDF scan uploads", "MEDIUM", 340, 40, "RESOLVED", True),
        ("srv_exam_sub", "S3 multipart upload chunk retry storm", "HIGH", 1100, 52, "INVESTIGATING", True),
        ("srv_exam_sub", "Answer autosave websocket disconnect during biology final", "CRITICAL", 2100, 30, "OPEN", True),
        ("srv_exam_sub", "Export to grading system queue worker stall", "LOW", 0, 120, "RESOLVED", False),
        ("srv_exam_sub", "Submission confirmation email delivery delay", "LOW", 450, 15, "RESOLVED", False),
        ("srv_exam_sub", "Proctoring attachment upload retry failure", "MEDIUM", 620, 22, "RESOLVED", True),
        ("srv_exam_sub", "Exam state restore failed after browser crash", "HIGH", 780, 45, "OPEN", True),
        ("srv_exam_sub", "Student timer countdown desync on mobile browser", "MEDIUM", 510, 35, "MITIGATED", True),

        # Login Service incidents
        ("srv_auth_login", "SSO token verification bottleneck during 09:00 AM exam rush", "HIGH", 2800, 32, "MITIGATED", True),
        ("srv_auth_login", "MFA SMS provider gateway delivery latency", "HIGH", 1400, 45, "RESOLVED", True),
        ("srv_auth_login", "Proctoring session cookie invalidation under IP roam", "MEDIUM", 310, 20, "RESOLVED", True),
        ("srv_auth_login", "Redis session cache cluster memory threshold alert", "MEDIUM", 0, 15, "RESOLVED", False),
        ("srv_auth_login", "Concurrent session lock preventing re-entry after WiFi drop", "HIGH", 920, 40, "OPEN", True),
        ("srv_auth_login", "Password reset rate limiter false positives", "LOW", 45, 60, "RESOLVED", False),
        ("srv_auth_login", "OAuth2 callback redirect loop on Safari desktop", "MEDIUM", 180, 90, "RESOLVED", False),
        ("srv_auth_login", "SAML assertion signature expiration on University IdP", "HIGH", 650, 30, "RESOLVED", True),
        ("srv_auth_login", "Proctor token refresh race condition", "MEDIUM", 210, 25, "RESOLVED", True),
        ("srv_auth_login", "Hardware security key WebAuthn edge timeout", "LOW", 12, 110, "RESOLVED", False),

        # Video Streaming incidents
        ("srv_video_stream", "Lecture video playback stutter in engineering dorms", "LOW", 85, 120, "RESOLVED", False),
        ("srv_video_stream", "HLS transcoding queue backlog for morning review lectures", "MEDIUM", 230, 75, "RESOLVED", False),
        ("srv_video_stream", "Closed captions missing on chemistry review seminar", "LOW", 40, 180, "RESOLVED", False),
        ("srv_video_stream", "CDN cache miss spike on physics revision module", "LOW", 110, 45, "RESOLVED", False),
        ("srv_video_stream", "Variable bitrate ladder switching delay on iOS", "LOW", 60, 60, "RESOLVED", False),
        ("srv_video_stream", "Video seek thumbnail generator timeout", "LOW", 15, 300, "RESOLVED", False),
        ("srv_video_stream", "Video embed iframe security sandbox restriction on Safari", "LOW", 35, 90, "RESOLVED", False),
        ("srv_video_stream", "Analytics beacon drop on lecture completion tracking", "LOW", 0, 240, "RESOLVED", False),

        # Course Content Service incidents
        ("srv_course_content", "PDF reader rendering glitch on complex mathematical notation", "LOW", 95, 150, "RESOLVED", False),
        ("srv_course_content", "Formula sheet download 404 during exam preparation hour", "MEDIUM", 420, 18, "RESOLVED", True),
        ("srv_course_content", "Course syllabus file permission synchronization delay", "LOW", 50, 80, "RESOLVED", False),
        ("srv_course_content", "Assignment asset zip extraction error", "LOW", 25, 45, "RESOLVED", False),
        ("srv_course_content", "Full-text search indexer lagging behind new module uploads", "LOW", 0, 360, "RESOLVED", False),
        ("srv_course_content", "Module completion checkbox state out of sync", "LOW", 140, 120, "RESOLVED", False),
        ("srv_course_content", "Practice quiz question asset CDN 502 Bad Gateway", "MEDIUM", 310, 25, "RESOLVED", True),

        # API Gateway incidents
        ("srv_api_gateway", "Rate limiting burst threshold misconfiguration on exam routes", "HIGH", 1850, 15, "MITIGATED", True),
        ("srv_api_gateway", "TLS handshake negotiation latency spike on mobile carrier proxy", "MEDIUM", 520, 30, "RESOLVED", True),
        ("srv_api_gateway", "Edge WAF false positive rule blocking LaTeX equation submissions", "CRITICAL", 890, 22, "RESOLVED", True),
        ("srv_api_gateway", "HTTP/2 connection pooling exhaustion on backend proxy group", "HIGH", 1450, 28, "INVESTIGATING", True),
        ("srv_api_gateway", "CORS header mismatch on third-party proctoring widget", "MEDIUM", 210, 45, "RESOLVED", True),
        ("srv_api_gateway", "Keepalive timeout mismatch causing TCP resets", "MEDIUM", 340, 60, "RESOLVED", False),
        ("srv_api_gateway", "DDoS mitigation challenge triggered during synchronized exam launch", "HIGH", 2200, 12, "RESOLVED", True),

        # High Incident Volume with Low User Impact (Edge Case 3)
        ("srv_video_stream", "Internal telemetry ping timeout on unused CDN edge in Zurich", "LOW", 3, 240, "OPEN", False),
        ("srv_video_stream", "Chromecast discovery SSDP socket warning in dev build", "LOW", 2, 400, "RESOLVED", False),
        ("srv_video_stream", "Telemetry collector warning on deprecation header", "LOW", 1, 500, "RESOLVED", False),
        ("srv_video_stream", "Admin preview watermark alpha channel glitch", "LOW", 4, 180, "RESOLVED", False),
        ("srv_video_stream", "Subrip subtitle UTF-8 BOM encoding alert", "LOW", 6, 90, "RESOLVED", False),
        ("srv_video_stream", "HLS segment duration rounding drift log notice", "LOW", 0, 720, "RESOLVED", False),
        ("srv_course_content", "Internal markdown link validator 301 redirect notice", "LOW", 0, 600, "RESOLVED", False),
        ("srv_course_content", "Syllabus print stylesheet font fallback notice", "LOW", 5, 200, "RESOLVED", False),
        ("srv_auth_login", "Admin audit logger secondary replica failover probe", "LOW", 0, 45, "RESOLVED", False),
        ("srv_exam_sub", "Legacy exam archive reader cache miss in off-season course", "LOW", 2, 120, "RESOLVED", False),
        ("srv_api_gateway", "Static favicon request 404 from older iOS webclip", "LOW", 8, 1440, "RESOLVED", False),
    ]

    incidents = []
    for idx, (srv_id, title, sev, users_aff, dur, stat, exam_p) in enumerate(incident_templates, start=1):
        inc_time = now - timedelta(hours=random.randint(1, 48), minutes=random.randint(0, 59))
        incidents.append({
            "id": f"inc_rec_{idx:03d}",
            "incident_id": f"INC-2026-{1000 + idx}",
            "service_id": srv_id,
            "title": title,
            "severity": sev,
            "users_affected": users_aff,
            "duration_minutes": dur,
            "status": stat,
            "exam_period": exam_p,
            "created_at": inc_time.isoformat()
        })

    # 5. Feature Plans (16 items)
    feature_plans = [
        {
            "id": "feat_01",
            "feature_name": "AI Study Buddy & Exam Readiness Summaries",
            "description": "Interactive Gemini-powered personalized exam study guides.",
            "team": "Pedagogy AI Team",
            "business_priority": "HIGH",
            "estimated_effort": "LARGE",
            "status": "IN_PROGRESS"
        },
        {
            "id": "feat_02",
            "feature_name": "Gamified Milestone Badges for Course Streaks",
            "description": "Badges and rewards for continuous lecture completion.",
            "team": "Student Engagement Team",
            "business_priority": "MEDIUM",
            "estimated_effort": "MEDIUM",
            "status": "BACKLOG"
        },
        {
            "id": "feat_03",
            "feature_name": "Dark Mode & Accessibility Theme Palette",
            "description": "High-contrast themes for low-vision and night study sessions.",
            "team": "UI/UX Core Team",
            "business_priority": "HIGH",
            "estimated_effort": "SMALL",
            "status": "COMPLETED"
        },
        {
            "id": "feat_04",
            "feature_name": "Peer-to-Peer Study Group Video Breakouts",
            "description": "WebRTC breakout rooms for collaborative student problem solving.",
            "team": "Collaboration Team",
            "business_priority": "LOW",
            "estimated_effort": "XLARGE",
            "status": "BACKLOG"
        },
        {
            "id": "feat_05",
            "feature_name": "Latex Math Formula Live Equation Editor",
            "description": "Visual formula builder for STEM problem sets.",
            "team": "Content Authoring Team",
            "business_priority": "MEDIUM",
            "estimated_effort": "MEDIUM",
            "status": "IN_PROGRESS"
        },
        {
            "id": "feat_06",
            "feature_name": "Automated Code Submission Sandbox (Python/C++)",
            "description": "Secure containerized compiler for coding exam auto-grading.",
            "team": "Grading Systems Team",
            "business_priority": "CRITICAL",
            "estimated_effort": "XLARGE",
            "status": "IN_PROGRESS"
        },
        {
            "id": "feat_07",
            "feature_name": "Offline Video Download for Mobile App",
            "description": "Encrypted offline caching for students with spotty home broadband.",
            "team": "Mobile App Team",
            "business_priority": "HIGH",
            "estimated_effort": "LARGE",
            "status": "BACKLOG"
        },
        {
            "id": "feat_08",
            "feature_name": "Proctoring Screen Share & AI Gaze Tracking",
            "description": "Automated exam integrity anomaly detection.",
            "team": "Assessment Security Team",
            "business_priority": "CRITICAL",
            "estimated_effort": "LARGE",
            "status": "IN_PROGRESS"
        },
        {
            "id": "feat_09",
            "feature_name": "Course Certificate Blockchain Verification",
            "description": "Verifiable cryptographic hash on completion diploma.",
            "team": "Credentials Team",
            "business_priority": "LOW",
            "estimated_effort": "MEDIUM",
            "status": "BACKLOG"
        },
        {
            "id": "feat_10",
            "feature_name": "Interactive Quiz Polls in Live Lectures",
            "description": "Instant classroom polling and attendance verification.",
            "team": "Classroom Interactive Team",
            "business_priority": "MEDIUM",
            "estimated_effort": "MEDIUM",
            "status": "BACKLOG"
        },
        {
            "id": "feat_11",
            "feature_name": "Instructor Audio Feedback on Exam Submissions",
            "description": "Allow professors to attach 60-second audio critiques.",
            "team": "Grading Systems Team",
            "business_priority": "LOW",
            "estimated_effort": "SMALL",
            "status": "BACKLOG"
        },
        {
            "id": "feat_12",
            "feature_name": "Multi-Lingual Subtitle Translation (12 Languages)",
            "description": "Neural translation of lecture transcripts.",
            "team": "Global Localization Team",
            "business_priority": "MEDIUM",
            "estimated_effort": "LARGE",
            "status": "IN_PROGRESS"
        },
        {
            "id": "feat_13",
            "feature_name": "Calendar Synchronization with Google & Outlook",
            "description": "Auto-sync exam deadlines into student personal calendars.",
            "team": "Productivity Team",
            "business_priority": "HIGH",
            "estimated_effort": "SMALL",
            "status": "COMPLETED"
        },
        {
            "id": "feat_14",
            "feature_name": "Podcast Feed Generator from Audio Lectures",
            "description": "Generate private RSS feeds for mobile commute listening.",
            "team": "Content Distribution Team",
            "business_priority": "LOW",
            "estimated_effort": "SMALL",
            "status": "BACKLOG"
        },
        {
            "id": "feat_15",
            "feature_name": "Automated Plagiarism Detection Engine",
            "description": "Cross-submission vector similarity indexer.",
            "team": "Assessment Security Team",
            "business_priority": "HIGH",
            "estimated_effort": "LARGE",
            "status": "BLOCKED"
        },
        {
            "id": "feat_16",
            "feature_name": "Campus Discussion Forum with Upvoting",
            "description": "StackOverflow-style Q&A for difficult exam practice problems.",
            "team": "Community Team",
            "business_priority": "MEDIUM",
            "estimated_effort": "MEDIUM",
            "status": "BACKLOG"
        }
    ]

    # 6. Reliability Tasks (16 tasks directly mapped to services)
    reliability_tasks = [
        {
            "id": "rel_task_01",
            "task_name": "Partition Exam Submission DB & Implement Async Queueing",
            "description": "Eliminate database lock contention on submission ledger during exam turn-in spikes. Introduce Kafka/BullMQ async ingestion buffer.",
            "service_id": "srv_exam_sub",
            "priority": "CRITICAL",
            "status": "TODO",
            "estimated_effort": "LARGE"
        },
        {
            "id": "rel_task_02",
            "task_name": "Implement Resilient Client-Side Answer Auto-Cache & Offline Sync",
            "description": "Store answers in IndexedDB locally so students never lose progress if network drops during exam submission.",
            "service_id": "srv_exam_sub",
            "priority": "CRITICAL",
            "status": "IN_PROGRESS",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_03",
            "task_name": "S3 Multipart Upload Circuit Breaker & Direct S3 Presigned URLs",
            "description": "Bypass API backend servers for heavy PDF/exam scan uploads. Upload directly to object storage via presigned URLs.",
            "service_id": "srv_exam_sub",
            "priority": "HIGH",
            "status": "TODO",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_04",
            "task_name": "Scale Redis Session Cluster & Optimize SSO Token Caching",
            "description": "Increase Redis read-replicas to prevent 09:00 AM synchronized exam login bottleneck and session dropouts.",
            "service_id": "srv_auth_login",
            "priority": "HIGH",
            "status": "TODO",
            "estimated_effort": "SMALL"
        },
        {
            "id": "rel_task_05",
            "task_name": "Graceful Fallback Auth Token Grace Period on WiFi Reconnect",
            "description": "Permit a 60-second grace window during active exams when student laptop switches access points or cellular hotspot.",
            "service_id": "srv_auth_login",
            "priority": "HIGH",
            "status": "TODO",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_06",
            "task_name": "WAF Rule Tuning for STEM LaTeX / Math Syntax in Requests",
            "description": "Prevent Cloudflare/Edge WAF false positives from blocking math equations containing SQL-like or script characters.",
            "service_id": "srv_api_gateway",
            "priority": "HIGH",
            "status": "TODO",
            "estimated_effort": "SMALL"
        },
        {
            "id": "rel_task_07",
            "task_name": "Tune Edge Gateway Keep-Alive & HTTP/2 Ingress Connection Pool",
            "description": "Increase backend proxy keep-alive sockets to eliminate TCP handshake resets during synchronized 5,000-student exam starts.",
            "service_id": "srv_api_gateway",
            "priority": "MEDIUM",
            "status": "TODO",
            "estimated_effort": "SMALL"
        },
        {
            "id": "rel_task_08",
            "task_name": "Multi-CDN Failover Routing for Course Syllabus & Formula Sheets",
            "description": "Ensure static exam formula PDFs and reference documents remain reachable even if primary CDN edge degrades.",
            "service_id": "srv_course_content",
            "priority": "MEDIUM",
            "status": "BACKLOG",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_09",
            "task_name": "Optimize HLS Video Segment Caching on Edge Edge-Locations",
            "description": "Warm CDN cache for high-demand exam prep lectures 24 hours before major midterms.",
            "service_id": "srv_video_stream",
            "priority": "LOW",
            "status": "BACKLOG",
            "estimated_effort": "SMALL"
        },
        {
            "id": "rel_task_10",
            "task_name": "Automate Canary Deployments with Automated Error-Budget Rollbacks",
            "description": "Automatically rollback any deployment if 5-minute error budget burn rate exceeds 10x.",
            "service_id": "srv_api_gateway",
            "priority": "HIGH",
            "status": "TODO",
            "estimated_effort": "LARGE"
        },
        {
            "id": "rel_task_11",
            "task_name": "Database Deadlock Monitoring & Connection Pool Throttling",
            "description": "Add pgBouncer connection pooling and proactive lock query termination for slow analytics queries during exam hours.",
            "service_id": "srv_exam_sub",
            "priority": "CRITICAL",
            "status": "TODO",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_12",
            "task_name": "Fix Transcoding Queue Lag for Video Replays",
            "description": "Offload non-critical lecture transcoding to off-peak worker spot instances.",
            "service_id": "srv_video_stream",
            "priority": "LOW",
            "status": "BACKLOG",
            "estimated_effort": "SMALL"
        },
        {
            "id": "rel_task_13",
            "task_name": "Resolve Subtitle Encoding BOM Glitch",
            "description": "Fix character encoding parser in video player for foreign language course subtitles.",
            "service_id": "srv_video_stream",
            "priority": "LOW",
            "status": "BACKLOG",
            "estimated_effort": "SMALL"
        },
        {
            "id": "rel_task_14",
            "task_name": "Upgrade Course Content Search Engine Node Cluster",
            "description": "Add read replicas to search cluster to absorb pre-exam revision search spikes.",
            "service_id": "srv_course_content",
            "priority": "MEDIUM",
            "status": "BACKLOG",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_15",
            "task_name": "Implement Adaptive Rate-Limiting by Student Role & Active Exam Status",
            "description": "Guarantee zero rate-limiting for active exam test-takers while strictly throttling bot scrapers and crawling.",
            "service_id": "srv_api_gateway",
            "priority": "HIGH",
            "status": "TODO",
            "estimated_effort": "MEDIUM"
        },
        {
            "id": "rel_task_16",
            "task_name": "Setup Dedicated Exam Emergency Hotline Telemetry Ingestion",
            "description": "Ingest proctoring support desk phone tickets directly into real-time Prometheus alert pipeline.",
            "service_id": "srv_auth_login",
            "priority": "MEDIUM",
            "status": "DONE",
            "estimated_effort": "SMALL"
        }
    ]

    # 7. Configurable Rules (Default weights from prompt)
    rules = [
        {
            "id": "rule_user_impact",
            "rule_name": "User Impact",
            "weight": 30.0,
            "threshold": 200.0, # >200 affected students triggers high impact
            "enabled": True,
            "description": "Measures total students affected, outage duration, and blast radius of the service disruption."
        },
        {
            "id": "rule_slo_breach",
            "rule_name": "SLO Breach",
            "weight": 25.0,
            "threshold": 0.01,  # Any deviation below target SLO
            "enabled": True,
            "description": "Measures distance between current rolling SLI availability and contracted Service Level Objective target."
        },
        {
            "id": "rule_error_budget",
            "rule_name": "Error Budget",
            "weight": 20.0,
            "threshold": 70.0,  # Warning at 70%, Critical at 100%
            "enabled": True,
            "description": "Calculates consumed error budget percentage and burn-rate exhaustion risks."
        },
        {
            "id": "rule_incident_severity",
            "rule_name": "Incident Severity",
            "weight": 15.0,
            "threshold": 2.0,   # >= 2 critical or high incidents
            "enabled": True,
            "description": "Weighted severity score based on logged support tickets and telemetry alerts."
        },
        {
            "id": "rule_exam_period",
            "rule_name": "Examination Period",
            "weight": 10.0,
            "threshold": 1.0,   # Active exam period multiplier
            "enabled": True,
            "description": "Prioritizes mission-critical assessment workflows when examination mode is active across the university."
        }
    ]

    data = {
        "metadata": {
            "environment": "DEMO / SYNTHETIC DATA",
            "generated_at": now.isoformat(),
            "target_platform": "Online Learning Platform Examination Subsystem",
            "total_services": len(services),
            "total_sli_records": len(sli_metrics),
            "total_incidents": len(incidents),
            "total_feature_plans": len(feature_plans),
            "total_reliability_tasks": len(reliability_tasks),
            "total_rules": len(rules)
        },
        "users": users,
        "services": services,
        "sli_metrics": sli_metrics,
        "incidents": incidents,
        "feature_plans": feature_plans,
        "reliability_tasks": reliability_tasks,
        "rules": rules,
        "decisions": [
            {
                "id": "dec_seed_01",
                "recommendation_id": "rec_seed_archive",
                "user_id": "usr_mgr_1",
                "user_name": "Elena Rostova",
                "decision": "OVERRIDDEN",
                "override_reason": "Temporary load-shedding proxy rule deployed at edge; full database re-partitioning deferred to scheduled maintenance window post-finals.",
                "task_name": "Partition Exam Submission DB & Implement Async Queueing",
                "service_name": "Exam Submission Service",
                "created_at": (now - timedelta(hours=3, minutes=15)).isoformat()
            }
        ]
    }

    return data


if __name__ == "__main__":
    os.makedirs("seed", exist_ok=True)
    dataset = generate_synthetic_data()
    output_path = "seed/seed_data.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"[OK] Generated {dataset['metadata']['environment']} at {output_path}")
    print(f"     Services: {dataset['metadata']['total_services']}")
    print(f"     SLI Records: {dataset['metadata']['total_sli_records']}")
    print(f"     Incidents: {dataset['metadata']['total_incidents']}")
    print(f"     Feature Plans: {dataset['metadata']['total_feature_plans']}")
    print(f"     Reliability Tasks: {dataset['metadata']['total_reliability_tasks']}")
