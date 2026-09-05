import React from 'react';
import { ErrorAnalysisItem } from '../types';
import { ShieldAlert, AlertTriangle, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ErrorAnalysisViewProps {
  items: ErrorAnalysisItem[];
}

export const ErrorAnalysisView: React.FC<ErrorAnalysisViewProps> = ({ items }) => {
  return (
    <div id="error-analysis-page" className="max-w-5xl mx-auto space-y-8">
      <div className="border border-[#121212] bg-white p-6 sm:p-8">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] italic text-[#121212]/70 block mb-1">
          Defensive Reliability Architecture
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold italic serif text-[#121212]">
          Error Analysis & Decision Risk Mitigations
        </h2>
        <p className="text-xs text-[#121212]/70 mt-1 font-medium max-w-xl">
          Empirical catalog of algorithmic blind spots, over-prioritization risks, and compensating engineering safeguards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {items.map((item) => {
          return (
            <div key={item.id} className="border border-[#121212] bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#121212] pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#121212] text-[#F9F9F7]">
                    {item.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold italic serif text-[#121212]">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-1">
                <div className="bg-[#F9F9F7] p-4 border border-[#121212]/20">
                  <strong className="text-[10px] uppercase font-bold tracking-wider text-[#121212]/60 block mb-1">
                    Observed Operational Symptom:
                  </strong>
                  <p className="text-[#121212] leading-relaxed mb-3">{item.observed_behavior}</p>
                  
                  <strong className="text-[10px] uppercase font-bold tracking-wider text-[#FF4E00] block mb-1">
                    Root Failure Mechanism:
                  </strong>
                  <p className="text-[#121212] leading-relaxed">{item.root_cause}</p>
                </div>

                <div className="bg-white p-4 border border-[#121212] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#121212] font-black uppercase tracking-wider text-[10px] mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#FF4E00]" />
                      Compensating Engine Mitigation:
                    </div>
                    <p className="text-[#121212] leading-relaxed">{item.mitigation}</p>
                  </div>
                  
                  <div className="mt-4 text-[11px] bg-[#F9F9F7] p-3 border-l-2 border-[#FF4E00] text-[#121212] font-mono">
                    <strong className="font-sans font-bold uppercase tracking-wider text-[10px] block text-[#FF4E00] mb-0.5">Automated Guardrail:</strong>
                    {item.system_guard}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
