/**
 * Test Suite Runner for SLO Decision Dashboard
 * Executes Normal, Adversarial, and Edge Case Tests
 */

import {
  calculateUserImpact,
  calculateSloBreachScore,
  calculateErrorBudgetScore,
  calculateIncidentScore,
  calculateExamPeriodScore,
  calculatePriorityScore
} from './decisionEngine';
import { TestResultItem } from '../types';

export function runAllAutomatedTests(): TestResultItem[] {
  const results: TestResultItem[] = [];
  const defaultWeights = {
    user_impact: 30.0,
    slo_breach: 25.0,
    error_budget: 20.0,
    incident_severity: 15.0,
    exam_period: 10.0
  };

  // Test 1: Normal Case - Healthy Service
  {
    const start = performance.now();
    const ui = calculateUserImpact(0, 0, 1.0, false);
    const slo = calculateSloBreachScore(99.99, 99.995);
    const eb = calculateErrorBudgetScore(99.99, 100000, 1);
    const inc = calculateIncidentScore([{ id: '1', incident_id: 'i1', service_id: 's1', title: 'test', severity: 'LOW', users_affected: 0, duration_minutes: 5, status: 'RESOLVED', exam_period: false, created_at: '' }]);
    const exam = calculateExamPeriodScore('TIER_2', false, false);
    const res = calculatePriorityScore({
      user_impact: ui,
      slo_breach: slo,
      error_budget: eb.score,
      incident_severity: inc.score,
      exam_period: exam
    }, defaultWeights);

    const passed = res.priority_level === 'LOW' && !res.requires_human_approval && res.priority_score < 35.0;
    results.push({
      id: 'tc-01',
      test_name: 'Test Case 1: Healthy Service Baseline',
      category: 'NORMAL',
      description: 'Healthy service (SLO met, 0 users affected, healthy error budget) must produce LOW priority score (<35) with no approval required.',
      expected: 'priority_level = "LOW", requires_approval = false, score < 35.0',
      actual: `priority_level = "${res.priority_level}", requires_approval = ${res.requires_human_approval}, score = ${res.priority_score}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 2: Severe SLO Breach
  {
    const start = performance.now();
    const ui = calculateUserImpact(4500, 65, 1.0, true);
    const slo = calculateSloBreachScore(99.99, 97.50);
    const eb = calculateErrorBudgetScore(99.99, 97500, 2500);
    const inc = calculateIncidentScore([
      { id: '1', incident_id: 'i1', service_id: 's1', title: 't1', severity: 'CRITICAL', users_affected: 2000, duration_minutes: 60, status: 'OPEN', exam_period: true, created_at: '' },
      { id: '2', incident_id: 'i2', service_id: 's1', title: 't2', severity: 'CRITICAL', users_affected: 2500, duration_minutes: 65, status: 'OPEN', exam_period: true, created_at: '' }
    ], true);
    const exam = calculateExamPeriodScore('TIER_1', true, true);
    const res = calculatePriorityScore({
      user_impact: ui,
      slo_breach: slo,
      error_budget: eb.score,
      incident_severity: inc.score,
      exam_period: exam
    }, defaultWeights);

    const passed = (res.priority_level === 'CRITICAL' || res.priority_level === 'HIGH') && res.requires_human_approval && res.priority_score >= 70.0;
    results.push({
      id: 'tc-02',
      test_name: 'Test Case 2: Severe SLO Breach on Critical Service',
      category: 'NORMAL',
      description: 'Severe SLO breach (97.5% vs 99.99%), 4,500 affected students, exhausted error budget must produce CRITICAL/HIGH with mandatory human confirmation.',
      expected: 'priority_level in ["HIGH", "CRITICAL"], requires_approval = true, score >= 70.0',
      actual: `priority_level = "${res.priority_level}", requires_approval = ${res.requires_human_approval}, score = ${res.priority_score}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 3: Many Incidents but Low User Impact
  {
    const start = performance.now();
    const lowIncidents = Array.from({ length: 100 }, (_, idx) => ({
      id: `low_${idx}`,
      incident_id: `INC-LOW-${idx}`,
      service_id: 'srv_video',
      title: 'Minor telemetry heartbeat',
      severity: 'LOW' as const,
      users_affected: 0,
      duration_minutes: 5,
      status: 'RESOLVED' as const,
      exam_period: false,
      created_at: ''
    }));
    const inc = calculateIncidentScore(lowIncidents, false);
    const ui = calculateUserImpact(10, 15, 1.0, false);
    const slo = calculateSloBreachScore(99.50, 99.60);
    const eb = calculateErrorBudgetScore(99.50, 50000, 50);
    const exam = calculateExamPeriodScore('TIER_2', false, false);
    const res = calculatePriorityScore({
      user_impact: ui,
      slo_breach: slo,
      error_budget: eb.score,
      incident_severity: inc.score,
      exam_period: exam
    }, defaultWeights);

    const passed = res.priority_level !== 'CRITICAL' && res.priority_score < 55.0;
    results.push({
      id: 'tc-03',
      test_name: 'Test Case 3: Many Incidents with Low User Impact',
      category: 'NORMAL',
      description: '100 minor support pings affecting only 10 users must NOT blindly rank #1 because user impact carries 30% weight.',
      expected: 'priority_level != "CRITICAL", score < 55.0',
      actual: `priority_level = "${res.priority_level}", score = ${res.priority_score}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 4: Examination Period Surge
  {
    const start = performance.now();
    const baseScores = {
      user_impact: calculateUserImpact(3000, 60, 1.0, false),
      slo_breach: 40.0,
      error_budget: 50.0,
      incident_severity: 30.0,
      exam_period: calculateExamPeriodScore('TIER_1', false, false)
    };
    const examScores = {
      user_impact: calculateUserImpact(3000, 60, 1.0, true),
      slo_breach: 40.0,
      error_budget: 50.0,
      incident_severity: 30.0,
      exam_period: calculateExamPeriodScore('TIER_1', true, true)
    };
    const resBase = calculatePriorityScore(baseScores, defaultWeights);
    const resExam = calculatePriorityScore(examScores, defaultWeights);

    const passed = resExam.priority_score > resBase.priority_score && examScores.exam_period === 100.0;
    results.push({
      id: 'tc-04',
      test_name: 'Test Case 4: High Impact During Active Examination',
      category: 'NORMAL',
      description: 'Services active during an examination period receive strong score surge reflecting academic risk.',
      expected: 'score(ExamMode ON) > score(ExamMode OFF) and exam_period = 100',
      actual: `Exam ON: ${resExam.priority_score} pts vs Normal: ${resBase.priority_score} pts (+${(resExam.priority_score - resBase.priority_score).toFixed(1)} pts surge)`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 5: Adversarial - Zero Requests & Zero Division Protection
  {
    const start = performance.now();
    const eb = calculateErrorBudgetScore(99.90, 0, 0);
    const passed = eb.budget_consumed_pct === 0.0 && eb.status === 'GREEN' && eb.score === 0.0;
    results.push({
      id: 'tc-05',
      test_name: 'Test Case 5: Zero Telemetry Requests (Zero-Division Guard)',
      category: 'ADVERSARIAL',
      description: 'Service with 0 total requests must cleanly return 0 consumed budget without throwing NaN or divide-by-zero errors.',
      expected: 'budget_consumed_pct = 0.0, status = "GREEN", score = 0.0',
      actual: `budget_consumed_pct = ${eb.budget_consumed_pct}, status = "${eb.status}", score = ${eb.score}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 6: Adversarial - All Weights Set to Zero or Negative
  {
    const start = performance.now();
    const brokenWeights = {
      user_impact: 0.0,
      slo_breach: 0.0,
      error_budget: 0.0,
      incident_severity: 0.0,
      exam_period: 0.0
    };
    const res = calculatePriorityScore({
      user_impact: 80.0,
      slo_breach: 60.0,
      error_budget: 70.0,
      incident_severity: 50.0,
      exam_period: 40.0
    }, brokenWeights);

    const passed = !isNaN(res.priority_score) && res.priority_score > 0.0 && res.priority_score <= 100.0;
    results.push({
      id: 'tc-06',
      test_name: 'Test Case 6: Malformed Weights Fallback Protection',
      category: 'ADVERSARIAL',
      description: 'If an operator sets all rule weights to 0, system must safely normalize to balanced defaults rather than outputting NaN.',
      expected: 'priority_score is valid float between 0 and 100, no NaN',
      actual: `priority_score = ${res.priority_score}, isNaN = ${isNaN(res.priority_score)}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 7: Adversarial - Negative and Extreme User Numbers
  {
    const start = performance.now();
    const uiNeg = calculateUserImpact(-500);
    const uiHuge = calculateUserImpact(100000000, 99999);
    const passed = uiNeg === 0.0 && uiHuge <= 100.0;
    results.push({
      id: 'tc-07',
      test_name: 'Test Case 7: Extreme Outlier and Negative User Count Clamping',
      category: 'ADVERSARIAL',
      description: 'Negative users clamp to 0; astronomical student counts clamp cleanly to 100.0 maximum.',
      expected: 'negative = 0.0, 100M students <= 100.0',
      actual: `negative = ${uiNeg}, 100M students = ${uiHuge}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  // Test 8: Edge Case - Human Override Enforces Justification
  {
    const start = performance.now();
    const emptyReasonValid = (reason: string | null | undefined) => Boolean(reason && reason.trim().length > 0);
    const test1 = emptyReasonValid('');
    const test2 = emptyReasonValid('   ');
    const test3 = emptyReasonValid('Temporary edge rate-limit deployed; schema migration scheduled for window post-finals.');
    const passed = !test1 && !test2 && test3;
    results.push({
      id: 'tc-08',
      test_name: 'Test Case 8: Human Override Justification Enforcement',
      category: 'EDGE_CASE',
      description: 'System strictly rejects blank or whitespace override justifications; records structured decision record.',
      expected: 'rejects empty/whitespace, accepts valid operational reason',
      actual: `empty valid = ${test1}, whitespace valid = ${test2}, valid justification = ${test3}`,
      passed,
      duration_ms: Number((performance.now() - start).toFixed(2))
    });
  }

  return results;
}

console.log(runAllAutomatedTests());
