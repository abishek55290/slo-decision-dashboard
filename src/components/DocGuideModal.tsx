import React, { useState } from 'react';
import { X, BookOpen, Layers, CheckCircle2, ChevronRight, Terminal, Shield, Award } from 'lucide-react';

interface DocGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocGuideModal: React.FC<DocGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'demo-guide'>('demo-guide');

  if (!isOpen) return null;

  return (
    <div
      id="doc-guide-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/80 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="doc-guide-modal-card"
        className="bg-[#F9F9F7] border-2 border-[#121212] max-w-4xl w-full overflow-hidden my-6 max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#121212] text-[#F9F9F7] px-6 py-4 flex items-center justify-between border-b-2 border-[#121212] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF4E00] flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold italic serif">
                Architecture & 18-Step Live Demonstration Guide
              </h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#F9F9F7]/70">
                17-Part Engineering Specification & Judge Walkthrough Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#F9F9F7]/70 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="bg-white border-b border-[#121212] px-6 py-2 flex gap-6 text-xs font-bold uppercase tracking-wider shrink-0">
          <button
            onClick={() => setActiveSection('demo-guide')}
            className={`pb-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeSection === 'demo-guide'
                ? 'border-[#FF4E00] text-[#121212] font-black'
                : 'border-transparent text-[#121212]/50 hover:text-[#121212]'
            }`}
          >
            <Award className="w-4 h-4 text-[#FF4E00]" />
            18-Step Hackathon Demonstration Script
          </button>
          <button
            onClick={() => setActiveSection('architecture')}
            className={`pb-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeSection === 'architecture'
                ? 'border-[#FF4E00] text-[#121212] font-black'
                : 'border-transparent text-[#121212]/50 hover:text-[#121212]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#FF4E00]" />
            17-Part Architecture & System Specification
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#121212] leading-relaxed">
          {activeSection === 'demo-guide' ? (
            <div className="space-y-4">
              <div className="bg-white border border-[#121212] p-4">
                <h4 className="font-bold text-[#121212] text-sm mb-1 italic serif">
                  18-Step Field-Ready Evaluation Script for Hackathon Judges
                </h4>
                <p className="text-xs text-[#121212]/70">
                  Execute these precise operational steps to test the explainable decision engine, role-based governance, and dynamic threshold calibrations.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { step: 1, title: 'Open Dashboard & Review Synthetic Data Banner', desc: 'Observe the top banner clearly stating Demo Environment with synthetic learning platform data.' },
                  { step: 2, title: 'Examine KPI Cards', desc: 'Verify 5 services, 2 SLO breaches (Exam Submission & Login), and 4,500+ students affected.' },
                  { step: 3, title: 'Inspect SLO Health Matrix', desc: 'Observe color badges: Exam Submission is RED (100% budget consumed), Video Streaming is GREEN.' },
                  { step: 4, title: 'Review Top Recommendation (#1)', desc: 'Notice Exam Submission Task 1 is ranked #1 with an explainable natural language justification.' },
                  { step: 5, title: 'Click "View Evidence" on Top Task', desc: 'Examine the 7 explicit explainability answers and exact point contribution breakdown (e.g. 28/30 User Impact).' },
                  { step: 6, title: 'Attempt Approval as Engineer', desc: 'Switch user to Marcus Chen (Engineer). Notice Approve/Override buttons are disabled with RBAC message.' },
                  { step: 7, title: 'Switch to Engineering Manager (Elena Rostova)', desc: 'Role switcher activates green indicator; Approve and Override buttons become interactive.' },
                  { step: 8, title: 'Approve Recommendation #1', desc: 'Click [Approve]. Notice status instantly transitions to APPROVED and stores the manager audit record.' },
                  { step: 9, title: 'Navigate to Decisions & History Tab', desc: 'Verify the newly approved decision is recorded with Elena Rostova and an exact timestamp.' },
                  { step: 10, title: 'Return to Dashboard & Test Override', desc: 'Click [Override] on Recommendation #2 (Database connection pooling).' },
                  { step: 11, title: 'Verify Mandatory Justification Validation', desc: 'Attempt to submit an empty reason; observe strict rejection requiring substantive operational justification.' },
                  { step: 12, title: 'Submit Valid Override Justification', desc: 'Select preset or type: "Temporary proxy rate-limit deployed; schema fix deferred to post-finals window."' },
                  { step: 13, title: 'Verify Overridden State in UI', desc: 'The recommendation updates with an OVERRIDDEN pill and displays the manager rationale inline.' },
                  { step: 14, title: 'Navigate to Configurable Rules Tab', desc: 'Inspect the 5 rule weights. Adjust User Impact from 30% to 50% or click "Auto-Normalize".' },
                  { step: 15, title: 'Save Rules & Observe Live Re-ranking', desc: 'Click Save; return to Dashboard and observe rankings automatically adjust without modifying code.' },
                  { step: 16, title: 'Toggle Examination Mode to OFF-PEAK', desc: 'Click Examination Mode in header. Observe immediate reduction in score surge across all tier-1 services.' },
                  { step: 17, title: 'Review Evaluation Metrics Tab', desc: 'Verify formal metric: 100% of priorities justified by measured impact vs 42% industry baseline (+58% gain).' },
                  { step: 18, title: 'Run Automated Test Suite', desc: 'Navigate to Automated Test Suite and click Re-Run. Confirm all 8 normal and adversarial tests pass green.' }
                ].map((item) => (
                  <div key={item.step} className="p-3.5 bg-white border border-[#121212]/20 flex items-start gap-3 hover:border-[#121212] transition-colors">
                    <span className="w-6 h-6 bg-[#121212] text-[#F9F9F7] font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                      {item.step}
                    </span>
                    <div>
                      <div className="font-bold text-[#121212] text-xs uppercase tracking-wider">{item.title}</div>
                      <div className="text-xs text-[#121212]/70 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#121212]">
                <h4 className="font-bold text-[#121212] text-sm mb-1 italic serif">17-Part Architecture Reference</h4>
                <p className="text-xs text-[#121212]/70">Comprehensive design specification conforming to production SRE standards.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white border border-[#121212]/20">
                  <h5 className="font-bold text-[#121212] uppercase tracking-wider text-xs">1. Problem Statement</h5>
                  <p className="text-xs text-[#121212]/70 mt-1 leading-relaxed">Educational examination platforms face catastrophic concurrent traffic spikes during finals. SLOs exist in monitoring tools (Datadog, Grafana) but lack algorithmic connection to engineering sprint backlogs.</p>
                </div>
                <div className="p-4 bg-white border border-[#121212]/20">
                  <h5 className="font-bold text-[#121212] uppercase tracking-wider text-xs">2. Target Users & Personas</h5>
                  <p className="text-xs text-[#121212]/70 mt-1 leading-relaxed">Engineering Managers (decide sprint resource allocation) and Site Reliability Engineers (execute stabilization tasks).</p>
                </div>
                <div className="p-4 bg-white border border-[#121212]/20">
                  <h5 className="font-bold text-[#121212] uppercase tracking-wider text-xs">3. Core Metrics</h5>
                  <p className="text-xs text-[#121212]/70 mt-1 leading-relaxed">SLI = Successful HTTP Requests / Total Requests (%). SLO Target = 99.99% for Tier 1, 99.5% for Tier 2. Error Budget = 100% - SLO Target.</p>
                </div>
                <div className="p-4 bg-white border border-[#121212]/20">
                  <h5 className="font-bold text-[#121212] uppercase tracking-wider text-xs">4. Decision Engine Algorithm</h5>
                  <p className="text-xs text-[#121212]/70 mt-1 leading-relaxed">Normalized weighted composite: Priority Score = (w_ui * UI + w_slo * SLO + w_eb * EB + w_inc * INC + w_exam * EXAM) / TotalWeights. Clamped strictly between 0 and 100.</p>
                </div>
                <div className="p-4 bg-white border border-[#121212]/20">
                  <h5 className="font-bold text-[#121212] uppercase tracking-wider text-xs">5. Explainability Mandate</h5>
                  <p className="text-xs text-[#121212]/70 mt-1 leading-relaxed">No black-box recommendations. Every suggestion answers: What, Why, Who, Which SLO, Error Budget Burn, Incident Count, and exact point contribution.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-[#121212] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-[#121212] bg-[#121212] text-[#F9F9F7] hover:bg-[#FF4E00] hover:border-[#FF4E00] text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
