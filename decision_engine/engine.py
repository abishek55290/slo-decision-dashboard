"""
SLO Decision Engine for Reliability Prioritization
Examination-Heavy Online Learning Platforms

This module calculates mathematically grounded, explainable priority scores
by combining Service Level Indicators (SLIs), Service Level Objectives (SLOs),
Error Budget burn rates, Support Incidents, User Impact, and Exam Criticality.
"""

from typing import Dict, List, Any, Optional
import math


def calculate_user_impact(
    users_affected: int,
    total_active_students: int = 50000,
    duration_minutes: int = 60,
    severity_multiplier: float = 1.0,
    exam_active: bool = False
) -> float:
    """
    Calculates user impact normalized to a 0-100 scale.
    Takes into account student reach, duration of downtime, and exam context.
    """
    if users_affected <= 0:
        return 0.0

    # User volume saturation curve (logarithmic scaling above baseline threshold)
    # 5,000 students affected during an exam is near maximum operational impact
    base_ratio = min(users_affected / 5000.0, 1.0) * 70.0
    
    # Duration factor (up to +20 points for lingering outages)
    duration_factor = min(duration_minutes / 120.0, 1.0) * 20.0

    # Exam multiplier if users are impacted during live assessments
    exam_bonus = 10.0 if (exam_active and users_affected > 50) else 0.0

    raw_score = (base_ratio + duration_factor + exam_bonus) * severity_multiplier
    return round(min(max(raw_score, 0.0), 100.0), 2)


def calculate_slo_breach_score(slo_target: float, current_sli: float) -> float:
    """
    Calculates SLO breach severity normalized to 0-100.
    If current_sli >= slo_target, breach score is 0.0.
    If current_sli < slo_target, score increases sharply based on distance from target.
    """
    if slo_target <= 0:
        return 0.0

    # No breach
    if current_sli >= slo_target:
        return 0.0

    allowed_error_margin = max(100.0 - slo_target, 0.01)
    actual_error = max(slo_target - current_sli, 0.0)

    # Ratio of how many multiples of allowed error margin were breached
    breach_ratio = actual_error / allowed_error_margin

    # Scaled to 0-100: 1x margin = 50 points, 2x margin = 80 points, 3x+ margin = 100 points
    score = (1.0 - math.exp(-1.2 * breach_ratio)) * 100.0
    return round(min(max(score, 0.0), 100.0), 2)


def calculate_error_budget_score(
    slo_target: float,
    successful_requests: int,
    failed_requests: int
) -> Dict[str, Any]:
    """
    Calculates standard error budget metrics:
    - Allowed failure budget
    - Consumed error budget percentage
    - Remaining error budget percentage
    - Budget health status (GREEN / YELLOW / RED)
    - Normalized 0-100 score for priority engine
    """
    total_requests = successful_requests + failed_requests
    if total_requests <= 0:
        return {
            "total_requests": 0,
            "failed_requests": 0,
            "allowed_failures": 0,
            "budget_consumed_pct": 0.0,
            "budget_remaining_pct": 100.0,
            "status": "GREEN",
            "score": 0.0
        }

    allowed_failure_rate = max((100.0 - slo_target) / 100.0, 0.0001)
    actual_failure_rate = failed_requests / total_requests
    allowed_failures = int(total_requests * allowed_failure_rate)

    # Budget consumed percentage: 100% means error budget is completely exhausted
    budget_consumed_pct = (actual_failure_rate / allowed_failure_rate) * 100.0
    budget_remaining_pct = max(0.0, 100.0 - budget_consumed_pct)

    if budget_consumed_pct >= 100.0:
        status = "RED"  # Critical: Budget completely burned
        score = 100.0
    elif budget_consumed_pct >= 70.0:
        status = "YELLOW"  # Warning: Burn rate dangerous
        score = 50.0 + ((budget_consumed_pct - 70.0) / 30.0) * 45.0
    else:
        status = "GREEN"  # Healthy
        score = (budget_consumed_pct / 70.0) * 45.0

    return {
        "total_requests": total_requests,
        "failed_requests": failed_requests,
        "allowed_failures": allowed_failures,
        "budget_consumed_pct": round(budget_consumed_pct, 2),
        "budget_remaining_pct": round(budget_remaining_pct, 2),
        "status": status,
        "score": round(score, 2)
    }


def calculate_incident_score(
    incidents: List[Dict[str, Any]],
    exam_active: bool = False
) -> Dict[str, Any]:
    """
    Calculates weighted incident score from support and telemetry incidents.
    Severity weights:
    - CRITICAL: 10.0
    - HIGH: 6.0
    - MEDIUM: 3.0
    - LOW: 1.0
    """
    if not incidents:
        return {
            "total_incidents": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "score": 0.0
        }

    severity_weights = {
        "CRITICAL": 10.0,
        "HIGH": 6.0,
        "MEDIUM": 3.0,
        "LOW": 1.0
    }

    critical_count = sum(1 for inc in incidents if inc.get("severity") == "CRITICAL")
    high_count = sum(1 for inc in incidents if inc.get("severity") == "HIGH")
    medium_count = sum(1 for inc in incidents if inc.get("severity") == "MEDIUM")
    low_count = sum(1 for inc in incidents if inc.get("severity") == "LOW")

    weighted_sum = (
        critical_count * severity_weights["CRITICAL"] +
        high_count * severity_weights["HIGH"] +
        medium_count * severity_weights["MEDIUM"] +
        low_count * severity_weights["LOW"]
    )

    # 40 weighted points reaches maximum 100 score (e.g. 4 criticals or 2 criticals + 4 highs)
    raw_score = min(weighted_sum / 40.0, 1.0) * 100.0

    # If exam is active, open incidents are more urgent
    if exam_active and (critical_count > 0 or high_count > 0):
        raw_score = min(raw_score * 1.15, 100.0)

    return {
        "total_incidents": len(incidents),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "score": round(raw_score, 2)
    }


def calculate_exam_period_score(
    service_tier: str,
    has_exam_incidents: bool,
    exam_mode_active: bool
) -> float:
    """
    Calculates exam period criticality score (0-100).
    Services on Tier 1 (Exam Submission, Authentication) are mission-critical during exams.
    """
    if not exam_mode_active and not has_exam_incidents:
        return 15.0  # Baseline off-peak readiness

    if service_tier == "TIER_1":
        # Direct exam blocker (submissions, login)
        return 100.0 if (exam_mode_active or has_exam_incidents) else 40.0
    elif service_tier == "TIER_2":
        # Video streaming, course syllabus
        return 65.0 if exam_mode_active else 25.0
    else:
        # Background sync, recommendation feed
        return 35.0 if exam_mode_active else 10.0


def calculate_priority_score(
    scores: Dict[str, float],
    weights: Dict[str, float]
) -> Dict[str, Any]:
    """
    Calculates overall priority score using configurable weights.
    Weights are automatically normalized to guarantee a 0-100 scale output.
    """
    # Safe weight extraction with defaults
    w_user_impact = max(0.0, weights.get("user_impact", 30.0))
    w_slo_breach = max(0.0, weights.get("slo_breach", 25.0))
    w_error_budget = max(0.0, weights.get("error_budget", 20.0))
    w_incident_sev = max(0.0, weights.get("incident_severity", 15.0))
    w_exam_period = max(0.0, weights.get("exam_period", 10.0))

    total_weight = w_user_impact + w_slo_breach + w_error_budget + w_incident_sev + w_exam_period
    if total_weight <= 0:
        total_weight = 100.0
        w_user_impact, w_slo_breach, w_error_budget, w_incident_sev, w_exam_period = 30.0, 25.0, 20.0, 15.0, 10.0

    norm_w_ui = w_user_impact / total_weight
    norm_w_slo = w_slo_breach / total_weight
    norm_w_eb = w_error_budget / total_weight
    norm_w_inc = w_incident_sev / total_weight
    norm_w_exam = w_exam_period / total_weight

    score_ui = scores.get("user_impact", 0.0)
    score_slo = scores.get("slo_breach", 0.0)
    score_eb = scores.get("error_budget", 0.0)
    score_inc = scores.get("incident_severity", 0.0)
    score_exam = scores.get("exam_period", 0.0)

    # Component contributions (points out of weighted budget)
    contrib_ui = score_ui * norm_w_ui
    contrib_slo = score_slo * norm_w_slo
    contrib_eb = score_eb * norm_w_eb
    contrib_inc = score_inc * norm_w_inc
    contrib_exam = score_exam * norm_w_exam

    total_priority_score = contrib_ui + contrib_slo + contrib_eb + contrib_inc + contrib_exam
    final_score = round(min(max(total_priority_score, 0.0), 100.0), 2)

    # Priority Tier
    if final_score >= 75.0:
        priority_level = "CRITICAL"
        requires_human_approval = True
    elif final_score >= 55.0:
        priority_level = "HIGH"
        requires_human_approval = True
    elif final_score >= 35.0:
        priority_level = "MEDIUM"
        requires_human_approval = False
    else:
        priority_level = "LOW"
        requires_human_approval = False

    return {
        "priority_score": final_score,
        "priority_level": priority_level,
        "requires_human_approval": requires_human_approval,
        "contributions": {
            "user_impact": round(contrib_ui, 2),
            "slo_breach": round(contrib_slo, 2),
            "error_budget": round(contrib_eb, 2),
            "incident_severity": round(contrib_inc, 2),
            "exam_period": round(contrib_exam, 2)
        },
        "max_possible_points": {
            "user_impact": round(norm_w_ui * 100.0, 2),
            "slo_breach": round(norm_w_slo * 100.0, 2),
            "error_budget": round(norm_w_eb * 100.0, 2),
            "incident_severity": round(norm_w_inc * 100.0, 2),
            "exam_period": round(norm_w_exam * 100.0, 2)
        }
    }


def generate_evidence(
    service_name: str,
    users_affected: int,
    current_sli: float,
    slo_target: float,
    error_budget_data: Dict[str, Any],
    incident_data: Dict[str, Any],
    exam_active: bool,
    score_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generates structured, auditable evidence for the recommendation.
    Every recommendation is backed by quantitative metrics.
    """
    is_breached = current_sli < slo_target
    return {
        "service_name": service_name,
        "users_affected": users_affected,
        "current_sli": round(current_sli, 3),
        "slo_target": round(slo_target, 3),
        "slo_breached": is_breached,
        "error_budget_used_pct": error_budget_data.get("budget_consumed_pct", 0.0),
        "error_budget_remaining_pct": error_budget_data.get("budget_remaining_pct", 100.0),
        "error_budget_status": error_budget_data.get("status", "GREEN"),
        "total_incidents": incident_data.get("total_incidents", 0),
        "critical_incidents": incident_data.get("critical_count", 0),
        "high_incidents": incident_data.get("high_count", 0),
        "examination_period_active": exam_active,
        "scoring_breakdown": score_result.get("contributions", {}),
        "max_possible_breakdown": score_result.get("max_possible_points", {})
    }


def generate_recommendation(
    task_name: str,
    service_name: str,
    evidence: Dict[str, Any],
    score_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Synthesizes the natural-language explainable recommendation statement
    answering the 7 explainability questions.
    """
    priority_level = score_result["priority_level"]
    score = score_result["priority_score"]
    users = evidence["users_affected"]
    sli = evidence["current_sli"]
    slo = evidence["slo_target"]
    eb_used = evidence["error_budget_used_pct"]
    inc_count = evidence["total_incidents"]
    exam = evidence["examination_period_active"]
    breached = evidence["slo_breached"]

    if breached:
        breach_text = f"has breached its {slo}% SLO (currently {sli}%)"
    else:
        breach_text = f"is maintaining its {slo}% SLO ({sli}%)"

    exam_text = "during an active examination period" if exam else "under standard semester load"

    explanation = (
        f"Prioritize {service_name} reliability task '{task_name}' because it affects {users:,} students, "
        f"{breach_text}, has consumed {eb_used}% of its error budget, and has logged {inc_count} support "
        f"incidents {exam_text}."
    )

    action_summary = (
        f"Fix {task_name} on {service_name} to stabilize student exam flow and restore error budget."
    )

    return {
        "priority_score": score,
        "priority_level": priority_level,
        "requires_human_approval": score_result["requires_human_approval"],
        "explanation": explanation,
        "action_summary": action_summary,
        "evidence": evidence
    }
