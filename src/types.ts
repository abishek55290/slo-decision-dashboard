/**
 * TypeScript Data Models and Interfaces
 * SLO Decision Dashboard for Examination-Heavy Learning Platforms
 */

export type UserRole = 'ENGINEER' | 'ENGINEERING_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title?: string;
}

export type ServiceTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface Service {
  id: string;
  name: string;
  description: string;
  slo_target: number; // e.g., 99.99
  sli_type: string;
  tier: ServiceTier;
  created_at: string;
}

export interface SLIMetric {
  id: string;
  service_id: string;
  timestamp: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  response_time: number; // ms
  availability: number; // %
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';

export interface Incident {
  id: string;
  incident_id: string;
  service_id: string;
  title: string;
  severity: IncidentSeverity;
  users_affected: number;
  duration_minutes: number;
  status: IncidentStatus;
  exam_period: boolean;
  created_at: string;
}

export type FeaturePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FeatureEffort = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
export type FeatureStatus = 'BACKLOG' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';

export interface FeaturePlan {
  id: string;
  feature_name: string;
  description: string;
  team: string;
  business_priority: FeaturePriority;
  estimated_effort: FeatureEffort;
  status: FeatureStatus;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface ReliabilityTask {
  id: string;
  task_name: string;
  description: string;
  service_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_effort: FeatureEffort;
}

export interface ConfigurableRule {
  id: string;
  rule_name: string;
  weight: number; // e.g. 30 for 30%
  threshold: number;
  enabled: boolean;
  description?: string;
  updated_at?: string;
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'OVERRIDDEN';

export interface ScoringContributions {
  user_impact: number;
  slo_breach: number;
  error_budget: number;
  incident_severity: number;
  exam_period: number;
}

export interface RecommendationEvidence {
  service_name: string;
  users_affected: number;
  current_sli: number;
  slo_target: number;
  slo_breached: boolean;
  error_budget_used_pct: number;
  error_budget_remaining_pct: number;
  error_budget_status: 'GREEN' | 'YELLOW' | 'RED';
  total_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  examination_period_active: boolean;
  scoring_breakdown: ScoringContributions;
  max_possible_breakdown: ScoringContributions;
}

export interface DecisionRecord {
  id: string;
  recommendation_id: string;
  user_id: string;
  user_name: string;
  decision: 'APPROVED' | 'OVERRIDDEN';
  override_reason?: string | null;
  task_name?: string;
  service_name?: string;
  created_at: string;
}

export interface Recommendation {
  id: string;
  task_id: string;
  task_name: string;
  task_description: string;
  task_status: TaskStatus;
  estimated_effort: FeatureEffort;
  service_id: string;
  service_name: string;
  priority_score: number;
  priority_level: PriorityLevel;
  requires_human_approval: boolean;
  explanation: string;
  action_summary: string;
  evidence: RecommendationEvidence;
  status: RecommendationStatus;
  decision?: DecisionRecord | null;
  generated_at: string;
}

export interface EvaluationMetrics {
  metric_name: string;
  formula: string;
  baseline_percentage: number;
  target_percentage: number;
  measured_result_percentage: number;
  target_met: boolean;
  difference_vs_baseline: number;
  total_priorities_evaluated: number;
  justified_count: number;
  unjustified_or_low_impact_count: number;
}

export interface ServiceSLOSummary {
  service_id: string;
  service_name: string;
  description: string;
  tier: ServiceTier;
  slo_target: number;
  current_sli: number;
  is_breached: boolean;
  error_budget_used_pct: number;
  error_budget_remaining_pct: number;
  error_budget_status: 'GREEN' | 'YELLOW' | 'RED';
  total_requests: number;
  failed_requests: number;
  total_incidents: number;
  users_affected: number;
}

export interface ErrorAnalysisItem {
  id: string;
  title: string;
  category: 'OVER_PRIORITIZATION' | 'UNDER_PRIORITIZATION' | 'MISSING_DATA' | 'RANKING_EDGE' | 'TIE_BREAK';
  observed_behavior: string;
  root_cause: string;
  mitigation: string;
  system_guard: string;
}

export interface TestResultItem {
  id: string;
  test_name: string;
  category: 'NORMAL' | 'ADVERSARIAL' | 'EDGE_CASE';
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  duration_ms: number;
}
