"""
SLO Decision Engine for Reliability Prioritization
Platform: Examination-Heavy Online Learning Systems
Version: Phase 2 Evaluation Standard

This module implements a deterministic, mathematically grounded, and explainable
prioritization engine. Every scoring input is normalized to the range 0.0 to 1.0
before applying configurable multi-factor weights.

Scoring Weights:
  User Impact (30%):          w_user_impact = 0.30
  SLO Breach (25%):           w_slo_breach = 0.25
  Error Budget (20%):         w_error_budget = 0.20
  Incident Severity (15%):    w_incident_sev = 0.15
  Examination Context (10%):  w_exam_period = 0.10

Mathematical Formula:
  Priority Score =
      (0.30 x Normalized_UserImpact)
    + (0.25 x Normalized_SLOBreach)
    + (0.20 x Normalized_ErrorBudget)
    + (0.15 x Normalized_IncidentSeverity)
    + (0.10 x Normalized_ExamContext)

Normalization Ranges:
  - User Impact: 0.0 (no users affected) to 1.0 (capped at 1.0 / 100% impact)
  - SLO Breach: 0.0 (no breach) to 1.0 (severe breach, saturation curve)
  - Error Budget: 0.0 (0% budget consumed) to 1.0 (100% or greater budget consumed)
  - Incident Severity: P1 / CRITICAL = 1.00, P2 / HIGH = 0.75, P3 / MEDIUM = 0.50, P4 / LOW = 0.25
  - Exam Context: Normal Period = 0.0, Exam Period = 1.0 (for Tier 1)
"""

from typing import Dict, List, Any, Optional
import math


# =============================================================================
# Qualitative Incident Severity Mapping
# =============================================================================

INCIDENT_SEVERITY_MAPPING: Dict[str, float] = {
    "P1": 1.00,
    "CRITICAL": 1.00,
    "P2": 0.75,
    "HIGH": 0.75,
    "P3": 0.50,
    "MEDIUM": 0.50,
    "P4": 0.25,
    "LOW": 0.25,
}

DEFAULT_SEVERITY_NORMALIZED = 0.25  # Safe fallback for unknown/missing severity


def normalize_incident_severity(severity: Optional[str]) -> float:
    """
    Converts qualitative incident severities into normalized numerical values in [0.0, 1.0]:
      P1 / CRITICAL = 1.00
      P2 / HIGH     = 0.75
      P3 / MEDIUM   = 0.50
      P4 / LOW      = 0.25
    Returns 0.25 (P4 equivalent) safely if severity is missing or unparseable.
    """
    if not severity or not isinstance(severity, str):
        return DEFAULT_SEVERITY_NORMALIZED
    return INCIDENT_SEVERITY_MAPPING.get(severity.strip().upper(), DEFAULT_SEVERITY_NORMALIZED)


# =============================================================================
# Factor 1: User Impact Normalization & Calculation (30% Weight)
# =============================================================================

def normalize_user_impact(
    users_affected: Optional[int],
    total_active_students: int = 50000,
    duration_minutes: int = 60,
    severity_multiplier: float = 1.0,
    exam_active: bool = False
) -> float:
    """
    Normalizes user impact into the range [0.0, 1.0].
    Takes into account student reach, duration of downtime, and exam context.
    Safely clamps negative, null, and extreme outlier values.
    """
    if users_affected is None or users_affected <= 0:
        return 0.0

    # Sanitize inputs
    try:
        users = float(users_affected)
    except (ValueError, TypeError):
        return 0.0

    if users <= 0.0 or math.isnan(users):
        return 0.0

    duration = max(0.0, float(duration_minutes) if duration_minutes is not None else 60.0)
    sev_mult = max(0.1, min(float(severity_multiplier) if severity_multiplier is not None else 1.0, 2.0))

    # Base operational saturation: 4,000-5,000 students affected reaches major operational impact
    base_ratio = min(users / 5000.0, 1.0) * 0.75

    # Outage duration factor (up to +0.15 for outages >= 1 hour)
    duration_factor = min(duration / 60.0, 1.0) * 0.15

    # Exam context bonus if users are actively blocked during assessments
    exam_bonus = 0.15 if (exam_active and users > 50) else 0.0

    raw_normalized = (base_ratio + duration_factor + exam_bonus) * sev_mult
    return round(min(max(raw_normalized, 0.0), 1.0), 4)


def calculate_user_impact(
    users_affected: Optional[int],
    total_active_students: int = 50000,
    duration_minutes: int = 60,
    severity_multiplier: float = 1.0,
    exam_active: bool = False
) -> float:
    """
    Calculates user impact score on a 0-100 scale for UI display and engine compatibility.
    Equivalent to normalize_user_impact(...) * 100.0.
    """
    norm = normalize_user_impact(
        users_affected=users_affected,
        total_active_students=total_active_students,
        duration_minutes=duration_minutes,
        severity_multiplier=severity_multiplier,
        exam_active=exam_active
    )
    return round(norm * 100.0, 2)


# =============================================================================
# Factor 2: SLO Breach Magnitude Normalization & Calculation (25% Weight)
# =============================================================================

def normalize_slo_breach(slo_target: Optional[float], current_sli: Optional[float]) -> float:
    """
    Normalizes SLO breach severity into the range [0.0, 1.0].
    - If current_sli >= slo_target, breach magnitude is 0.0 (no breach).
    - If current_sli < slo_target, score increases sharply based on distance from target.
    - Avoids division by zero and invalid/null values.
    """
    if slo_target is None or slo_target <= 0.0 or math.isnan(slo_target):
        return 0.0
    if current_sli is None or math.isnan(current_sli):
        return 0.0

    # Clamp SLI to realistic bounds
    sli = min(max(float(current_sli), 0.0), 100.0)
    target = min(max(float(slo_target), 0.0), 100.0)

    if sli >= target:
        return 0.0

    allowed_error_margin = max(100.0 - target, 0.01)
    actual_error = max(target - sli, 0.0)

    # Multiples of allowed error margin breached
    breach_ratio = actual_error / allowed_error_margin

    # Exponential saturation: 1x margin ~ 0.50, 2x margin ~ 0.80, 3x+ margin ~ 1.00
    norm_score = 1.0 - math.exp(-1.2 * breach_ratio)
    return round(min(max(norm_score, 0.0), 1.0), 4)


def calculate_slo_breach_score(slo_target: Optional[float], current_sli: Optional[float]) -> float:
    """
    Calculates SLO breach score on a 0-100 scale for engine compatibility.
    """
    norm = normalize_slo_breach(slo_target, current_sli)
    return round(norm * 100.0, 2)


# =============================================================================
# Factor 3: Error Budget Normalization & Calculation (20% Weight)
# =============================================================================

def normalize_error_budget(budget_consumed_pct: Optional[float]) -> float:
    """
    Normalizes error-budget consumption to [0.0, 1.0]:
      - 0% consumption = 0.0
      - 100% or greater consumption = 1.0
      - Values between 0% and 100% normalized proportionally (budget_consumed_pct / 100.0).
    """
    if budget_consumed_pct is None or math.isnan(budget_consumed_pct) or budget_consumed_pct <= 0.0:
        return 0.0
    return round(min(max(float(budget_consumed_pct) / 100.0, 0.0), 1.0), 4)


def calculate_error_budget_score(
    slo_target: Optional[float],
    successful_requests: Optional[int],
    failed_requests: Optional[int]
) -> Dict[str, Any]:
    """
    Calculates standard error budget metrics with telemetry safety guards:
    - Allowed failure budget
    - Consumed error budget percentage
    - Remaining error budget percentage
    - Budget health status (GREEN / YELLOW / RED)
    - Normalized 0.0-1.0 and 0-100 score for priority engine
    - Telemetry availability flag and diagnostic quality flags
    """
    data_quality_flags: List[str] = []

    # Safe defaults if telemetry inputs are missing or invalid
    if successful_requests is None and failed_requests is None:
        data_quality_flags.append("TELEMETRY_UNAVAILABLE")
        data_quality_flags.append("ZERO_REQUESTS_RECORDED")
        return {
            "total_requests": 0,
            "failed_requests": 0,
            "allowed_failures": 0,
            "budget_consumed_pct": 0.0,
            "budget_remaining_pct": 100.0,
            "status": "GREEN",
            "score": 0.0,
            "normalized_score": 0.0,
            "telemetry_available": False,
            "data_quality_flags": data_quality_flags,
            "insufficient_telemetry": True,
            "telemetry_notes": "Telemetry pipeline unavailable. Operating under safe baseline defaults."
        }

    if successful_requests is None:
        successful_requests = 0
        data_quality_flags.append("SUCCESSFUL_REQUESTS_NULL")
    if failed_requests is None:
        failed_requests = 0
        data_quality_flags.append("FAILED_REQUESTS_NULL")

    succ = max(0, int(successful_requests))
    fail = max(0, int(failed_requests))
    total_requests = succ + fail

    if slo_target is None or slo_target <= 0.0:
        target = 99.90
        data_quality_flags.append("SLO_TARGET_MISSING_DEFAULTED")
    else:
        target = min(max(float(slo_target), 50.0), 100.0)

    # Edge Case: Zero requests recorded (telemetry outage or newly deployed service)
    if total_requests <= 0:
        data_quality_flags.append("ZERO_REQUESTS_RECORDED")
        return {
            "total_requests": 0,
            "failed_requests": 0,
            "allowed_failures": 0,
            "budget_consumed_pct": 0.0,
            "budget_remaining_pct": 100.0,
            "status": "GREEN",
            "score": 0.0,
            "normalized_score": 0.0,
            "telemetry_available": True,
            "data_quality_flags": data_quality_flags,
            "insufficient_telemetry": False,
            "telemetry_notes": "Zero requests recorded during evaluation window. Operating under safe baseline."
        }

    allowed_failure_rate = max((100.0 - target) / 100.0, 0.0001)
    actual_failure_rate = fail / total_requests
    allowed_failures = int(total_requests * allowed_failure_rate)

    # Budget consumed percentage: 100% means error budget is completely exhausted
    budget_consumed_pct = (actual_failure_rate / allowed_failure_rate) * 100.0
    budget_remaining_pct = max(0.0, 100.0 - budget_consumed_pct)

    # Status classification
    if budget_consumed_pct >= 100.0:
        status = "RED"      # Critical: Budget completely burned
        score = 100.0
        normalized_score = 1.0
    elif budget_consumed_pct >= 70.0:
        status = "YELLOW"   # Warning: Dangerous burn rate
        score = 50.0 + ((budget_consumed_pct - 70.0) / 30.0) * 45.0
        normalized_score = min(score / 100.0, 1.0)
    else:
        status = "GREEN"    # Healthy
        score = (budget_consumed_pct / 70.0) * 45.0
        normalized_score = min(score / 100.0, 1.0)

    return {
        "total_requests": total_requests,
        "failed_requests": fail,
        "allowed_failures": allowed_failures,
        "budget_consumed_pct": round(budget_consumed_pct, 2),
        "budget_remaining_pct": round(budget_remaining_pct, 2),
        "status": status,
        "score": round(score, 2),
        "normalized_score": round(normalized_score, 4),
        "telemetry_available": True,
        "data_quality_flags": data_quality_flags,
        "insufficient_telemetry": False,
        "telemetry_notes": "Telemetry stream healthy and active."
    }


# =============================================================================
# Factor 4: Incident Severity Normalization & Calculation (15% Weight)
# =============================================================================

def calculate_incident_score(
    incidents: Optional[List[Dict[str, Any]]],
    exam_active: bool = False
) -> Dict[str, Any]:
    """
    Calculates weighted incident score from support and telemetry incidents.
    Supports both P1/P2/P3/P4 and CRITICAL/HIGH/MEDIUM/LOW qualitative severities:
      P1 / CRITICAL = 1.00 (weight 10.0)
      P2 / HIGH     = 0.75 (weight 6.0)
      P3 / MEDIUM   = 0.50 (weight 3.0)
      P4 / LOW      = 0.25 (weight 1.0)

    Missing incident severities are safely assigned P4/LOW defaults.
    """
    if not incidents or not isinstance(incidents, list):
        return {
            "total_incidents": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "missing_severity_count": 0,
            "score": 0.0,
            "normalized_score": 0.0,
            "severity_mapping": INCIDENT_SEVERITY_MAPPING
        }

    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    missing_count = 0

    weighted_incident_points = 0.0

    for inc in incidents:
        if not isinstance(inc, dict):
            continue
        raw_sev = inc.get("severity")
        if not raw_sev:
            missing_count += 1
            sev = "LOW"
        else:
            sev = str(raw_sev).strip().upper()

        if sev in ("CRITICAL", "P1"):
            critical_count += 1
            weighted_incident_points += 10.0
        elif sev in ("HIGH", "P2"):
            high_count += 1
            weighted_incident_points += 6.0
        elif sev in ("MEDIUM", "P3"):
            medium_count += 1
            weighted_incident_points += 3.0
        else:
            low_count += 1
            weighted_incident_points += 1.0
            if sev not in ("LOW", "P4"):
                missing_count += 1

    # Normalization curve: 20 weighted points reaches standard high impact
    raw_score = min(weighted_incident_points / 20.0 * 70.0, 100.0)

    # Amplification if critical/high incidents occur during exam
    if exam_active and (critical_count > 0 or high_count > 0):
        raw_score = min(raw_score * 1.15, 100.0)

    normalized_score = round(min(raw_score / 100.0, 1.0), 4)

    return {
        "total_incidents": len(incidents),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "missing_severity_count": missing_count,
        "score": round(raw_score, 2),
        "normalized_score": normalized_score,
        "severity_mapping": INCIDENT_SEVERITY_MAPPING
    }


# =============================================================================
# Factor 5: Examination Period Context (10% Weight)
# =============================================================================

def calculate_exam_period_score(
    service_tier: Optional[str],
    has_exam_incidents: bool,
    exam_mode_active: bool
) -> float:
    """
    Calculates exam period criticality score in [0.0, 100.0]:
      - Normal period: 0.0 (baseline off-peak)
      - Examination active:
          * Tier 1 (Exam Submission, Authentication): 100.0 (normalized 1.00)
          * Tier 2 (Video, Syllabus): 65.0 (normalized 0.65)
          * Tier 3 (Background feeds): 35.0 (normalized 0.35)
    """
    tier = (service_tier or "TIER_2").strip().upper()

    if not exam_mode_active and not has_exam_incidents:
        return 0.0

    if tier == "TIER_1":
        return 100.0 if (exam_mode_active or has_exam_incidents) else 40.0
    elif tier == "TIER_2":
        return 65.0 if exam_mode_active else 25.0
    else:
        return 35.0 if exam_mode_active else 10.0


# =============================================================================
# Core Priority Score Engine
# =============================================================================

def calculate_priority_score(
    scores: Dict[str, Any],
    weights: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates overall priority score using the explicit Phase 2 formula:
      Priority Score =
          (0.30 x UserImpact)
        + (0.25 x SLOBreach)
        + (0.20 x ErrorBudget)
        + (0.15 x IncidentSeverity)
        + (0.10 x ExamContext)

    Every input is strictly normalized to the range 0.0 to 1.0 before weights are applied.
    Safely handles malformed/zero/negative weights and invalid numeric values.
    """
    def _safe_float(val: Any, default: float) -> float:
        if val is None:
            return default
        try:
            f = float(val)
            return default if (math.isnan(f) or math.isinf(f)) else f
        except (ValueError, TypeError):
            return default

    # Safe weight extraction
    w_ui = max(0.0, _safe_float(weights.get("user_impact"), 30.0))
    w_slo = max(0.0, _safe_float(weights.get("slo_breach"), 25.0))
    w_eb = max(0.0, _safe_float(weights.get("error_budget"), 20.0))
    w_inc = max(0.0, _safe_float(weights.get("incident_severity"), 15.0))
    w_exam = max(0.0, _safe_float(weights.get("exam_period"), 10.0))

    total_weight = w_ui + w_slo + w_eb + w_inc + w_exam
    if total_weight <= 0.0:
        total_weight = 100.0
        w_ui, w_slo, w_eb, w_inc, w_exam = 30.0, 25.0, 20.0, 15.0, 10.0

    # Normalized weights sum exactly to 1.0 (e.g. 0.30, 0.25, 0.20, 0.15, 0.10)
    norm_w_ui = w_ui / total_weight
    norm_w_slo = w_slo / total_weight
    norm_w_eb = w_eb / total_weight
    norm_w_inc = w_inc / total_weight
    norm_w_exam = w_exam / total_weight

    # Extract raw scores (handles both 0-100 scale and 0-1 scale)
    raw_ui = max(0.0, _safe_float(scores.get("user_impact"), 0.0))
    raw_slo = max(0.0, _safe_float(scores.get("slo_breach"), 0.0))
    raw_eb = max(0.0, _safe_float(scores.get("error_budget"), 0.0))
    raw_inc = max(0.0, _safe_float(scores.get("incident_severity"), 0.0))
    raw_exam = max(0.0, _safe_float(scores.get("exam_period"), 0.0))

    # Normalize inputs strictly to [0.0, 1.0]
    norm_in_ui = min(raw_ui / 100.0, 1.0) if raw_ui > 1.0 else min(raw_ui, 1.0)
    norm_in_slo = min(raw_slo / 100.0, 1.0) if raw_slo > 1.0 else min(raw_slo, 1.0)
    norm_in_eb = min(raw_eb / 100.0, 1.0) if raw_eb > 1.0 else min(raw_eb, 1.0)
    norm_in_inc = min(raw_inc / 100.0, 1.0) if raw_inc > 1.0 else min(raw_inc, 1.0)
    norm_in_exam = min(raw_exam / 100.0, 1.0) if raw_exam > 1.0 else min(raw_exam, 1.0)

    # Component contributions on 0-100 scale
    contrib_ui = norm_in_ui * norm_w_ui * 100.0
    contrib_slo = norm_in_slo * norm_w_slo * 100.0
    contrib_eb = norm_in_eb * norm_w_eb * 100.0
    contrib_inc = norm_in_inc * norm_w_inc * 100.0
    contrib_exam = norm_in_exam * norm_w_exam * 100.0

    total_priority_score = contrib_ui + contrib_slo + contrib_eb + contrib_inc + contrib_exam
    final_score = round(min(max(total_priority_score, 0.0), 100.0), 2)
    normalized_priority_score = round(final_score / 100.0, 4)

    # Priority Tier classification
    if final_score >= 70.0:
        priority_level = "CRITICAL"
        requires_human_approval = True
    elif final_score >= 50.0:
        priority_level = "HIGH"
        requires_human_approval = True
    elif final_score >= 30.0:
        priority_level = "MEDIUM"
        requires_human_approval = False
    else:
        priority_level = "LOW"
        requires_human_approval = False

    # Rank major contributing factors for explainability & conflicting signal resolution
    factor_contributions = [
        ("User Impact", contrib_ui, norm_w_ui * 100.0),
        ("SLO Breach", contrib_slo, norm_w_slo * 100.0),
        ("Error Budget Burn", contrib_eb, norm_w_eb * 100.0),
        ("Incident Severity", contrib_inc, norm_w_inc * 100.0),
        ("Exam Context", contrib_exam, norm_w_exam * 100.0)
    ]
    factor_contributions.sort(key=lambda x: x[1], reverse=True)
    major_factors = [
        f"{name}: {pts:.1f}/{max_pts:.1f} pts"
        for name, pts, max_pts in factor_contributions
        if pts > 2.0
    ]

    return {
        "priority_score": final_score,
        "normalized_priority_score": normalized_priority_score,
        "priority_level": priority_level,
        "requires_human_approval": requires_human_approval,
        "normalized_inputs": {
            "user_impact": round(norm_in_ui, 4),
            "slo_breach": round(norm_in_slo, 4),
            "error_budget": round(norm_in_eb, 4),
            "incident_severity": round(norm_in_inc, 4),
            "exam_period": round(norm_in_exam, 4)
        },
        "normalized_weights": {
            "user_impact": round(norm_w_ui, 4),
            "slo_breach": round(norm_w_slo, 4),
            "error_budget": round(norm_w_eb, 4),
            "incident_severity": round(norm_w_inc, 4),
            "exam_period": round(norm_w_exam, 4)
        },
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
        },
        "major_contributing_factors": major_factors
    }


# =============================================================================
# Evidence & Recommendation Generation
# =============================================================================

def generate_evidence(
    service_name: str,
    users_affected: Optional[int],
    current_sli: Optional[float],
    slo_target: Optional[float],
    error_budget_data: Dict[str, Any],
    incident_data: Dict[str, Any],
    exam_active: bool,
    score_result: Dict[str, Any],
    telemetry_status: str = "OK",
    data_quality_flags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generates structured, auditable evidence for the recommendation.
    Includes data quality indicators and telemetry outage diagnostics.
    """
    target = slo_target if (slo_target is not None and slo_target > 0) else 99.90
    sli = current_sli if current_sli is not None else 100.0
    users = max(0, users_affected or 0)
    is_breached = (current_sli is not None) and (sli < target)

    quality_flags = list(data_quality_flags or [])
    if error_budget_data.get("data_quality_flags"):
        quality_flags.extend(error_budget_data["data_quality_flags"])
    if incident_data.get("missing_severity_count", 0) > 0:
        quality_flags.append(f"MISSING_SEVERITY_ON_{incident_data['missing_severity_count']}_INCIDENTS")

    telemetry_avail = error_budget_data.get("telemetry_available", True) and (telemetry_status.upper() != "UNAVAILABLE")
    if not telemetry_avail:
        telemetry_status = "UNAVAILABLE"

    return {
        "service_name": service_name,
        "users_affected": users,
        "current_sli": round(sli, 3) if current_sli is not None else None,
        "slo_target": round(target, 3),
        "slo_breached": is_breached,
        "error_budget_used_pct": error_budget_data.get("budget_consumed_pct", 0.0),
        "error_budget_remaining_pct": error_budget_data.get("budget_remaining_pct", 100.0),
        "error_budget_status": error_budget_data.get("status", "GREEN"),
        "total_incidents": incident_data.get("total_incidents", 0),
        "critical_incidents": incident_data.get("critical_count", 0),
        "high_incidents": incident_data.get("high_count", 0),
        "examination_period_active": exam_active,
        "scoring_breakdown": score_result.get("contributions", {}),
        "max_possible_breakdown": score_result.get("max_possible_points", {}),
        "normalized_inputs": score_result.get("normalized_inputs", {}),
        "major_contributing_factors": score_result.get("major_contributing_factors", []),
        "telemetry_status": telemetry_status,
        "telemetry_available": telemetry_avail,
        "insufficient_telemetry": not telemetry_avail or ("ZERO_REQUESTS_RECORDED" in quality_flags) or current_sli is None,
        "data_quality_flags": list(set(quality_flags))
    }


def generate_recommendation(
    task_name: str,
    service_name: str,
    evidence: Dict[str, Any],
    score_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Synthesizes the explainable recommendation statement.
    Accurately explains major contributing factors and highlights telemetry unavailability when present.
    """
    priority_level = score_result["priority_level"]
    score = score_result["priority_score"]
    users = evidence["users_affected"]
    sli = evidence.get("current_sli")
    slo = evidence["slo_target"]
    eb_used = evidence["error_budget_used_pct"]
    inc_count = evidence["total_incidents"]
    exam = evidence["examination_period_active"]
    breached = evidence["slo_breached"]
    insufficient_telemetry = evidence.get("insufficient_telemetry", False)

    if sli is not None:
        if breached:
            breach_text = f"has breached its {slo}% SLO (currently {sli}%)"
        else:
            breach_text = f"is maintaining its {slo}% SLO ({sli}%)"
    else:
        breach_text = f"has unknown SLI against its {slo}% SLO"

    exam_text = "during an active examination period" if exam else "under standard semester load"

    explanation = (
        f"Prioritize {service_name} reliability task '{task_name}' because it affects {users:,} students, "
        f"{breach_text}, has consumed {eb_used}% of its error budget, and has logged {inc_count} support "
        f"incidents {exam_text}."
    )

    if insufficient_telemetry:
        explanation += " [Telemetry Notice: Limited or zero telemetry recorded for this service; scored with safe baseline defaults.]"

    action_summary = (
        f"Fix {task_name} on {service_name} to stabilize student exam flow and restore error budget."
    )

    return {
        "priority_score": score,
        "normalized_priority_score": score_result.get("normalized_priority_score", round(score / 100.0, 4)),
        "priority_level": priority_level,
        "requires_human_approval": score_result["requires_human_approval"],
        "explanation": explanation,
        "action_summary": action_summary,
        "evidence": evidence
    }