import React from 'react';
import { DecisionRecord } from '../types';
import { History, CheckCircle, CornerUpLeft, Clock, User, FileText } from 'lucide-react';

interface DecisionsViewProps {
  decisions: DecisionRecord[];
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({ decisions }) => {
  return (
    <div id="decisions-audit-page" className="max-w-5xl mx-auto space-y-8">
      <div className="border border-[#121212] bg-white p-6 sm:p-8">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] italic text-[#121212]/70 block mb-1">
          Governance & Compliance Ledger
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold italic serif text-[#121212]">
          Decision & Override Audit Trail
        </h2>
        <p className="text-xs text-[#121212]/70 mt-1 font-medium max-w-xl">
          Immutable historical chronicle of engineering manager approvals and documented overrides.
        </p>
      </div>

      <div className="border border-[#121212] bg-white overflow-hidden">
        {decisions.length === 0 ? (
          <div className="p-16 text-center text-[#121212]/50 text-xs font-mono">
            <History className="w-8 h-8 text-[#121212]/30 mx-auto mb-3" />
            No governance decisions recorded yet. Switch to Engineering Manager on the Dashboard to approve or override recommendations.
          </div>
        ) : (
          <div className="divide-y divide-[#121212]/15 font-mono">
            {decisions.slice().reverse().map((dec) => {
              const isApproved = dec.decision === 'APPROVED';
              return (
                <div key={dec.id} className="p-6 hover:bg-[#F9F9F7]/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                          isApproved
                            ? 'bg-[#121212] text-[#F9F9F7]'
                            : 'bg-[#FF4E00] text-white'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        )}
                        {dec.decision}
                      </span>
                      <span className="text-xs font-sans text-[#121212]">
                        Target Ticket Ref: <code className="bg-[#F9F9F7] border border-[#121212]/20 px-1.5 py-0.5 text-xs font-mono text-[#121212] font-bold">{dec.recommendation_id}</code>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#121212]/70 font-sans">
                      <span className="flex items-center gap-1.5 font-bold text-[#121212]">
                        <User className="w-3.5 h-3.5 text-[#FF4E00]" />
                        {dec.user_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#121212]/50" />
                        {new Date(dec.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {dec.override_reason ? (
                    <div className="mt-3 bg-[#F9F9F7] border border-[#121212] p-4 text-xs text-[#121212] font-sans">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#FF4E00] mb-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Documented Manager Override Justification:
                      </div>
                      <p className="leading-relaxed pl-5 italic text-sm serif text-[#121212]">
                        "{dec.override_reason}"
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-[#121212]/70 font-sans italic pl-1">
                      Algorithmic prioritization confirmed and formally committed to examination readiness sprint.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
