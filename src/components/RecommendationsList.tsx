import React from 'react';
import { Recommendation, User } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, ThumbsUp, CornerUpLeft, Lock, ArrowUpDown } from 'lucide-react';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  currentUser: User;
  onViewEvidence: (rec: Recommendation) => void;
  onApprove: (rec: Recommendation) => void;
  onOverride: (rec: Recommendation) => void;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  currentUser,
  onViewEvidence,
  onApprove,
  onOverride
}) => {
  const isManager = currentUser.role === 'ENGINEERING_MANAGER';

  return (
    <div id="recommendations-section" className="border border-[#121212] bg-[#F9F9F7] mb-8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#121212] bg-white flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
            Ranked Reliability Priorities
          </h2>
          <p className="text-xs text-[#121212]/70 mt-1 font-medium">
            Ranked by multi-factor score: User Impact (30%), SLO Breach (25%), Error Budget (20%), Incident Severity (15%), Exam Period (10%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isManager ? (
            <div className="flex items-center gap-1.5 text-xs text-[#121212] bg-[#F9F9F7] border border-[#121212] px-3 py-1 font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span>Engineer View • Manager Authorization Required</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-100 border border-emerald-400 px-3 py-1 font-black uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Manager Authorization Active</span>
            </div>
          )}
        </div>
      </div>

      {/* List / Cards of Ranked Recommendations */}
      <div className="divide-y divide-[#121212]">
        {recommendations.map((rec, index) => {
          const rank = index + 1;
          const isPending = rec.status === 'PENDING';
          const isApproved = rec.status === 'APPROVED';
          const isOverridden = rec.status === 'OVERRIDDEN';

          return (
            <section
              key={rec.id}
              id={`rec-item-${rec.id}`}
              className="p-6 sm:p-8 bg-white hover:bg-[#F9F9F7]/40 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left: Rank, Priority, Title, Service, Explanation */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-[#121212] text-white px-2.5 py-0.5 text-xs font-black uppercase tracking-widest italic">
                      Priority #{rank < 10 ? `0${rank}` : rank}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#121212] border border-[#121212] px-2 py-0.5 bg-[#F9F9F7]">
                      {rec.service_name}
                    </span>
                    <span className="text-xs text-[#121212]/60 font-mono">
                      Effort: <strong className="text-[#121212]">{rec.estimated_effort}</strong>
                    </span>

                    {rec.requires_human_approval && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-[#FF4E00] px-2 py-0.5 uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3 text-white" />
                        Approval Required
                      </span>
                    )}

                    {/* Decision Status Badge */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-400 px-2 py-0.5 uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3 text-emerald-700" />
                        APPROVED
                      </span>
                    )}
                    {isOverridden && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-900 bg-purple-100 border border-purple-400 px-2 py-0.5 uppercase tracking-wider">
                        <CornerUpLeft className="w-3 h-3 text-purple-700" />
                        OVERRIDDEN
                      </span>
                    )}
                  </div>

                  {/* Task Name in Serif */}
                  <h3 className="text-2xl sm:text-3xl font-bold italic serif text-[#121212]">
                    {rec.task_name}
                  </h3>

                  {/* Generated Natural Language Explanation Quote */}
                  <div className="border-l-2 border-[#121212] pl-4 my-3 italic text-[#121212] text-sm leading-relaxed bg-[#F9F9F7] p-3.5">
                    "{rec.explanation}"
                  </div>

                  {/* Quick Metric Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                    <span className="px-2 py-0.5 border border-[#121212]/20 bg-white">
                      Students Affected: <strong className="text-[#121212] font-black">{rec.evidence.users_affected.toLocaleString()}</strong>
                    </span>
                    <span className="px-2 py-0.5 border border-[#121212]/20 bg-white">
                      SLO: <strong className="text-[#121212]">{rec.evidence.slo_target}%</strong> (Actual: <strong className={rec.evidence.slo_breached ? 'text-red-600 font-bold' : 'text-emerald-700'}>{rec.evidence.current_sli}%</strong>)
                    </span>
                    <span className="px-2 py-0.5 border border-[#121212]/20 bg-white">
                      Budget Used: <strong className={rec.evidence.error_budget_used_pct >= 100 ? 'text-red-600 font-bold' : 'text-[#121212]'}>{rec.evidence.error_budget_used_pct}%</strong>
                    </span>
                    <span className="px-2 py-0.5 border border-[#121212]/20 bg-white">
                      Incidents: <strong className="text-[#121212] font-bold">{rec.evidence.total_incidents}</strong>
                    </span>
                  </div>

                  {/* Show Override Reason if overridden */}
                  {isOverridden && rec.decision?.override_reason && (
                    <div className="mt-2 text-xs text-[#121212] bg-amber-50 border border-amber-300 p-3">
                      <strong className="text-amber-900 font-bold uppercase tracking-wider block mb-1">
                        Manager Override Justification ({rec.decision.user_name}):
                      </strong>
                      <p className="italic font-serif text-sm">{rec.decision.override_reason}</p>
                    </div>
                  )}
                </div>

                {/* Right: Score Display & Human Approval Buttons */}
                <div className="flex flex-col items-start lg:items-end justify-between gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#121212]/20 lg:pl-6 lg:border-l">
                  {/* Score pill */}
                  <div className="text-left lg:text-right">
                    <div className="text-[10px] uppercase font-bold text-[#FF4E00] tracking-widest">
                      Engine Priority Score
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-[#121212]">
                      {rec.priority_score.toFixed(1)}
                      <span className="text-xs text-[#121212]/40 font-normal"> / 100</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* View Evidence Button */}
                    <button
                      id={`btn-evidence-${rec.id}`}
                      onClick={() => onViewEvidence(rec)}
                      className="border border-[#121212] text-[#121212] font-bold py-2 px-3.5 uppercase text-xs tracking-wider hover:bg-[#121212] hover:text-[#F9F9F7] transition-colors flex items-center gap-1.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                      View Evidence
                    </button>

                    {/* Approve Button */}
                    <button
                      id={`btn-approve-${rec.id}`}
                      onClick={() => onApprove(rec)}
                      disabled={!isManager || isApproved}
                      title={!isManager ? 'Engineering Manager role required to approve' : 'Approve this recommendation'}
                      className={`font-black py-2 px-5 uppercase text-xs tracking-widest transition-colors flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 cursor-default'
                          : isManager
                          ? 'bg-[#FF4E00] text-white border-2 border-[#FF4E00] hover:bg-[#121212] hover:border-[#121212]'
                          : 'bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {isApproved ? 'Approved' : 'Approve'}
                    </button>

                    {/* Override Button */}
                    <button
                      id={`btn-override-${rec.id}`}
                      onClick={() => onOverride(rec)}
                      disabled={!isManager}
                      title={!isManager ? 'Engineering Manager role required to override' : 'Override this recommendation with mandatory reason'}
                      className={`font-black py-2 px-4 uppercase text-xs tracking-widest transition-colors flex items-center gap-1.5 ${
                        isManager
                          ? 'border-2 border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-[#F9F9F7]'
                          : 'border-2 border-slate-300 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      Override
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
