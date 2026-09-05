import React, { useState, useEffect, useCallback } from 'react';
import { Header, USERS } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { SloHealthTable } from './components/SloHealthTable';
import { RecommendationsList } from './components/RecommendationsList';
import { UserImpactCharts } from './components/UserImpactCharts';
import { ReliabilityVsFeatures } from './components/ReliabilityVsFeatures';
import { RulesConfigView } from './components/RulesConfigView';
import { DecisionsView } from './components/DecisionsView';
import { EvaluationMetricsView } from './components/EvaluationMetricsView';
import { ErrorAnalysisView } from './components/ErrorAnalysisView';
import { TestRunnerView } from './components/TestRunnerView';
import { EvidenceModal } from './components/EvidenceModal';
import { OverrideModal } from './components/OverrideModal';
import { DocGuideModal } from './components/DocGuideModal';

import {
  User,
  ServiceSLOSummary,
  Incident,
  FeaturePlan,
  ReliabilityTask,
  ConfigurableRule,
  Recommendation,
  DecisionRecord,
  ErrorAnalysisItem
} from './types';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); // Elena Rostova (Manager) by default
  const [examMode, setExamMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Data states
  const [slos, setSlos] = useState<ServiceSLOSummary[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [features, setFeatures] = useState<FeaturePlan[]>([]);
  const [tasks, setTasks] = useState<ReliabilityTask[]>([]);
  const [rules, setRules] = useState<ConfigurableRule[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [errorAnalysisItems, setErrorAnalysisItems] = useState<ErrorAnalysisItem[]>([]);

  // Modals state
  const [selectedEvidenceRec, setSelectedEvidenceRec] = useState<Recommendation | null>(null);
  const [overrideModalRec, setOverrideModalRec] = useState<Recommendation | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch all data from Express API
  const refreshAllData = useCallback(async () => {
    try {
      const [
        slosRes,
        incRes,
        featRes,
        tasksRes,
        rulesRes,
        recsRes,
        decRes,
        metricsRes,
        errRes
      ] = await Promise.all([
        fetch('/api/slos'),
        fetch('/api/incidents'),
        fetch('/api/features'),
        fetch('/api/reliability-tasks'),
        fetch('/api/rules'),
        fetch('/api/recommendations'),
        fetch('/api/decisions'),
        fetch('/api/metrics'),
        fetch('/api/error-analysis')
      ]);

      const [
        slosData,
        incData,
        featData,
        tasksData,
        rulesData,
        recsData,
        decData,
        metricsData,
        errData
      ] = await Promise.all([
        slosRes.json(),
        incRes.json(),
        featRes.json(),
        tasksRes.json(),
        rulesRes.json(),
        recsRes.json(),
        decRes.json(),
        metricsRes.json(),
        errRes.json()
      ]);

      setSlos(slosData);
      setIncidents(incData);
      setFeatures(featData);
      setTasks(tasksData);
      setRules(rulesData);
      setRecommendations(recsData);
      setDecisions(decData);
      setMetrics(metricsData);
      setErrorAnalysisItems(errData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Error connecting to backend API', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Exam mode toggle handler
  const handleExamModeToggle = async () => {
    const nextMode = !examMode;
    setExamMode(nextMode);
    try {
      await fetch('/api/exam-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_mode: nextMode })
      });
      showToast(
        nextMode
          ? 'Examination Mode Activated: Priority score multiplier applied to Tier 1 exam services.'
          : 'Off-Peak Mode: Standard baseline semester weights restored.',
        'info'
      );
      refreshAllData();
    } catch (err) {
      console.error('Error toggling exam mode:', err);
    }
  };

  // Reset synthetic data handler
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      showToast('Synthetic test dataset reset to clean baseline.', 'success');
      await refreshAllData();
    } catch (err) {
      console.error('Failed to reset dataset:', err);
      showToast('Failed to reset seed data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Approve recommendation handler
  const handleApproveRecommendation = async (rec: Recommendation) => {
    if (currentUser.role !== 'ENGINEERING_MANAGER') {
      showToast('Role Restriction: Only an Engineering Manager can approve high-impact items.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/recommendations/${rec.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          user_name: currentUser.name
        })
      });
      if (res.ok) {
        showToast(`Approved: ${rec.task_name} prioritized for active sprint.`, 'success');
        refreshAllData();
      }
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
      showToast('Failed to record approval', 'error');
    }
  };

  // Open override modal
  const handleOpenOverride = (rec: Recommendation) => {
    if (currentUser.role !== 'ENGINEERING_MANAGER') {
      showToast('Role Restriction: Only an Engineering Manager can override decisions.', 'error');
      return;
    }
    setOverrideModalRec(rec);
  };

  // Submit override handler
  const handleSubmitOverride = async (recId: string, reason: string) => {
    try {
      const res = await fetch(`/api/recommendations/${recId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          user_name: currentUser.name,
          override_reason: reason
        })
      });
      if (res.ok) {
        showToast('Decision override and operational justification recorded.', 'info');
        refreshAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit override', 'error');
      }
    } catch (err) {
      console.error('Failed to override recommendation:', err);
      showToast('Error communicating override to backend', 'error');
    }
  };

  // Save rules configuration handler
  const handleSaveRules = async (updatedRules: ConfigurableRule[]) => {
    const res = await fetch('/api/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: updatedRules })
    });
    if (!res.ok) {
      throw new Error('Failed to update rules on server');
    }
    showToast('Rule weights saved. Re-computed priority ranking live.', 'success');
    await refreshAllData();
  };

  // Reset rules to defaults
  const handleResetRuleDefaults = async () => {
    const defaultRules: ConfigurableRule[] = [
      { id: 'rule_user_impact', rule_name: 'User Impact', description: 'Impacted student count & downtime duration', weight: 30.0, threshold: 50.0, enabled: true },
      { id: 'rule_slo_breach', rule_name: 'SLO Breach Severity', description: 'Distance between observed availability and contract SLO', weight: 25.0, threshold: 0.1, enabled: true },
      { id: 'rule_error_budget', rule_name: 'Error Budget Burn Rate', description: 'Percentage of allowable failure allowance consumed', weight: 20.0, threshold: 70.0, enabled: true },
      { id: 'rule_incident_severity', rule_name: 'Incident Severity & Volume', description: 'Support escalation velocity weighted by Critical & High severity', weight: 15.0, threshold: 5.0, enabled: true },
      { id: 'rule_exam_period', rule_name: 'Active Examination Period', description: 'Amplifier for exam submissions, assessments, and authentication', weight: 10.0, threshold: 1.0, enabled: true }
    ];
    await handleSaveRules(defaultRules);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#121212] flex flex-col font-sans selection:bg-[#FF4E00] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast"
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 border-2 border-[#121212] shadow-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#121212] text-[#F9F9F7]'
              : toastMessage.type === 'error'
              ? 'bg-[#FF4E00] text-white'
              : 'bg-white text-[#121212]'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-[#FF4E00]" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
          {toastMessage.type === 'info' && <CheckCircle className="w-4 h-4 text-[#FF4E00]" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        examMode={examMode}
        onExamModeToggle={handleExamModeToggle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResetData={handleResetData}
        isResetting={isResetting}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-[#121212]/60 text-xs font-mono">
            <RefreshCw className="w-8 h-8 text-[#FF4E00] animate-spin mb-3" />
            <span>Connecting to telemetry feeds and decision models...</span>
          </div>
        ) : (
          <>
            {/* View 1: Main Dashboard */}
            {activeTab === 'dashboard' && (
              <div id="view-dashboard" className="space-y-8 animate-in fade-in duration-150">
                {/* KPI Metrics */}
                <KpiCards slos={slos} incidents={incidents} tasks={tasks} />

                {/* SLO Health Matrix Table */}
                <SloHealthTable slos={slos} />

                {/* Recharts: User Impact & SLO Performance */}
                <UserImpactCharts slos={slos} />

                {/* Ranked Recommendations List with Evidence & Approval */}
                <RecommendationsList
                  recommendations={recommendations}
                  currentUser={currentUser}
                  onViewEvidence={(rec) => setSelectedEvidenceRec(rec)}
                  onApprove={handleApproveRecommendation}
                  onOverride={handleOpenOverride}
                />

                {/* Reliability vs Feature Work Backlog Balance */}
                <ReliabilityVsFeatures features={features} tasks={tasks} />
              </div>
            )}

            {/* View 2: Rules Configuration */}
            {activeTab === 'rules' && (
              <div id="view-rules" className="animate-in fade-in duration-150">
                <RulesConfigView
                  rules={rules}
                  currentUser={currentUser}
                  onSaveRules={handleSaveRules}
                  onResetDefaults={handleResetRuleDefaults}
                />
              </div>
            )}

            {/* View 3: Decisions & History Audit Log */}
            {activeTab === 'decisions' && (
              <div id="view-decisions" className="animate-in fade-in duration-150">
                <DecisionsView decisions={decisions} />
              </div>
            )}

            {/* View 4: Quantitative Evaluation Metrics */}
            {activeTab === 'evaluation' && (
              <div id="view-evaluation" className="animate-in fade-in duration-150">
                <EvaluationMetricsView metrics={metrics} />
              </div>
            )}

            {/* View 5: Error Analysis */}
            {activeTab === 'error-analysis' && (
              <div id="view-error-analysis" className="animate-in fade-in duration-150">
                <ErrorAnalysisView items={errorAnalysisItems} />
              </div>
            )}

            {/* View 6: Automated Test Suite Runner */}
            {activeTab === 'tests' && (
              <div id="view-tests" className="animate-in fade-in duration-150">
                <TestRunnerView />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#121212] py-6 px-6 text-xs text-[#121212]/70">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4E00]"></span>
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#121212]">
              SLO Reliability Prioritization Engine &bull; Examination Infrastructure
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#121212]/60">
            Field-Ready SRE Decision Dispatch Architecture &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>

      {/* Evidence Modal */}
      <EvidenceModal
        recommendation={selectedEvidenceRec}
        onClose={() => setSelectedEvidenceRec(null)}
      />

      {/* Override Modal */}
      <OverrideModal
        isOpen={Boolean(overrideModalRec)}
        recommendation={overrideModalRec}
        currentUser={currentUser}
        onClose={() => setOverrideModalRec(null)}
        onSubmitOverride={handleSubmitOverride}
      />

      {/* Documentation & Demo Guide Modal */}
      <DocGuideModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
