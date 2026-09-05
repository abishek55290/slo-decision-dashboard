import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to seed data
const SEED_FILE = path.join(process.cwd(), 'seed', 'seed_data.json');

// Helper to load current database state
function loadDatabase() {
  if (fs.existsSync(SEED_FILE)) {
    try {
      const content = fs.readFileSync(SEED_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading seed_data.json:', err);
    }
  }
  return null;
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(SEED_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving seed_data.json:', err);
  }
}

// In-memory runtime state
let RUNTIME_STATE = {
  exam_mode: true,
  last_evaluated: new Date().toISOString()
};

// -------------------------------------------------------------
// Decision Engine Math Helpers in Node.js
// -------------------------------------------------------------

function calculateUserImpact(usersAffected: number, durationMinutes: number = 60, severityMultiplier: number = 1.0, examActive: boolean = false): number {
  if (usersAffected <= 0) return 0.0;
  const baseRatio = Math.min(usersAffected / 5000.0, 1.0) * 70.0;
  const durationFactor = Math.min(durationMinutes / 120.0, 1.0) * 20.0;
  const examBonus = (examActive && usersAffected > 50) ? 10.0 : 0.0;
  const rawScore = (baseRatio + durationFactor + examBonus) * severityMultiplier;
  return Number(Math.min(Math.max(rawScore, 0.0), 100.0).toFixed(2));
}

function calculateSloBreachScore(sloTarget: number, currentSli: number): number {
  if (sloTarget <= 0 || currentSli >= sloTarget) return 0.0;
  const allowedErrorMargin = Math.max(100.0 - sloTarget, 0.01);
  const actualError = Math.max(sloTarget - currentSli, 0.0);
  const breachRatio = actualError / allowedErrorMargin;
  const score = (1.0 - Math.exp(-1.2 * breachRatio)) * 100.0;
  return Number(Math.min(Math.max(score, 0.0), 100.0).toFixed(2));
}

function calculateErrorBudgetScore(sloTarget: number, successfulRequests: number, failedRequests: number) {
  const totalRequests = successfulRequests + failedRequests;
  if (totalRequests <= 0) {
    return {
      total_requests: 0,
      failed_requests: 0,
      budget_consumed_pct: 0.0,
      budget_remaining_pct: 100.0,
      status: 'GREEN' as const,
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

function calculateIncidentScore(incidents: any[], examActive: boolean = false) {
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

function calculateExamPeriodScore(serviceTier: string, hasExamIncidents: boolean, examModeActive: boolean): number {
  if (!examModeActive && !hasExamIncidents) return 15.0;
  if (serviceTier === 'TIER_1') {
    return (examModeActive || hasExamIncidents) ? 100.0 : 40.0;
  } else if (serviceTier === 'TIER_2') {
    return examModeActive ? 65.0 : 25.0;
  } else {
    return examModeActive ? 35.0 : 10.0;
  }
}

function calculatePriorityScore(scores: any, weights: Record<string, number>) {
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

  let priority_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
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

function computeAllRecommendations(db: any) {
  const services = db.services || [];
  const sliMetrics = db.sli_metrics || [];
  const incidents = db.incidents || [];
  const tasks = db.reliability_tasks || [];
  const rules = db.rules || [];
  const decisions = db.decisions || [];
  const examMode = RUNTIME_STATE.exam_mode;

  const serviceMap = new Map<string, any>(services.map((s: any) => [s.id, s]));

  const weights: Record<string, number> = {};
  for (const r of rules) {
    const key = r.id.replace('rule_', '');
    weights[key] = r.enabled ? Number(r.weight) : 0.0;
  }

  const recs: any[] = [];

  for (const task of tasks) {
    const srv: any = serviceMap.get(task.service_id) || {
      id: task.service_id,
      name: 'Generic Service',
      slo_target: 99.9,
      tier: 'TIER_2'
    };

    const srvMetrics = sliMetrics.filter((m: any) => m.service_id === srv.id);
    const totalReq = srvMetrics.reduce((acc: number, m: any) => acc + m.total_requests, 0);
    const succReq = srvMetrics.reduce((acc: number, m: any) => acc + m.successful_requests, 0);
    const failReq = srvMetrics.reduce((acc: number, m: any) => acc + m.failed_requests, 0);
    const currentSli = totalReq > 0 ? Number(((succReq / totalReq) * 100.0).toFixed(3)) : 100.0;

    const ebData = calculateErrorBudgetScore(srv.slo_target, succReq, failReq);
    const srvIncidents = incidents.filter((i: any) => i.service_id === srv.id);
    const incData = calculateIncidentScore(srvIncidents, examMode);

    const usersAffected = srvIncidents.reduce((acc: number, i: any) => acc + (i.users_affected || 0), 0);
    const maxDuration = Math.max(...srvIncidents.map((i: any) => i.duration_minutes || 0), 30);
    const hasExamInc = srvIncidents.some((i: any) => i.exam_period);

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

    const evidence = {
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
    const latestDecision = decisions.slice().reverse().find((d: any) => d.recommendation_id === recId);

    recs.push({
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
      status: latestDecision ? latestDecision.decision : 'PENDING',
      decision: latestDecision || null,
      generated_at: new Date().toISOString()
    });
  }

  return recs.sort((a, b) => b.priority_score - a.priority_score);
}

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SLO Decision Dashboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    exam_mode_active: RUNTIME_STATE.exam_mode,
    dataset: 'DEMO / SYNTHETIC DATA'
  });
});

app.get('/api/services', (req, res) => {
  const db = loadDatabase();
  res.json(db?.services || []);
});

app.get('/api/slos', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });

  const services = db.services || [];
  const sliMetrics = db.sli_metrics || [];
  const incidents = db.incidents || [];

  const results = services.map((srv: any) => {
    const srvMetrics = sliMetrics.filter((m: any) => m.service_id === srv.id);
    const totalReq = srvMetrics.reduce((acc: number, m: any) => acc + m.total_requests, 0);
    const succReq = srvMetrics.reduce((acc: number, m: any) => acc + m.successful_requests, 0);
    const failReq = srvMetrics.reduce((acc: number, m: any) => acc + m.failed_requests, 0);
    const currentSli = totalReq > 0 ? Number(((succReq / totalReq) * 100.0).toFixed(3)) : 100.0;

    const eb = calculateErrorBudgetScore(srv.slo_target, succReq, failReq);
    const srvIncidents = incidents.filter((i: any) => i.service_id === srv.id);
    const usersAffected = srvIncidents.reduce((acc: number, i: any) => acc + (i.users_affected || 0), 0);

    return {
      service_id: srv.id,
      service_name: srv.name,
      description: srv.description,
      tier: srv.tier || 'TIER_1',
      slo_target: srv.slo_target,
      current_sli: currentSli,
      is_breached: currentSli < srv.slo_target,
      error_budget_used_pct: eb.budget_consumed_pct,
      error_budget_remaining_pct: eb.budget_remaining_pct,
      error_budget_status: eb.status,
      total_requests: totalReq,
      failed_requests: failReq,
      total_incidents: srvIncidents.length,
      users_affected: usersAffected
    };
  });

  res.json(results);
});

app.get('/api/incidents', (req, res) => {
  const db = loadDatabase();
  const serviceId = req.query.service_id as string;
  let incidents = db?.incidents || [];
  if (serviceId) {
    incidents = incidents.filter((i: any) => i.service_id === serviceId);
  }
  res.json(incidents);
});

app.get('/api/features', (req, res) => {
  const db = loadDatabase();
  res.json(db?.feature_plans || []);
});

app.get('/api/reliability-tasks', (req, res) => {
  const db = loadDatabase();
  res.json(db?.reliability_tasks || []);
});

app.post('/api/reliability-tasks/:id/status', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });
  const { status } = req.body;
  const taskId = req.params.id;

  const task = db.reliability_tasks.find((t: any) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = status;
  saveDatabase(db);
  res.json({ message: 'Task status updated', task });
});

app.get('/api/rules', (req, res) => {
  const db = loadDatabase();
  res.json(db?.rules || []);
});

app.put('/api/rules', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });

  const { rules } = req.body;
  if (!Array.isArray(rules)) {
    return res.status(400).json({ error: 'Invalid rules array' });
  }

  const updateMap = new Map(rules.map((r: any) => [r.id, r]));
  for (const r of db.rules) {
    if (updateMap.has(r.id)) {
      const u = updateMap.get(r.id);
      r.weight = Number(u.weight);
      r.enabled = Boolean(u.enabled);
      if (u.threshold !== undefined) r.threshold = Number(u.threshold);
      r.updated_at = new Date().toISOString();
    }
  }

  saveDatabase(db);
  res.json({ message: 'Rules updated successfully', rules: db.rules });
});

app.get('/api/recommendations', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });
  const recs = computeAllRecommendations(db);
  res.json(recs);
});

app.get('/api/recommendations/:id', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });
  const recs = computeAllRecommendations(db);
  const rec = recs.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
  res.json(rec);
});

app.post('/api/recommendations/:id/approve', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });
  const { user_id, user_name } = req.body;

  const newDecision = {
    id: `dec_${Date.now()}`,
    recommendation_id: req.params.id,
    user_id: user_id || 'usr_mgr_1',
    user_name: user_name || 'Elena Rostova',
    decision: 'APPROVED',
    override_reason: null,
    created_at: new Date().toISOString()
  };

  db.decisions = db.decisions || [];
  db.decisions.push(newDecision);
  saveDatabase(db);

  res.json({ message: 'Recommendation approved successfully', decision: newDecision });
});

app.post('/api/recommendations/:id/override', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });
  const { user_id, user_name, override_reason } = req.body;

  if (!override_reason || typeof override_reason !== 'string' || !override_reason.trim()) {
    return res.status(400).json({
      error: 'Human override strictly requires a clear, non-empty justification reason.'
    });
  }

  const newDecision = {
    id: `dec_${Date.now()}`,
    recommendation_id: req.params.id,
    user_id: user_id || 'usr_mgr_1',
    user_name: user_name || 'Elena Rostova',
    decision: 'OVERRIDDEN',
    override_reason: override_reason.trim(),
    created_at: new Date().toISOString()
  };

  db.decisions = db.decisions || [];
  db.decisions.push(newDecision);
  saveDatabase(db);

  res.json({ message: 'Recommendation overridden and logged successfully', decision: newDecision });
});

app.get('/api/decisions', (req, res) => {
  const db = loadDatabase();
  res.json(db?.decisions || []);
});

app.get('/api/metrics', (req, res) => {
  const db = loadDatabase();
  if (!db) return res.status(500).json({ error: 'Database unavailable' });

  const recs = computeAllRecommendations(db);
  const totalPriorities = recs.length;

  const justified = recs.filter(
    r => r.evidence.users_affected > 50 && r.evidence.scoring_breakdown.user_impact > 5.0
  );

  const justifiedCount = justified.length;
  const measuredResult = totalPriorities > 0
    ? Number(((justifiedCount / totalPriorities) * 100.0).toFixed(1))
    : 0.0;

  const baseline = 42.0;
  const target = 80.0;
  const difference = Number((measuredResult - baseline).toFixed(1));

  res.json({
    metric_name: 'Percentage of reliability priorities justified by measured user impact',
    formula: '(Reliability priorities with measurable user-impact evidence / Total reliability priorities) * 100',
    baseline_percentage: baseline,
    target_percentage: target,
    measured_result_percentage: measuredResult,
    target_met: measuredResult >= target,
    difference_vs_baseline: difference,
    total_priorities_evaluated: totalPriorities,
    justified_count: justifiedCount,
    unjustified_or_low_impact_count: totalPriorities - justifiedCount
  });
});

app.post('/api/exam-mode', (req, res) => {
  const { exam_mode } = req.body;
  RUNTIME_STATE.exam_mode = Boolean(exam_mode);
  res.json({ exam_mode: RUNTIME_STATE.exam_mode });
});

app.post('/api/reset-data', (req, res) => {
  // Re-run Python seed script to restore pristine dataset
  const { execSync } = require('child_process');
  try {
    execSync('python3 seed/seed_data.py', { encoding: 'utf-8' });
    const db = loadDatabase();
    res.json({ message: 'Synthetic dataset restored to initial state', metadata: db?.metadata });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset seed data', details: err.message });
  }
});

app.get('/api/error-analysis', (req, res) => {
  res.json([
    {
      id: 'err-01',
      title: 'Over-Prioritization Risk: High Incident Noise with Negligible User Reach',
      category: 'OVER_PRIORITIZATION',
      observed_behavior: 'Video streaming service generates 100+ low-priority CDN deprecation logs during off-peak hours.',
      root_cause: 'Unweighted incident count would traditionally drown out silent database deadlocks affecting live test-takers.',
      mitigation: 'User Impact metric carries 30% weight; minor background warnings are normalized against total impacted users.',
      system_guard: 'Weighting ceiling clamps Low severity incidents at 1.0 vs Critical at 10.0.'
    },
    {
      id: 'err-02',
      title: 'Under-Prioritization Risk: Silent Exam Submission Lockout without Immediate Tickets',
      category: 'UNDER_PRIORITIZATION',
      observed_behavior: 'Exam Submission DB deadlock prevents final turn-in; students assume slow network before filing support tickets.',
      root_cause: 'Support ticket queues lag 15–20 minutes behind active telemetry degradation.',
      mitigation: 'SLO Breach (25%) and Error Budget Burn (20%) directly compute availability drop from HTTP gateway metrics in real-time.',
      system_guard: 'Automated 120-minute sliding window triggers immediate Critical priority before support tickets arrive.'
    },
    {
      id: 'err-03',
      title: 'Missing / Intermittent Telemetry Handling on New Microservices',
      category: 'MISSING_DATA',
      observed_behavior: 'A newly provisioned microservice reports 0 total requests during pre-warming.',
      root_cause: 'Zero division on error budget calculation: (failed_requests / total_requests).',
      mitigation: 'Zero-division guard returns budget_consumed = 0% and status = GREEN with confidence flag.',
      system_guard: 'Default fallback returns valid numeric values to prevent engine crashing or UI stalls.'
    },
    {
      id: 'err-04',
      title: 'Tie-Breaking on Similar Scores (e.g. 78.4 vs 78.1)',
      category: 'TIE_BREAK',
      observed_behavior: 'Two tasks receive near-identical priority scores across different critical services.',
      root_cause: 'Both services operate under active exam conditions with equivalent user impact.',
      mitigation: 'Engine incorporates Tier ranking (Tier 1 Exam Submission over Tier 2 Video) and Estimated Effort heuristic.',
      system_guard: 'Human Engineering Manager retains final approval/override control on all scores >= 55.0.'
    }
  ]);
});

// -------------------------------------------------------------
// Vite Middleware & Static Serving Setup
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SLO Dashboard] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
