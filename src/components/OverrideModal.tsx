import React, { useState } from 'react';
import { Recommendation, User } from '../types';
import { X, CornerUpLeft, AlertCircle, Sparkles } from 'lucide-react';

interface OverrideModalProps {
  recommendation: Recommendation | null;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmitOverride: (recId: string, reason: string) => void;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  recommendation,
  currentUser,
  isOpen,
  onClose,
  onSubmitOverride
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !recommendation) return null;

  const presetReasons = [
    'Temporary proxy load-shedding rule deployed at edge gateway; deep database partition migration deferred to scheduled maintenance window post-finals.',
    'Workaround deployed via Redis session replica surge; full code patch scheduled after Friday 17:00 PM examination cutoff.',
    'Underlying cloud provider zone network degradation identified; mitigating via multi-region failover rather than service codebase alteration.',
    'Alternative mitigation already active in upstream proctoring microservice.'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A substantive operational override reason is mandatory. The decision cannot be overridden without justification.');
      return;
    }
    if (reason.trim().length < 15) {
      setError('Please provide at least 15 characters explaining the architectural or operational justification.');
      return;
    }
    setError(null);
    onSubmitOverride(recommendation.id, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div
      id="override-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/80 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="override-modal-card"
        className="bg-[#F9F9F7] border-2 border-[#121212] max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#121212] text-[#F9F9F7] px-6 py-4 flex items-center justify-between border-b-2 border-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF4E00] flex items-center justify-center text-white">
              <CornerUpLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold italic serif">
                Engineering Manager Override
              </h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#F9F9F7]/70">
                Authorizer: {currentUser.name} • {currentUser.title || 'Engineering Manager'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-override-modal"
            onClick={onClose}
            className="text-[#F9F9F7]/70 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-white border border-[#121212] p-4 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#121212]/60 block mb-1">
              Target Remediation Under Override:
            </span>
            <div className="font-bold text-lg italic serif text-[#121212]">{recommendation.task_name}</div>
            <div className="text-[#121212]/70 mt-1 font-mono text-[11px]">
              Service: <strong className="text-[#121212]">{recommendation.service_name}</strong> | Calculated Score: <strong className="text-[#FF4E00]">{recommendation.priority_score.toFixed(1)} / 100</strong>
            </div>
          </div>

          <div>
            <label htmlFor="override-reason-input" className="block text-xs font-black uppercase tracking-wider text-[#121212] mb-1">
              Mandatory Operational Justification <span className="text-[#FF4E00]">*</span>
            </label>
            <p className="text-xs text-[#121212]/70 mb-2">
              State the empirical or architectural reason standard recommendation order is being superseded for the permanent audit trail.
            </p>
            <textarea
              id="override-reason-input"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Temporary edge proxy load-shedding deployed; deferring database migration until post-finals."
              className="w-full text-xs p-3 border-2 border-[#121212] bg-white focus:outline-none placeholder:text-[#121212]/40 font-mono"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-[#FF4E00] mt-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick preset reasons */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#121212]/60 block mb-2">
              Standard Operational Justifications (Select to apply):
            </span>
            <div className="space-y-2">
              {presetReasons.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setError(null);
                  }}
                  className="w-full text-left text-xs p-3 border border-[#121212]/20 bg-white hover:border-[#121212] hover:bg-[#F9F9F7] text-[#121212] transition-colors italic"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#121212] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#121212] font-bold text-xs uppercase tracking-wider text-[#121212] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-override"
              type="submit"
              className="px-6 py-2 border-2 border-[#FF4E00] bg-[#FF4E00] text-white font-black text-xs uppercase tracking-widest hover:bg-[#121212] hover:border-[#121212] transition-colors flex items-center gap-1.5"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
              Confirm & Commit Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
