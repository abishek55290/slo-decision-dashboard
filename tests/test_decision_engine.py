"""
Automated Test Suite for SLO Decision Engine
Covers:
- Normal cases (Healthy service, Severe SLO Breach)
- Multi-factor balance (High incidents but low user impact)
- Examination period surge
- Missing & invalid data handling (zero requests, negative weights, missing fields)
- Adversarial & edge cases
"""

import unittest
import sys
import os

# Add root directory to sys.path so decision_engine can be imported
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


class TestSLODecisionEngine(unittest.TestCase):

    def setUp(self):
        self.default_weights = {
            "user_impact": 30.0,
            "slo_breach": 25.0,
            "error_budget": 20.0,
            "incident_severity": 15.0,
            "exam_period": 10.0
        }

    # Test Case 1 — Normal Case: Healthy service
    def test_case_1_healthy_service_produces_low_priority(self):
        # Healthy service: 99.99% target, current 99.995%, 0 users affected, 1 low incident
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
        # Exam submission: 99.99% target, current 97.5% (severe drop), 4,500 users affected
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
        # 100 minor incidents but only 10 users affected and SLO intact
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
        # Even with maximum incident score, low user impact & 0 breach keeps it below CRITICAL
        self.assertNotEqual(result["priority_level"], "CRITICAL")
        self.assertLess(result["priority_score"], 55.0)

    # Test Case 4 — High Impact During Examination
    def test_case_4_examination_period_amplification(self):
        # Compare same scenario with exam mode OFF vs exam mode ON
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
        # Should gracefully fall back to balanced weights without ZeroDivisionError
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


if __name__ == "__main__":
    unittest.main()
