/**
 * TypeScript Implementation of SLO Decision Engine
 * Mirrors decision_engine/engine.py with exact mathematical parity.
 */

import {
  ConfigurableRule,
  Incident,
  PriorityLevel,
  Recommendation,
  RecommendationEvidence,
  ReliabilityTask,
  ScoringContributions,
  Service,
  SLIMetric,
  DecisionRecord
} from '../types';

export function calculateUserImpact(
  usersAffected: number,
  durationMinutes: number = 60,
  severityMultiplier: number = 1.0,
  examActive: boolean = false
): number {
  if (usersAffected <= 0) return 0.0;

  // 5,000 students affected during exam is near maximum operational impact
  const baseRatio = Math.min(usersAffected / 5000.0, 1.0) * 70.0;
  const durationFactor = Math.min(durationMinutes / 120.0, 1.0) * 20.0;
  const examBonus = (examActive && usersAffected > 50) ? 10.0 : 0.0;

  const rawScore = (baseRatio + durationFactor + examBonus) * severityMultiplier;
  return Number(Math.min(Math.max(rawScore, 0.0), 100.0).toFixed(2));
}

export function calculateSloBreachScore(sloTarget: number, currentSli: number): number {
  if (sloTarget <= 0) return 0.0;
  if (currentSli >= sloTarget) return 0.0;

  const allowedErrorMargin = Math.max(100.0 - sloTarget, 0.01);
  const actualError = Math.max(sloTarget - currentSli, 0.0);
  const breachRatio = actualError / allowedErrorMargin;

  // Exponential saturation curve
  const score = (1.0 - Math.exp(-1.2 * breachRatio)) * 100.0;
  return Number(Math.min(Math.max(score, 0.0), 100.0).toFixed(2));
}

export function calculateErrorBudgetScore(
  sloTarget: number,
  successfulRequests: number,
  failedRequests: number
): {
  total_requests: number;
  failed_requests: number;
  budget_consumed_pct: number;
  budget_remaining_pct: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  score: number;
} {
  const totalRequests = successfulRequests + failedRequests;
  if (totalRequests <= 0) {
    return {
      total_requests: 0,
      failed_requests: 0,
      budget_consumed_pct: 0.0,
      budget_remaining_pct: 100.0,
      status: 'GREEN',
      score: 0.0
    };
  }

  const allowedFailureRate = Math.max((100.0 - sloTarget) / 100.0, 0.0001);
  const actualFailureRate = failedRequests / totalRequests;
  const budgetConsumedPct = (actualFailureRate / allowedFailureRate) * 100.0;
  const budgetRemainingPct = Math.max(0.0, 100.0 - budgetConsumedPct);

  let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  let score = 0.0;

  if (budgetConsumedPct >= 100.0) {
    status = 'RED';
    score = 100.0;
  } else if (budgetConsumedPct >= 70.0) {
    status = 'YELLOW';
    score = 50.0 + ((budgetConsumedPct - 70.0) / 30.0) * 45.0;
  } else {
    status = 'GREEN';
    score = (budgetConsumedPct / 70.0) * 45.0;
  }

  return {
    total_requests: totalRequests,
    failed_requests: failedRequests,
    budget_consumed_pct: Number(budgetConsumedPct.toFixed(2)),
    budget_remaining_pct: Number(budgetRemainingPct.toFixed(2)),
    status,
    score: Number(score.toFixed(2))
  };
}

export function calculateIncidentScore(
  incidents: Incident[],
  examActive: boolean = false
): {
  total_incidents: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  score: number;
} {
  if (!incidents || incidents.length === 0) {
    return {
      total_incidents: 0,
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
      score: 0.0
    };
  }

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.severity === 'HIGH').length;
  const mediumCount = incidents.filter(i => i.severity === 'MEDIUM').length;
  const lowCount = incidents.filter(i => i.severity === 'LOW').length;

  const weightedSum = (
    criticalCount * 10.0 +
    highCount * 6.0 +
    mediumCount * 3.0 +
    lowCount * 1.0
  );

  let rawScore = Math.min(weightedSum / 40.0, 1.0) * 100.0;
  if (examActive && (criticalCount > 0 || highCount > 0)) {
    rawScore = Math.min(rawScore * 1.15, 100.0);
  }

  return {
    total_incidents: incidents.length,
    critical_count: criticalCount,
    high_count: highCount,
    medium_count: mediumCount,
    low_count: lowCount,
    score: Number(rawScore.toFixed(2))
  };
}

export function calculateExamPeriodScore(
  serviceTier: string,
  hasExamIncidents: boolean,
  examModeActive: boolean
): number {
  if (!examModeActive && !hasExamIncidents) {
    return 15.0;
  }

  if (serviceTier === 'TIER_1') {
    return (examModeActive || hasExamIncidents) ? 100.0 : 40.0;
  } else if (serviceTier === 'TIER_2') {
    return examModeActive ? 65.0 : 25.0;
  } else {
    return examModeActive ? 35.0 : 10.0;
  }
}

export function calculatePriorityScore(
  scores: {
    user_impact: number;
    slo_breach: number;
    error_budget: number;
    incident_severity: number;
    exam_period: number;
  },
  weights: Record<string, number>
): {
  priority_score: number;
  priority_level: PriorityLevel;
  requires_human_approval: boolean;
  contributions: ScoringContributions;
  max_possible_points: ScoringContributions;
} {
  let w_ui = Math.max(0, weights.user_impact ?? 30.0);
  let w_slo = Math.max(0, weights.slo_breach ?? 25.0);
  let w_eb = Math.max(0, weights.error_budget ?? 20.0);
  let w_inc = Math.max(0, weights.incident_severity ?? 15.0);
  let w_exam = Math.max(0, weights.exam_period ?? 10.0);

  let totalWeight = w_ui + w_slo + w_eb + w_inc + w_exam;
  if (totalWeight <= 0) {
    totalWeight = 100.0;
    w_ui = 30.0;
    w_slo = 25.0;
    w_eb = 20.0;
    w_inc = 15.0;
    w_exam = 10.0;
  }

  const norm_w_ui = w_ui / totalWeight;
  const norm_w_slo = w_slo / totalWeight;
  const norm_w_eb = w_eb / totalWeight;
  const norm_w_inc = w_inc / totalWeight;
  const norm_w_exam = w_exam / totalWeight;

  const contrib_ui = scores.user_impact * norm_w_ui;
  const contrib_slo = scores.slo_breach * norm_w_slo;
  const contrib_eb = scores.error_budget * norm_w_eb;
  const contrib_inc = scores.incident_severity * norm_w_inc;
  const contrib_exam = scores.exam_period * norm_w_exam;

  const total = contrib_ui + contrib_slo + contrib_eb + contrib_inc + contrib_exam;
  const finalScore = Number(Math.min(Math.max(total, 0.0), 100.0).toFixed(2));

  let priority_level: PriorityLevel = 'LOW';
  let requires_human_approval = false;

  if (finalScore >= 75.0) {
    priority_level = 'CRITICAL';
    requires_human_approval = true;
  } else if (finalScore >= 55.0) {
    priority_level = 'HIGH';
    requires_human_approval = true;
  } else if (finalScore >= 35.0) {
    priority_level = 'MEDIUM';
    requires_human_approval = false;
  } else {
    priority_level = 'LOW';
    requires_human_approval = false;
  }

  return {
    priority_score: finalScore,
    priority_level,
    requires_human_approval,
    contributions: {
      user_impact: Number(contrib_ui.toFixed(2)),
      slo_breach: Number(contrib_slo.toFixed(2)),
      error_budget: Number(contrib_eb.toFixed(2)),
      incident_severity: Number(contrib_inc.toFixed(2)),
      exam_period: Number(contrib_exam.toFixed(2))
    },
    max_possible_points: {
      user_impact: Number((norm_w_ui * 100.0).toFixed(2)),
      slo_breach: Number((norm_w_slo * 100.0).toFixed(2)),
      error_budget: Number((norm_w_eb * 100.0).toFixed(2)),
      incident_severity: Number((norm_w_inc * 100.0).toFixed(2)),
      exam_period: Number((norm_w_exam * 100.0).toFixed(2))
    }
  };
}

export function generateFullRecommendations(
  tasks: ReliabilityTask[],
  services: Service[],
  sliMetrics: SLIMetric[],
  incidents: Incident[],
  rules: ConfigurableRule[],
  decisions: DecisionRecord[],
  examMode: boolean = true
): Recommendation[] {
  const serviceMap = new Map(services.map(s => [s.id, s]));

  const weights: Record<string, number> = {};
  for (const r of rules) {
    const key = r.id.replace('rule_', '');
    weights[key] = r.enabled ? r.weight : 0.0;
  }

  const recommendations: Recommendation[] = [];

  for (const task of tasks) {
    const srv = serviceMap.get(task.service_id) || {
      id: task.service_id,
      name: 'Generic Service',
      description: '',
      slo_target: 99.9,
      sli_type: 'AVAILABILITY_HTTP',
      tier: 'TIER_2' as const,
      created_at: new Date().toISOString()
    };

    const srvMetrics = sliMetrics.filter(m => m.service_id === srv.id);
    const totalReq = srvMetrics.reduce((acc, m) => acc + m.total_requests, 0);
    const succReq = srvMetrics.reduce((acc, m) => acc + m.successful_requests, 0);
    const failReq = srvMetrics.reduce((acc, m) => acc + m.failed_requests, 0);
    const currentSli = totalReq > 0 ? Number(((succReq / totalReq) * 100.0).toFixed(3)) : 100.0;

    const ebData = calculateErrorBudgetScore(srv.slo_target, succReq, failReq);
    const srvIncidents = incidents.filter(i => i.service_id === srv.id);
    const incData = calculateIncidentScore(srvIncidents, examMode);

    const usersAffected = srvIncidents.reduce((acc, i) => acc + i.users_affected, 0);
    const maxDuration = Math.max(...srvIncidents.map(i => i.duration_minutes), 30);
    const hasExamInc = srvIncidents.some(i => i.exam_period);

    const uiScore = calculateUserImpact(usersAffected, maxDuration, 1.0, examMode);
    const sloScore = calculateSloBreachScore(srv.slo_target, currentSli);
    const examScore = calculateExamPeriodScore(srv.tier, hasExamInc, examMode);

    const factorScores = {
      user_impact: uiScore,
      slo_breach: sloScore,
      error_budget: ebData.score,
      incident_severity: incData.score,
      exam_period: examScore
    };

    const scoreResult = calculatePriorityScore(factorScores, weights);
    const isBreached = currentSli < srv.slo_target;

    const evidence: RecommendationEvidence = {
      service_name: srv.name,
      users_affected: usersAffected,
      current_sli: currentSli,
      slo_target: srv.slo_target,
      slo_breached: isBreached,
      error_budget_used_pct: ebData.budget_consumed_pct,
      error_budget_remaining_pct: ebData.budget_remaining_pct,
      error_budget_status: ebData.status,
      total_incidents: incData.total_incidents,
      critical_incidents: incData.critical_count,
      high_incidents: incData.high_count,
      examination_period_active: examMode,
      scoring_breakdown: scoreResult.contributions,
      max_possible_breakdown: scoreResult.max_possible_points
    };

    const breachText = isBreached
      ? `has breached its ${srv.slo_target}% SLO (currently ${currentSli}%)`
      : `is maintaining its ${srv.slo_target}% SLO (${currentSli}%)`;

    const examText = examMode ? 'during an active examination period' : 'under standard semester load';

    const explanation = `Prioritize ${srv.name} reliability task '${task.task_name}' because it affects ${usersAffected.toLocaleString()} students, ${breachText}, has consumed ${ebData.budget_consumed_pct}% of its error budget, and has logged ${incData.total_incidents} support incidents ${examText}.`;

    const actionSummary = `Fix ${task.task_name} on ${srv.name} to stabilize student exam flow and restore error budget.`;

    const recId = `rec_${task.id}`;
    const latestDecision = decisions
      .slice()
      .reverse()
      .find(d => d.recommendation_id === recId);

    let statusVal: 'PENDING' | 'APPROVED' | 'OVERRIDDEN' = 'PENDING';
    if (latestDecision) {
      statusVal = latestDecision.decision;
    }

    recommendations.push({
      id: recId,
      task_id: task.id,
      task_name: task.task_name,
      task_description: task.description,
      task_status: task.status,
      estimated_effort: task.estimated_effort,
      service_id: srv.id,
      service_name: srv.name,
      priority_score: scoreResult.priority_score,
      priority_level: scoreResult.priority_level,
      requires_human_approval: scoreResult.requires_human_approval,
      explanation,
      action_summary: actionSummary,
      evidence,
      status: statusVal,
      decision: latestDecision || null,
      generated_at: new Date().toISOString()
    });
  }

  return recommendations.sort((a, b) => b.priority_score - a.priority_score);
}
