"""
Automated Test Suite for SLO Decision Engine
Phase 2 Evaluation Standard
Covers:
  - Preserved Phase 1 Tests (Cases 1 - 8)
  - Evaluator Feedback & Adversarial Tests (Cases 9 - 20):
      9.  test_case_9_telemetry_outage_handling
      10. test_case_10_missing_slo_target
      11. test_case_11_zero_http_requests
      12. test_case_12_corrupted_rule_weights
      13. test_case_13_extreme_user_impact_clamping
      14. test_case_14_error_budget_over_100_percent
      15. test_case_15_p1_low_user_impact
      16. test_case_16_low_incident_count_high_user_impact
      17. test_case_17_conflicting_priority_signals
      18. test_case_18_exam_period_extreme_load
      19. test_case_19_missing_incident_severity
      20. test_case_20_invalid_negative_metrics
"""

import unittest
import sys
import os
import math

# Add root directory to sys.path so decision_engine can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from decision_engine.engine import (
    calculate_user_impact,
    normalize_user_impact,
    calculate_slo_breach_score,
    normalize_slo_breach,
    calculate_error_budget_score,
    normalize_error_budget,
    calculate_incident_score,
    normalize_incident_severity,
    calculate_exam_period_score,
    calculate_priority_score,
    generate_evidence,
    generate_recommendation,
    INCIDENT_SEVERITY_MAPPING
)


class TestSLODecisionEngine(unittest.TestCase):

    def setUp(self):
        self.default_weights = {
            "user_impact": 30.0,
            "slo_breach": 25.0,
            "error_budget": 20.0,
            "incident_severity": 15.0,
            "exam_period": 10.0
        }

    # =========================================================================
    # Phase 1 Preserved Baseline Tests (Cases 1 - 8)
    # =========================================================================

    # Test Case 1 — Normal Case: Healthy service
    def test_case_1_healthy_service_produces_low_priority(self):
        user_impact = calculate_user_impact(users_affected=0, duration_minutes=0, exam_active=False)
        slo_breach = calculate_slo_breach_score(slo_target=99.99, current_sli=99.995)
        eb = calculate_error_budget_score(slo_target=99.99, successful_requests=100000, failed_requests=1)
        inc = calculate_incident_score([{"severity": "LOW"}], exam_active=False)
        exam_score = calculate_exam_period_score("TIER_2", has_exam_incidents=False, exam_mode_active=False)

        self.assertEqual(user_impact, 0.0)
        self.assertEqual(slo_breach, 0.0)
        self.assertEqual(eb["status"], "GREEN")
        self.assertLess(eb["budget_consumed_pct"], 15.0)

        scores = {
            "user_impact": user_impact,
            "slo_breach": slo_breach,
            "error_budget": eb["score"],
            "incident_severity": inc["score"],
            "exam_period": exam_score
        }
        result = calculate_priority_score(scores, self.default_weights)
        self.assertEqual(result["priority_level"], "LOW")
        self.assertFalse(result["requires_human_approval"])
        self.assertLess(result["priority_score"], 35.0)

    # Test Case 2 — Severe SLO Breach
    def test_case_2_severe_slo_breach_produces_critical_priority(self):
        user_impact = calculate_user_impact(users_affected=4500, duration_minutes=65, exam_active=True)
        slo_breach = calculate_slo_breach_score(slo_target=99.99, current_sli=97.50)
        eb = calculate_error_budget_score(slo_target=99.99, successful_requests=97500, failed_requests=2500)
        incidents = [
            {"severity": "CRITICAL"}, {"severity": "CRITICAL"},
            {"severity": "HIGH"}, {"severity": "HIGH"}
        ]
        inc = calculate_incident_score(incidents, exam_active=True)
        exam_score = calculate_exam_period_score("TIER_1", has_exam_incidents=True, exam_mode_active=True)

        self.assertGreater(user_impact, 75.0)
        self.assertGreater(slo_breach, 85.0)
        self.assertEqual(eb["status"], "RED")
        self.assertGreaterEqual(eb["budget_consumed_pct"], 100.0)

        scores = {
            "user_impact": user_impact,
            "slo_breach": slo_breach,
            "error_budget": eb["score"],
            "incident_severity": inc["score"],
            "exam_period": exam_score
        }
        result = calculate_priority_score(scores, self.default_weights)
        self.assertIn(result["priority_level"], ["HIGH", "CRITICAL"])
        self.assertTrue(result["requires_human_approval"])
        self.assertGreaterEqual(result["priority_score"], 70.0)

    # Test Case 3 — Many Incidents but Low User Impact
    def test_case_3_many_incidents_low_user_impact_not_blindly_ranked_top(self):
        incidents = [{"severity": "LOW"} for _ in range(100)]
        inc = calculate_incident_score(incidents, exam_active=False)
        user_impact = calculate_user_impact(users_affected=10, duration_minutes=15, exam_active=False)
        slo_breach = calculate_slo_breach_score(slo_target=99.50, current_sli=99.60)
        eb = calculate_error_budget_score(slo_target=99.50, successful_requests=50000, failed_requests=50)
        exam_score = calculate_exam_period_score("TIER_2", has_exam_incidents=False, exam_mode_active=False)

        scores = {
            "user_impact": user_impact,
            "slo_breach": slo_breach,
            "error_budget": eb["score"],
            "incident_severity": inc["score"],
            "exam_period": exam_score
        }
        result = calculate_priority_score(scores, self.default_weights)
        self.assertNotEqual(result["priority_level"], "CRITICAL")
        self.assertLess(result["priority_score"], 55.0)

    # Test Case 4 — High Impact During Examination
    def test_case_4_examination_period_amplification(self):
        scores_normal = {
            "user_impact": calculate_user_impact(3000, 60, False),
            "slo_breach": 40.0,
            "error_budget": 50.0,
            "incident_severity": 30.0,
            "exam_period": calculate_exam_period_score("TIER_1", False, False)
        }
        scores_exam = {
            "user_impact": calculate_user_impact(3000, 60, True),
            "slo_breach": 40.0,
            "error_budget": 50.0,
            "incident_severity": 30.0,
            "exam_period": calculate_exam_period_score("TIER_1", True, True)
        }

        res_normal = calculate_priority_score(scores_normal, self.default_weights)
        res_exam = calculate_priority_score(scores_exam, self.default_weights)

        self.assertGreater(res_exam["priority_score"], res_normal["priority_score"])
        self.assertEqual(scores_exam["exam_period"], 100.0)

    # Test Case 5 — Adversarial / Edge: Zero Requests Handling
    def test_case_5_zero_requests_no_zero_division(self):
        eb = calculate_error_budget_score(slo_target=99.90, successful_requests=0, failed_requests=0)
        self.assertEqual(eb["budget_consumed_pct"], 0.0)
        self.assertEqual(eb["status"], "GREEN")
        self.assertEqual(eb["score"], 0.0)

    # Test Case 6 — Adversarial / Edge: Malformed & Zero Weights
    def test_case_6_malformed_rule_weights(self):
        all_zeros = {"user_impact": 0.0, "slo_breach": 0.0, "error_budget": 0.0, "incident_severity": 0.0, "exam_period": 0.0}
        scores = {"user_impact": 80.0, "slo_breach": 60.0, "error_budget": 70.0, "incident_severity": 50.0, "exam_period": 40.0}
        result = calculate_priority_score(scores, all_zeros)
        self.assertGreater(result["priority_score"], 0.0)
        self.assertLessEqual(result["priority_score"], 100.0)

    # Test Case 7 — Adversarial / Edge: Negative User Count & Extreme Outliers
    def test_case_7_extreme_outliers(self):
        ui_neg = calculate_user_impact(users_affected=-500)
        self.assertEqual(ui_neg, 0.0)

        ui_huge = calculate_user_impact(users_affected=10000000, duration_minutes=99999)
        self.assertLessEqual(ui_huge, 100.0)

    # Test Case 8 — Explainability & Evidence Structure
    def test_case_8_recommendation_and_evidence_generation(self):
        eb = calculate_error_budget_score(99.99, 98200, 1800)
        inc = calculate_incident_score([{"severity": "CRITICAL"} for _ in range(12)], exam_active=True)
        scores = {
            "user_impact": 85.0,
            "slo_breach": 90.0,
            "error_budget": eb["score"],
            "incident_severity": inc["score"],
            "exam_period": 100.0
        }
        score_res = calculate_priority_score(scores, self.default_weights)
        evidence = generate_evidence(
            service_name="Exam Submission Service",
            users_affected=4500,
            current_sli=98.2,
            slo_target=99.99,
            error_budget_data=eb,
            incident_data=inc,
            exam_active=True,
            score_result=score_res
        )
        rec = generate_recommendation(
            task_name="Partition Exam Submission DB",
            service_name="Exam Submission Service",
            evidence=evidence,
            score_result=score_res
        )

        self.assertIn("Partition Exam Submission DB", rec["explanation"])
        self.assertIn("4,500", rec["explanation"])
        self.assertIn("99.99%", rec["explanation"])
        self.assertTrue(rec["requires_human_approval"])
        self.assertEqual(evidence["service_name"], "Exam Submission Service")
        self.assertTrue(evidence["slo_breached"])

    # =========================================================================
    # Phase 2 Additional Adversarial & Evaluator Tests (Cases 9 - 20)
    # =========================================================================

    # Test Case 9: Telemetry Outage Handling
    def test_case_9_telemetry_outage_handling(self):
        # Successful and failed requests are None due to telemetry pipeline failure
        eb = calculate_error_budget_score(slo_target=99.99, successful_requests=None, failed_requests=None)
        self.assertFalse(eb["telemetry_available"])
        self.assertEqual(eb["budget_consumed_pct"], 0.0)
        self.assertEqual(eb["status"], "GREEN")
        self.assertEqual(eb["score"], 0.0)

        # Recommendation and evidence should explicitly report the outage
        score_res = calculate_priority_score({"user_impact": 0.0, "slo_breach": 0.0, "error_budget": 0.0, "incident_severity": 10.0, "exam_period": 15.0}, self.default_weights)
        evidence = generate_evidence(
            service_name="Assessment Service",
            users_affected=0,
            current_sli=None,
            slo_target=99.99,
            error_budget_data=eb,
            incident_data={"total_incidents": 1, "critical_count": 0, "high_count": 0},
            exam_active=False,
            score_result=score_res,
            telemetry_status="UNAVAILABLE"
        )
        self.assertTrue(evidence["insufficient_telemetry"])
        self.assertFalse(evidence["telemetry_available"])
        self.assertIn("ZERO_REQUESTS_RECORDED", evidence["data_quality_flags"])

        rec = generate_recommendation("Restart Collector", "Assessment Service", evidence, score_res)
        self.assertIn("Telemetry Notice", rec["explanation"])

    # Test Case 10: Missing SLO Target
    def test_case_10_missing_slo_target(self):
        # Service has missing/null SLO target
        breach = calculate_slo_breach_score(slo_target=None, current_sli=98.5)
        self.assertEqual(breach, 0.0)

        eb = calculate_error_budget_score(slo_target=None, successful_requests=1000, failed_requests=10)
        self.assertIn("SLO_TARGET_MISSING_DEFAULTED", eb["data_quality_flags"])
        self.assertFalse(math.isnan(eb["score"]))
        self.assertGreaterEqual(eb["score"], 0.0)
        self.assertLessEqual(eb["score"], 100.0)

    # Test Case 11: Zero HTTP Requests
    def test_case_11_zero_http_requests(self):
        # Newly deployed microservice with 0 total traffic
        eb = calculate_error_budget_score(slo_target=99.90, successful_requests=0, failed_requests=0)
        self.assertEqual(eb["total_requests"], 0)
        self.assertEqual(eb["failed_requests"], 0)
        self.assertEqual(eb["budget_consumed_pct"], 0.0)
        self.assertEqual(eb["budget_remaining_pct"], 100.0)
        self.assertEqual(eb["status"], "GREEN")
        self.assertEqual(eb["score"], 0.0)
        self.assertIn("ZERO_REQUESTS_RECORDED", eb["data_quality_flags"])

    # Test Case 12: Corrupted Rule Weights
    def test_case_12_corrupted_rule_weights(self):
        # Weights with negative values, NaN, None, and strings
        broken_weights = {
            "user_impact": -50.0,
            "slo_breach": float('nan'),
            "error_budget": None,
            "incident_severity": "corrupted_weight",
            "exam_period": 0.0
        }
        scores = {"user_impact": 70.0, "slo_breach": 50.0, "error_budget": 60.0, "incident_severity": 40.0, "exam_period": 80.0}
        result = calculate_priority_score(scores, broken_weights)

        self.assertFalse(math.isnan(result["priority_score"]))
        self.assertGreater(result["priority_score"], 0.0)
        self.assertLessEqual(result["priority_score"], 100.0)
        total_norm_w = sum(result["normalized_weights"].values())
        self.assertAlmostEqual(total_norm_w, 1.0, places=2)

    # Test Case 13: Extreme User Impact Clamping
    def test_case_13_extreme_user_impact_clamping(self):
        # Astronomical affected student count (50M students on single institution platform)
        norm_ui = normalize_user_impact(users_affected=50000000, duration_minutes=99999, exam_active=True)
        ui_score = calculate_user_impact(users_affected=50000000, duration_minutes=99999, exam_active=True)

        self.assertLessEqual(norm_ui, 1.0)
        self.assertLessEqual(ui_score, 100.0)
        self.assertEqual(norm_ui, 1.0)
        self.assertEqual(ui_score, 100.0)

    # Test Case 14: Error-Budget Over 100 Percent
    def test_case_14_error_budget_over_100_percent(self):
        # Extreme failure rate (10,000 failures against 99.99% target = 50,000% error budget burn)
        eb = calculate_error_budget_score(slo_target=99.99, successful_requests=10000, failed_requests=10000)
        self.assertGreater(eb["budget_consumed_pct"], 100.0)
        self.assertEqual(eb["budget_remaining_pct"], 0.0)
        self.assertEqual(eb["status"], "RED")
        self.assertEqual(eb["score"], 100.0)

        norm_eb = normalize_error_budget(eb["budget_consumed_pct"])
        self.assertEqual(norm_eb, 1.0)

    # Test Case 15: P1 Low User Impact
    def test_case_15_p1_low_user_impact(self):
        # Single P1 incident logged on internal staging endpoint with only 2 users affected
        self.assertEqual(INCIDENT_SEVERITY_MAPPING["P1"], 1.00)
        inc = calculate_incident_score([{"severity": "P1"}], exam_active=False)
        self.assertEqual(inc["critical_count"], 1)

        ui = calculate_user_impact(users_affected=2, duration_minutes=10, exam_active=False)
        slo = calculate_slo_breach_score(slo_target=99.90, current_sli=99.95)
        eb = calculate_error_budget_score(slo_target=99.90, successful_requests=50000, failed_requests=2)
        exam = calculate_exam_period_score("TIER_3", has_exam_incidents=False, exam_mode_active=False)

        scores = {
            "user_impact": ui,
            "slo_breach": slo,
            "error_budget": eb["score"],
            "incident_severity": inc["score"],
            "exam_period": exam
        }
        res = calculate_priority_score(scores, self.default_weights)

        # Despite P1, low user impact (30% weight) and 0 breach keeps priority out of CRITICAL
        self.assertIn(res["priority_level"], ["LOW", "MEDIUM"])
        self.assertLess(res["priority_score"], 40.0)
        self.assertFalse(res["requires_human_approval"])

    # Test Case 16: Low Incident Count High User Impact
    def test_case_16_low_incident_count_high_user_impact(self):
        # Only 1 incident logged (P2 ticket), but 12,000 students locked out of finals submission
        inc = calculate_incident_score([{"severity": "P2"}], exam_active=True)
        self.assertEqual(inc["total_incidents"], 1)

        ui = calculate_user_impact(users_affected=12000, duration_minutes=90, exam_active=True)
        slo = calculate_slo_breach_score(slo_target=99.99, current_sli=96.00)
        eb = calculate_error_budget_score(slo_target=99.99, successful_requests=96000, failed_requests=4000)
        exam = calculate_exam_period_score("TIER_1", has_exam_incidents=True, exam_mode_active=True)

        scores = {
            "user_impact": ui,
            "slo_breach": slo,
            "error_budget": eb["score"],
            "incident_severity": inc["score"],
            "exam_period": exam
        }
        res = calculate_priority_score(scores, self.default_weights)

        # Measured user impact (30%) and SLO Breach (25%) elevate task to CRITICAL/HIGH
        self.assertGreaterEqual(res["priority_score"], 75.0)
        self.assertEqual(res["priority_level"], "CRITICAL")
        self.assertTrue(res["requires_human_approval"])

    # Test Case 17: Conflicting Priority Signals
    def test_case_17_conflicting_priority_signals(self):
        # Service A: 80 minor support tickets (noise), 12 users affected, SLO intact
        inc_A = calculate_incident_score([{"severity": "P4"} for _ in range(80)], exam_active=False)
        ui_A = calculate_user_impact(users_affected=12, duration_minutes=15, exam_active=False)
        slo_A = calculate_slo_breach_score(slo_target=99.90, current_sli=99.95)
        eb_A = calculate_error_budget_score(slo_target=99.90, successful_requests=100000, failed_requests=10)
        exam_A = calculate_exam_period_score("TIER_2", False, False)
        res_A = calculate_priority_score({
            "user_impact": ui_A, "slo_breach": slo_A, "error_budget": eb_A["score"],
            "incident_severity": inc_A["score"], "exam_period": exam_A
        }, self.default_weights)

        # Service B: 2 support tickets, 4,200 users affected during live exam, SLO breached
        inc_B = calculate_incident_score([{"severity": "P2"}, {"severity": "P2"}], exam_active=True)
        ui_B = calculate_user_impact(users_affected=4200, duration_minutes=60, exam_active=True)
        slo_B = calculate_slo_breach_score(slo_target=99.99, current_sli=98.00)
        eb_B = calculate_error_budget_score(slo_target=99.99, successful_requests=98000, failed_requests=2000)
        exam_B = calculate_exam_period_score("TIER_1", True, True)
        res_B = calculate_priority_score({
            "user_impact": ui_B, "slo_breach": slo_B, "error_budget": eb_B["score"],
            "incident_severity": inc_B["score"], "exam_period": exam_B
        }, self.default_weights)

        # Service B must substantially outrank Service A
        self.assertGreater(res_B["priority_score"], res_A["priority_score"] + 30.0)
        self.assertTrue(any("User Impact" in factor for factor in res_B["major_contributing_factors"]))

    # Test Case 18: Exam Period Extreme Load
    def test_case_18_exam_period_extreme_load(self):
        # 500,000 requests under finals load, Tier 1 service, 3,500 affected users
        eb = calculate_error_budget_score(slo_target=99.99, successful_requests=492000, failed_requests=8000)
        ui = calculate_user_impact(users_affected=3500, duration_minutes=75, exam_active=True)
        slo = calculate_slo_breach_score(slo_target=99.99, current_sli=98.40)
        inc = calculate_incident_score([{"severity": "P1"}, {"severity": "P1"}], exam_active=True)
        exam = calculate_exam_period_score("TIER_1", has_exam_incidents=True, exam_mode_active=True)

        res = calculate_priority_score({
            "user_impact": ui, "slo_breach": slo, "error_budget": eb["score"],
            "incident_severity": inc["score"], "exam_period": exam
        }, self.default_weights)

        self.assertEqual(exam, 100.0)
        self.assertEqual(eb["status"], "RED")
        self.assertEqual(res["priority_level"], "CRITICAL")
        self.assertTrue(res["requires_human_approval"])

    # Test Case 19: Missing Incident Severity
    def test_case_19_missing_incident_severity(self):
        # Incidents with missing, None, and unknown severity values
        incidents = [
            {"title": "Alert 1"},                           # Missing 'severity' key entirely
            {"title": "Alert 2", "severity": None},         # Null severity
            {"title": "Alert 3", "severity": "CUSTOM_TAG"}, # Unrecognized tag
            {"title": "Alert 4", "severity": "P1"}          # Valid P1
        ]
        inc = calculate_incident_score(incidents, exam_active=False)

        self.assertEqual(inc["total_incidents"], 4)
        self.assertEqual(inc["missing_severity_count"], 3)
        self.assertEqual(inc["critical_count"], 1)
        self.assertGreater(inc["score"], 0.0)

        # Fallback helper verification
        self.assertEqual(normalize_incident_severity(None), 0.25)
        self.assertEqual(normalize_incident_severity("UNKNOWN"), 0.25)
        self.assertEqual(normalize_incident_severity("P1"), 1.00)

    # Test Case 20: Invalid Negative Metrics
    def test_case_20_invalid_negative_metrics(self):
        # Negative users, negative duration, SLI > 100%
        ui = calculate_user_impact(users_affected=-1000, duration_minutes=-45)
        self.assertEqual(ui, 0.0)

        slo = calculate_slo_breach_score(slo_target=99.90, current_sli=105.0)
        self.assertEqual(slo, 0.0)

        eb = calculate_error_budget_score(slo_target=-99.90, successful_requests=-5000, failed_requests=-200)
        self.assertEqual(eb["budget_consumed_pct"], 0.0)
        self.assertEqual(eb["status"], "GREEN")


if __name__ == "__main__":
    unittest.main()