-- PostgreSQL Database Schema for SLO Decision Dashboard
-- Platform: Examination-Heavy Online Learning System

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('ENGINEER', 'ENGINEERING_MANAGER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    slo_target NUMERIC(5, 2) NOT NULL, -- e.g. 99.90, 99.99
    sli_type VARCHAR(64) NOT NULL,     -- e.g. 'AVAILABILITY_HTTP', 'LATENCY_P99'
    tier VARCHAR(16) NOT NULL DEFAULT 'TIER_1', -- TIER_1 (Exam critical), TIER_2, TIER_3
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SLI Metrics Table
CREATE TABLE IF NOT EXISTS sli_metrics (
    id VARCHAR(64) PRIMARY KEY,
    service_id VARCHAR(64) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    total_requests BIGINT NOT NULL,
    successful_requests BIGINT NOT NULL,
    failed_requests BIGINT NOT NULL,
    response_time NUMERIC(8, 2) NOT NULL, -- milliseconds (p95 / avg)
    availability NUMERIC(6, 3) NOT NULL   -- calculated: (successful / total) * 100
);

-- 4. Support Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'INC-2026-4401'
    service_id VARCHAR(64) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title VARCHAR(256) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    users_affected INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL CHECK (status IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED')),
    exam_period BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Feature Plans Table
CREATE TABLE IF NOT EXISTS feature_plans (
    id VARCHAR(64) PRIMARY KEY,
    feature_name VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    team VARCHAR(128) NOT NULL,
    business_priority VARCHAR(16) NOT NULL CHECK (business_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    estimated_effort VARCHAR(16) NOT NULL CHECK (estimated_effort IN ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('BACKLOG', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Reliability Tasks Table
CREATE TABLE IF NOT EXISTS reliability_tasks (
    id VARCHAR(64) PRIMARY KEY,
    task_name VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    service_id VARCHAR(64) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    priority VARCHAR(16) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE')),
    estimated_effort VARCHAR(16) NOT NULL CHECK (estimated_effort IN ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Configurable Rules Table
CREATE TABLE IF NOT EXISTS rules (
    id VARCHAR(64) PRIMARY KEY,
    rule_name VARCHAR(128) NOT NULL,
    weight NUMERIC(5, 2) NOT NULL,       -- e.g. 30.00 for 30%
    threshold NUMERIC(5, 2) NOT NULL,    -- threshold trigger
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL REFERENCES reliability_tasks(id) ON DELETE CASCADE,
    service_id VARCHAR(64) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    priority_score NUMERIC(5, 2) NOT NULL,
    priority_level VARCHAR(16) NOT NULL CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    explanation TEXT NOT NULL,
    evidence JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'OVERRIDDEN')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Human Decisions Table
CREATE TABLE IF NOT EXISTS decisions (
    id VARCHAR(64) PRIMARY KEY,
    recommendation_id VARCHAR(64) NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(32) NOT NULL CHECK (decision IN ('APPROVED', 'OVERRIDDEN')),
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for fast metric queries during exam load
CREATE INDEX IF NOT EXISTS idx_sli_service_timestamp ON sli_metrics(service_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_service ON incidents(service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_exam_period ON incidents(exam_period);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
