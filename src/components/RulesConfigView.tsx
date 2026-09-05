import React, { useState } from 'react';
import { ConfigurableRule, User } from '../types';
import { Sliders, Save, RefreshCw, Lock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface RulesConfigViewProps {
  rules: ConfigurableRule[];
  currentUser: User;
  onSaveRules: (updatedRules: ConfigurableRule[]) => Promise<void>;
  onResetDefaults: () => void;
}

export const RulesConfigView: React.FC<RulesConfigViewProps> = ({
  rules,
  currentUser,
  onSaveRules,
  onResetDefaults
}) => {
  const [localRules, setLocalRules] = useState<ConfigurableRule[]>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isManager = currentUser.role === 'ENGINEERING_MANAGER';

  // Calculate sum of active weights
  const activeWeightSum = localRules
    .filter(r => r.enabled)
    .reduce((sum, r) => sum + Number(r.weight), 0);

  const handleWeightChange = (id: string, newWeight: number) => {
    setLocalRules(prev =>
      prev.map(r => (r.id === id ? { ...r, weight: Math.max(0, newWeight) } : r))
    );
    setFeedback(null);
  };

  const handleThresholdChange = (id: string, newThreshold: number) => {
    setLocalRules(prev =>
      prev.map(r => (r.id === id ? { ...r, threshold: Math.max(0, newThreshold) } : r))
    );
    setFeedback(null);
  };

  const handleToggleEnabled = (id: string) => {
    setLocalRules(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    setFeedback(null);
  };

  const handleNormalizeWeights = () => {
    const enabledRules = localRules.filter(r => r.enabled);
    if (enabledRules.length === 0) return;
    const currentSum = enabledRules.reduce((sum, r) => sum + r.weight, 0);
    if (currentSum <= 0) return;

    setLocalRules(prev =>
      prev.map(r => {
        if (!r.enabled) return r;
        const normalized = Number(((r.weight / currentSum) * 100.0).toFixed(1));
        return { ...r, weight: normalized };
      })
    );
    setFeedback({
      type: 'success',
      message: 'Active weights have been proportionately normalized to sum exactly to 100%.'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSaveRules(localRules);
      setFeedback({
        type: 'success',
        message: 'Configurable rules updated successfully! Priority rankings have recomputed in real time.'
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save rules to backend.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="rules-config-page" className="max-w-5xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="border border-[#121212] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#121212] pb-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] italic text-[#121212]/70 block mb-1">
              Configuration Matrix
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold italic serif text-[#121212]">
              Decision Engine Rule Weights
            </h2>
            <p className="text-xs text-[#121212]/70 mt-1 font-medium max-w-xl">
              Calibrate multi-factor scoring weights, sensitivity ceilings, and telemetry thresholds for automatic priority ranking.
            </p>
          </div>

          {!isManager ? (
            <div className="flex items-center gap-1.5 text-xs text-[#121212] bg-[#F9F9F7] border border-[#121212] px-3.5 py-1.5 font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span>Read-Only: Manager Role Required</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNormalizeWeights}
                className="px-3.5 py-2 border border-[#121212] bg-white text-xs font-black uppercase tracking-wider text-[#121212] hover:bg-[#121212] hover:text-[#F9F9F7] transition-colors"
              >
                Auto-Normalize to 100%
              </button>
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-3.5 py-2 border border-[#121212]/30 bg-[#F9F9F7] text-xs font-bold uppercase tracking-wider text-[#121212] hover:border-[#121212] transition-colors"
              >
                Reset Defaults
              </button>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {feedback && (
          <div
            className={`mt-4 p-3 text-xs border font-medium flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                : 'bg-rose-50 border-rose-400 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Weight Total Health Card */}
        <div className="mt-6 p-4 bg-[#F9F9F7] border border-[#121212] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-[#FF4E00]" />
            <span className="text-[#121212] font-medium">
              Active Cumulative Weight: <strong className="text-[#121212] font-mono text-base font-black">{activeWeightSum.toFixed(1)}%</strong>
            </span>
          </div>
          <span
            className={`text-xs px-3 py-1 font-mono uppercase font-black tracking-wider ${
              Math.abs(activeWeightSum - 100.0) < 0.2
                ? 'bg-[#121212] text-[#F9F9F7]'
                : 'bg-[#FF4E00] text-white'
            }`}
          >
            {Math.abs(activeWeightSum - 100.0) < 0.2 ? 'Balanced (100.0%)' : 'Auto-Normalized by Engine'}
          </span>
        </div>
      </div>

      {/* Rules Table Form */}
      <form onSubmit={handleSubmit} className="border border-[#121212] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9F9F7] border-b border-[#121212] text-[10px] uppercase font-bold tracking-widest text-[#121212]">
                <th className="py-3 px-4 w-16 text-center">Active</th>
                <th className="py-3 px-4">Evaluation Rule & Operational Target</th>
                <th className="py-3 px-4 w-44">Weight (%)</th>
                <th className="py-3 px-4 w-36">Threshold Target</th>
                <th className="py-3 px-4 text-right w-28">Net Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121212]/15 font-mono">
              {localRules.map((rule) => {
                const disabled = !rule.enabled || !isManager;
                const weightShare = activeWeightSum > 0 ? (rule.weight / activeWeightSum) * 100 : 0;

                return (
                  <tr key={rule.id} className={!rule.enabled ? 'opacity-40 bg-[#F9F9F7]' : 'hover:bg-[#F9F9F7]/50'}>
                    {/* Toggle */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        disabled={!isManager}
                        onChange={() => handleToggleEnabled(rule.id)}
                        className="w-4 h-4 accent-[#121212] cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Rule Info */}
                    <td className="py-4 px-4 font-sans">
                      <div className="font-bold text-[#121212] text-sm italic serif">{rule.rule_name}</div>
                      <div className="text-xs text-[#121212]/70 mt-0.5 max-w-md leading-relaxed">{rule.description}</div>
                    </td>

                    {/* Weight Slider & Input */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={rule.weight}
                          disabled={disabled}
                          onChange={(e) => handleWeightChange(rule.id, parseFloat(e.target.value))}
                          className="w-24 accent-[#121212] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={rule.weight}
                          disabled={disabled}
                          onChange={(e) => handleWeightChange(rule.id, parseFloat(e.target.value) || 0)}
                          className="w-14 p-1 text-center font-mono font-bold text-[#121212] border border-[#121212] bg-white focus:outline-none"
                        />
                        <span className="text-[#121212]/70 font-sans">%</span>
                      </div>
                    </td>

                    {/* Threshold Input */}
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step={0.1}
                        value={rule.threshold}
                        disabled={disabled}
                        onChange={(e) => handleThresholdChange(rule.id, parseFloat(e.target.value) || 0)}
                        className="w-24 p-1 text-center font-mono text-[#121212] border border-[#121212] bg-white focus:outline-none"
                      />
                    </td>

                    {/* Effective Share */}
                    <td className="py-4 px-4 text-right font-mono font-black text-[#121212]">
                      {rule.enabled ? `${weightShare.toFixed(1)}%` : '0%'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#F9F9F7] border-t border-[#121212] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#121212]/70 max-w-md">
            Changes persist to PostgreSQL and trigger automated re-scoring of all candidate reliability tickets.
          </p>
          <button
            type="submit"
            disabled={!isManager || isSaving}
            className={`px-6 py-2.5 border-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              isManager && !isSaving
                ? 'bg-[#FF4E00] border-[#FF4E00] text-white hover:bg-[#121212] hover:border-[#121212]'
                : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Persisting...' : 'Save & Re-rank Priorities'}
          </button>
        </div>
      </form>
    </div>
  );
};
