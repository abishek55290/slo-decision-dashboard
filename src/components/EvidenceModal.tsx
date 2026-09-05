import React from 'react';
import { Recommendation } from '../types';
import { X, ShieldCheck, AlertOctagon, Flame, Users, Calendar, BarChart2, CheckCircle2, HelpCircle } from 'lucide-react';

interface EvidenceModalProps {
  recommendation: Recommendation | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ recommendation, onClose }) => {
  if (!recommendation) return null;

  const { evidence, priority_score, priority_level, explanation, action_summary } = recommendation;
  const sb = evidence.scoring_breakdown;
  const mb = evidence.max_possible_breakdown;

  const factorList = [
    {
      name: 'User Impact',
      actualPoints: sb.user_impact,
      maxPoints: mb.user_impact,
      metricDetail: `${evidence.users_affected.toLocaleString()} active students affected`,
      color: 'bg-[#FF4E00]',
      description: 'Measures student blast radius and downtime duration during academic work.'
    },
    {
      name: 'SLO Breach Severity',
      actualPoints: sb.slo_breach,
      maxPoints: mb.slo_breach,
      metricDetail: evidence.slo_breached
        ? `Breached (${evidence.current_sli}% vs target ${evidence.slo_target}%)`
        : `Compliant (${evidence.current_sli}% vs ${evidence.slo_target}%)`,
      color: 'bg-[#121212]',
      description: 'Quantifies distance between contract SLO target and empirical HTTP availability.'
    },
    {
      name: 'Error Budget Burn Rate',
      actualPoints: sb.error_budget,
      maxPoints: mb.error_budget,
      metricDetail: `${evidence.error_budget_used_pct}% consumed (${evidence.error_budget_remaining_pct}% remaining, ${evidence.error_budget_status})`,
      color: 'bg-[#FF4E00]',
      description: 'Standard error budget exhaustion calculation: (actual_fail / allowed_fail).'
    },
    {
      name: 'Incident Severity',
      actualPoints: sb.incident_severity,
      maxPoints: mb.incident_severity,
      metricDetail: `${evidence.total_incidents} logged (${evidence.critical_incidents} Critical, ${evidence.high_incidents} High)`,
      color: 'bg-[#121212]',
      description: 'Support ticket volume weighted by Severity (Critical 10x, High 6x, Medium 3x, Low 1x).'
    },
    {
      name: 'Examination Period',
      actualPoints: sb.exam_period,
      maxPoints: mb.exam_period,
      metricDetail: evidence.examination_period_active ? 'ACTIVE EXAM WINDOW (Tier-1 mission critical)' : 'Off-Peak Semester Baseline',
      color: 'bg-[#FF4E00]',
      description: 'Amplifier applied to mission-critical test-taking, upload, and authentication subsystems.'
    }
  ];

  return (
    <div
      id="evidence-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/80 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="evidence-modal-card"
        className="bg-[#F9F9F7] border-2 border-[#121212] max-w-3xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#121212] text-[#F9F9F7] px-6 py-4 flex items-center justify-between border-b-2 border-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF4E00] flex items-center justify-center text-white">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold italic serif">
                Explainable Decision Evidence Audit
              </h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#F9F9F7]/70">
                Auditable Factor Contributions & Deterministic Rules Proof
              </p>
            </div>
          </div>
          <button
            id="btn-close-evidence-modal"
            onClick={onClose}
            className="text-[#F9F9F7]/70 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Target Task & Recommendation Summary */}
          <div className="bg-white border border-[#121212] p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">
                Targeted Remediation Task
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                priority_level === 'CRITICAL' ? 'bg-[#FF4E00] text-white' : 'bg-[#121212] text-white'
              }`}>
                {priority_level} PRIORITY ({priority_score.toFixed(1)} / 100)
              </span>
            </div>
            <h4 className="text-2xl font-bold italic serif text-[#121212]">
              {recommendation.task_name}
            </h4>
            <p className="text-xs text-[#121212]/70 mt-1">
              Service: <strong className="text-[#121212]">{evidence.service_name}</strong>
            </p>
            <div className="mt-3 p-3 bg-[#F9F9F7] border-l-2 border-[#121212] text-xs text-[#121212] italic leading-relaxed">
              <strong className="font-sans not-italic font-bold text-[#121212] block mb-1 uppercase tracking-wider text-[10px]">
                Deterministic Engine Justification:
              </strong>
              "{explanation}"
            </div>
          </div>

          {/* Point Contribution Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
                Configurable Factor Contribution Breakdown
              </h5>
              <span className="text-xs font-mono font-bold text-[#121212] border border-[#121212] px-2 py-0.5 bg-white">
                Total: {priority_score.toFixed(1)} / 100
              </span>
            </div>

            <div className="border border-[#121212] bg-white overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9F7] border-b border-[#121212] text-[10px] uppercase font-bold tracking-widest text-[#121212]">
                    <th className="py-2.5 px-4">Decision Factor</th>
                    <th className="py-2.5 px-4">Telemetry Evidence</th>
                    <th className="py-2.5 px-4 text-right">Points / Max</th>
                    <th className="py-2.5 px-4 w-32">Weight Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#121212]/15 font-mono">
                  {factorList.map((factor) => {
                    const pct = factor.maxPoints > 0 ? (factor.actualPoints / factor.maxPoints) * 100 : 0;
                    return (
                      <tr key={factor.name} className="hover:bg-[#F9F9F7]">
                        <td className="py-2.5 px-4 font-sans font-bold text-[#121212]">
                          {factor.name}
                        </td>
                        <td className="py-2.5 px-4 text-[#121212]/70 text-[11px]">
                          {factor.metricDetail}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#121212]">
                          {factor.actualPoints.toFixed(1)} / {factor.maxPoints.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="w-full bg-[#121212]/10 h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${factor.color}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* The 7 Explicit Explainability Answers */}
          <div>
            <h5 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block mb-3">
              7-Point Audit Checklist (Explainability Mandate)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white border border-[#121212]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block">1. What should be fixed?</span>
                <span className="font-bold text-base italic serif text-[#121212] mt-0.5 block">{recommendation.task_name}</span>
                <span className="text-[11px] text-[#121212]/70 mt-1 block">{recommendation.task_description}</span>
              </div>

              <div className="p-3.5 bg-white border border-[#121212]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block">2. Why should it be fixed?</span>
                <span className="font-medium text-[#121212] mt-0.5 block">
                  {evidence.slo_breached
                    ? `Active breach of ${evidence.slo_target}% SLO under live exam traffic with error budget burning at ${evidence.error_budget_used_pct}%.`
                    : `Preemptive stabilization during high-concurrency assessment window.`}
                </span>
              </div>

              <div className="p-3.5 bg-white border border-[#121212]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block">3. Who is affected?</span>
                <span className="font-black text-lg italic serif text-[#FF4E00] mt-0.5 block">
                  {evidence.users_affected.toLocaleString()} enrolled students
                </span>
                <span className="text-[11px] text-[#121212]/70 mt-0.5 block">
                  Engaged in timed exam uploads, authentication, or proctoring.
                </span>
              </div>

              <div className="p-3.5 bg-white border border-[#121212]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block">4. Which SLO is breached?</span>
                <span className={`font-mono font-bold mt-0.5 block ${evidence.slo_breached ? 'text-[#FF4E00]' : 'text-emerald-800'}`}>
                  {evidence.slo_breached
                    ? `Breached: Contract ${evidence.slo_target}% vs Observed ${evidence.current_sli}%`
                    : `Compliant: Contract ${evidence.slo_target}% (Observed ${evidence.current_sli}%)`}
                </span>
              </div>

              <div className="p-3.5 bg-white border border-[#121212]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block">5. How much error budget is consumed?</span>
                <span className={`font-mono font-bold mt-0.5 block ${evidence.error_budget_used_pct >= 100 ? 'text-[#FF4E00]' : 'text-amber-800'}`}>
                  {evidence.error_budget_used_pct}% consumed ({evidence.error_budget_remaining_pct}% remaining)
                </span>
                <span className="text-[11px] text-[#121212]/70 mt-0.5 block">Status: {evidence.error_budget_status}</span>
              </div>

              <div className="p-3.5 bg-white border border-[#121212]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block">6. How many incidents occurred?</span>
                <span className="font-bold font-mono text-base text-[#121212] mt-0.5 block">
                  {evidence.total_incidents} logged incidents
                </span>
                <span className="text-[11px] text-[#121212]/70 mt-0.5 block">
                  {evidence.critical_incidents} Critical severity, {evidence.high_incidents} High severity.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-[#121212] flex justify-end">
          <button
            id="btn-dismiss-evidence"
            onClick={onClose}
            className="px-6 py-2 border-2 border-[#121212] bg-[#121212] text-white font-black uppercase text-xs tracking-widest hover:bg-transparent hover:text-[#121212] transition-colors"
          >
            Close Audit Panel
          </button>
        </div>
      </div>
    </div>
  );
};
