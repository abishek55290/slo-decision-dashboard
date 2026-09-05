"""
FastAPI Backend for SLO Decision Dashboard
Examination-Heavy Learning Platforms
"""

from fastapi import FastAPI, HTTPException, status, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json
import os
import sys
from datetime import datetime, timezone

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from decision_engine.engine import (
    calculate_user_impact,
    calculate_slo_breach_score,
    calculate_error_budget_score,
    calculate_incident_score,
    calculate_exam_period_score,
    calculate_priority_score,
    generate_evidence,
    generate_recommendation
)

app = FastAPI(
    title="SLO Decision Dashboard API",
    description="Field-ready prototype connecting SLIs, SLOs, error budgets, user impact, and rules for reliability prioritization.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "seed", "seed_data.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        # Regenerate if missing
        from seed.seed_data import generate_synthetic_data
        data = generate_synthetic_data()
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return data
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

class RuleUpdateItem(BaseModel):
    id: str
    weight: float
    threshold: Optional[float] = None
    enabled: bool

class RuleUpdateRequest(BaseModel):
    rules: List[RuleUpdateItem]

class DecisionRequest(BaseModel):
    user_id: str
    user_name: str
    override_reason: Optional[str] = None

class ExamModeRequest(BaseModel):
    exam_mode: bool

# In-memory session state for active runtime options
RUNTIME_STATE = {
    "exam_mode": True,
    "last_eval_timestamp": datetime.now(timezone.utc).isoformat()
}

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "SLO Decision Dashboard API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "exam_mode_active": RUNTIME_STATE["exam_mode"],
        "dataset": "DEMO / SYNTHETIC DATA"
    }

@app.get("/api/services")
def get_services():
    data = load_data()
    return data.get("services", [])

@app.get("/api/slos")
def get_slos():
    data = load_data()
    services = data.get("services", [])
    sli_metrics = data.get("sli_metrics", [])
    incidents = data.get("incidents", [])

    results = []
    for srv in services:
        srv_id = srv["id"]
        srv_metrics = [m for m in sli_metrics if m["service_id"] == srv_id]
        total_req = sum(m["total_requests"] for m in srv_metrics)
        succ_req = sum(m["successful_requests"] for m in srv_metrics)
        fail_req = sum(m["failed_requests"] for m in srv_metrics)

        current_sli = round((succ_req / total_req * 100.0), 3) if total_req > 0 else 100.0
        eb = calculate_error_budget_score(srv["slo_target"], succ_req, fail_req)
        
        srv_incidents = [i for i in incidents if i["service_id"] == srv_id]
        users_affected = sum(i.get("users_affected", 0) for i in srv_incidents)

        results.append({
            "service_id": srv_id,
            "service_name": srv["name"],
            "description": srv["description"],
            "tier": srv.get("tier", "TIER_1"),
            "slo_target": srv["slo_target"],
            "current_sli": current_sli,
            "is_breached": current_sli < srv["slo_target"],
            "error_budget_used_pct": eb["budget_consumed_pct"],
            "error_budget_remaining_pct": eb["budget_remaining_pct"],
            "error_budget_status": eb["status"],
            "total_requests": total_req,
            "failed_requests": fail_req,
            "total_incidents": len(srv_incidents),
            "users_affected": users_affected
        })
    return results

@app.get("/api/incidents")
def get_incidents(service_id: Optional[str] = None):
    data = load_data()
    incidents = data.get("incidents", [])
    if service_id:
        incidents = [i for i in incidents if i["service_id"] == service_id]
    return incidents

@app.get("/api/features")
def get_features():
    data = load_data()
    return data.get("feature_plans", [])

@app.get("/api/reliability-tasks")
def get_reliability_tasks():
    data = load_data()
    return data.get("reliability_tasks", [])

@app.get("/api/rules")
def get_rules():
    data = load_data()
    return data.get("rules", [])

@app.put("/api/rules")
def update_rules(payload: RuleUpdateRequest):
    data = load_data()
    rules = data.get("rules", [])
    update_map = {r.id: r for r in payload.rules}

    for r in rules:
        if r["id"] in update_map:
            u = update_map[r["id"]]
            r["weight"] = u.weight
            r["enabled"] = u.enabled
            if u.threshold is not None:
                r["threshold"] = u.threshold
            r["updated_at"] = datetime.now(timezone.utc).isoformat()

    save_data(data)
    return {"message": "Rules updated successfully", "rules": rules}

@app.get("/api/recommendations")
def get_recommendations():
    data = load_data()
    services = {s["id"]: s for s in data.get("services", [])}
    sli_metrics = data.get("sli_metrics", [])
    incidents = data.get("incidents", [])
    tasks = data.get("reliability_tasks", [])
    rules = data.get("rules", [])
    exam_mode = RUNTIME_STATE["exam_mode"]

    weights = {}
    for r in rules:
        if r.get("enabled", True):
            weights[r["id"].replace("rule_", "")] = float(r["weight"])
        else:
            weights[r["id"].replace("rule_", "")] = 0.0

    recommendations = []
    for task in tasks:
        srv_id = task["service_id"]
        srv = services.get(srv_id, {
            "name": "Unknown Service",
            "slo_target": 99.9,
            "tier": "TIER_2"
        })

        srv_metrics = [m for m in sli_metrics if m["service_id"] == srv_id]
        total_req = sum(m["total_requests"] for m in srv_metrics)
        succ_req = sum(m["successful_requests"] for m in srv_metrics)
        fail_req = sum(m["failed_requests"] for m in srv_metrics)
        current_sli = round((succ_req / total_req * 100.0), 3) if total_req > 0 else 100.0

        eb_data = calculate_error_budget_score(srv["slo_target"], succ_req, fail_req)
        srv_incidents = [i for i in incidents if i["service_id"] == srv_id]
        inc_data = calculate_incident_score(srv_incidents, exam_active=exam_mode)

        users_affected = sum(i.get("users_affected", 0) for i in srv_incidents)
        max_duration = max([i.get("duration_minutes", 0) for i in srv_incidents], default=30)
        has_exam_inc = any(i.get("exam_period", False) for i in srv_incidents)

        ui_score = calculate_user_impact(
            users_affected=users_affected,
            duration_minutes=max_duration,
            exam_active=exam_mode
        )
        slo_score = calculate_slo_breach_score(srv["slo_target"], current_sli)
        exam_score = calculate_exam_period_score(srv.get("tier", "TIER_2"), has_exam_inc, exam_mode)

        factor_scores = {
            "user_impact": ui_score,
            "slo_breach": slo_score,
            "error_budget": eb_data["score"],
            "incident_severity": inc_data["score"],
            "exam_period": exam_score
        }

        score_result = calculate_priority_score(factor_scores, weights)
        evidence = generate_evidence(
            service_name=srv["name"],
            users_affected=users_affected,
            current_sli=current_sli,
            slo_target=srv["slo_target"],
            error_budget_data=eb_data,
            incident_data=inc_data,
            exam_active=exam_mode,
            score_result=score_result
        )

        rec = generate_recommendation(
            task_name=task["task_name"],
            service_name=srv["name"],
            evidence=evidence,
            score_result=score_result
        )

        # Check existing decision status in database
        rec_id = f"rec_{task['id']}"
        existing_decisions = [d for d in data.get("decisions", []) if d.get("recommendation_id") == rec_id]
        status_val = "PENDING"
        decision_info = None
        if existing_decisions:
            latest_dec = existing_decisions[-1]
            status_val = latest_dec["decision"]
            decision_info = latest_dec

        recommendations.append({
            "id": rec_id,
            "task_id": task["id"],
            "task_name": task["task_name"],
            "task_description": task["description"],
            "task_status": task["status"],
            "estimated_effort": task["estimated_effort"],
            "service_id": srv_id,
            "service_name": srv["name"],
            "priority_score": rec["priority_score"],
            "priority_level": rec["priority_level"],
            "requires_human_approval": rec["requires_human_approval"],
            "explanation": rec["explanation"],
            "action_summary": rec["action_summary"],
            "evidence": evidence,
            "status": status_val,
            "decision": decision_info,
            "generated_at": datetime.now(timezone.utc).isoformat()
        })

    # Sort strictly by priority_score descending
    recommendations.sort(key=lambda x: x["priority_score"], reverse=True)
    return recommendations

@app.post("/api/recommendations/{id}/approve")
def approve_recommendation(id: str, payload: DecisionRequest):
    data = load_data()
    now_str = datetime.now(timezone.utc).isoformat()
    new_dec = {
        "id": f"dec_{int(datetime.now().timestamp() * 1000)}",
        "recommendation_id": id,
        "user_id": payload.user_id,
        "user_name": payload.user_name,
        "decision": "APPROVED",
        "override_reason": None,
        "created_at": now_str
    }
    data.setdefault("decisions", []).append(new_dec)
    save_data(data)
    return {"message": "Recommendation approved successfully", "decision": new_dec}

@app.post("/api/recommendations/{id}/override")
def override_recommendation(id: str, payload: DecisionRequest):
    if not payload.override_reason or not payload.override_reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Human override strictly requires a clear, non-empty justification."
        )

    data = load_data()
    now_str = datetime.now(timezone.utc).isoformat()
    new_dec = {
        "id": f"dec_{int(datetime.now().timestamp() * 1000)}",
        "recommendation_id": id,
        "user_id": payload.user_id,
        "user_name": payload.user_name,
        "decision": "OVERRIDDEN",
        "override_reason": payload.override_reason.strip(),
        "created_at": now_str
    }
    data.setdefault("decisions", []).append(new_dec)
    save_data(data)
    return {"message": "Recommendation overridden and logged successfully", "decision": new_dec}

@app.get("/api/decisions")
def get_decisions():
    data = load_data()
    return data.get("decisions", [])

@app.get("/api/metrics")
def get_evaluation_metrics():
    """
    Calculates the primary success metric specified in Section 16:
    Percentage of reliability priorities justified by measured user impact.
    """
    recs = get_recommendations()
    total_priorities = len(recs)
    
    # Justified if evidence has measurable users affected (> 0) and contributing user impact score
    justified = [
        r for r in recs 
        if r["evidence"]["users_affected"] > 50 and r["evidence"]["scoring_breakdown"]["user_impact"] > 5.0
    ]
    justified_count = len(justified)
    measured_result = round((justified_count / total_priorities * 100.0), 1) if total_priorities > 0 else 0.0
    
    baseline = 42.0  # Previous manual/informal triage baseline
    target = 80.0
    difference = round(measured_result - baseline, 1)

    return {
        "metric_name": "Percentage of reliability priorities justified by measured user impact",
        "formula": "(Reliability priorities with measurable user-impact evidence / Total reliability priorities) * 100",
        "baseline_percentage": baseline,
        "target_percentage": target,
        "measured_result_percentage": measured_result,
        "target_met": measured_result >= target,
        "difference_vs_baseline": difference,
        "total_priorities_evaluated": total_priorities,
        "justified_count": justified_count,
        "unjustified_or_low_impact_count": total_priorities - justified_count
    }

@app.post("/api/exam-mode")
def set_exam_mode(payload: ExamModeRequest):
    RUNTIME_STATE["exam_mode"] = payload.exam_mode
    return {"exam_mode": RUNTIME_STATE["exam_mode"]}

@app.post("/api/reset-data")
def reset_synthetic_data():
    from seed.seed_data import generate_synthetic_data
    data = generate_synthetic_data()
    save_data(data)
    return {"message": "Synthetic dataset restored to initial state", "metadata": data["metadata"]}
