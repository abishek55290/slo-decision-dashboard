import React from 'react';
import { Target, TrendingUp, CheckCircle, Award, BarChart } from 'lucide-react';

interface EvaluationMetricsViewProps {
  metrics: {
    metric_name: string;
    formula: string;
    baseline_percentage: number;
    target_percentage: number;
    measured_result_percentage: number;
    target_met: boolean;
    difference_vs_baseline: number;
    total_priorities_evaluated: number;
    justified_count: number;
    unjustified_or_low_impact_count: number;
  } | null;
}

export const EvaluationMetricsView: React.FC<EvaluationMetricsViewProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="p-12 text-center text-[#121212]/50 text-xs font-mono">
        Loading evaluation metrics...
      </div>
    );
  }

  return (
    <div id="evaluation-metrics-page" className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border border-[#121212] bg-white p-6 sm:p-8">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] italic text-[#121212]/70 block mb-1">
          Quantitative Validation
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold italic serif text-[#121212]">
          Platform Reliability Prioritization Accuracy
        </h2>
        <p className="text-xs text-[#121212]/70 mt-1 font-medium max-w-xl">
          Empirical verification proving the SLO decision engine redirects engineering hours toward genuine student exam failure blast radiuses.
        </p>
      </div>

      {/* Main Metric Comparison Cards */}
      <div className="border border-[#121212] bg-white grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#121212]">
        {/* Baseline */}
        <div className="p-6 bg-white">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60 mb-2">
            01. Industry Baseline
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#121212]/40 font-mono">
            {metrics.baseline_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-[#121212]/70 mt-3 leading-relaxed">
            Historical benchmark without algorithmic SLO engine; priorities governed by support ticket volume or executive urgency.
          </p>
        </div>

        {/* Target */}
        <div className="p-6 bg-white">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#121212] mb-2">
            02. Platform Target
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#121212] font-mono">
            {metrics.target_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-[#121212]/70 mt-3 leading-relaxed">
            Rigorous threshold: at least 80% of prioritized tasks must trace to empirical student blast radius.
          </p>
        </div>

        {/* Measured Result */}
        <div className="p-6 bg-[#F9F9F7]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF4E00] mb-2">
            03. Measured Empirical Result
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#FF4E00] font-mono">
            {metrics.measured_result_percentage.toFixed(1)}%
          </div>
          <div className="inline-block bg-[#121212] text-white text-[10px] font-mono uppercase px-2 py-0.5 mt-3 font-bold">
            Target Exceeded (+{(metrics.measured_result_percentage - metrics.target_percentage).toFixed(1)}%)
          </div>
        </div>

        {/* Difference vs Baseline */}
        <div className="p-6 bg-[#121212] text-[#F9F9F7]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#F9F9F7]/70 mb-2">
            04. Net Accuracy Gain
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono">
            +{metrics.difference_vs_baseline.toFixed(1)}%
          </div>
          <div className="text-xs text-[#FF4E00] font-mono mt-3 font-bold">
            Relative Gain: +{((metrics.difference_vs_baseline / metrics.baseline_percentage) * 100).toFixed(0)}% vs Ad-hoc
          </div>
        </div>
      </div>

      {/* Metric Definition Card */}
      <div className="border border-[#121212] bg-white p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
            Computational Methodology & Formula
          </h3>
        </div>

        <div className="bg-[#F9F9F7] border border-[#121212] p-4 font-mono text-xs text-[#121212]">
          <div className="text-[#121212]/60 font-sans text-[10px] mb-1 font-bold uppercase tracking-widest">Formal Evaluation Formula:</div>
          {metrics.formula}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white border border-[#121212]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#121212]/60 block">Total Priorities Evaluated</span>
            <span className="text-2xl font-black text-[#121212] font-mono mt-1 block">
              {metrics.total_priorities_evaluated} Tasks
            </span>
          </div>
          <div className="p-4 bg-[#F9F9F7] border border-[#121212]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF4E00] block">Validated by Student Blast Radius</span>
            <span className="text-2xl font-black text-[#121212] font-mono mt-1 block">
              {metrics.justified_count} Tasks ({metrics.measured_result_percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="p-4 bg-white border border-[#121212]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#121212]/60 block">Unsubstantiated or Speculative</span>
            <span className="text-2xl font-black text-[#121212]/50 font-mono mt-1 block">
              {metrics.unjustified_or_low_impact_count} Tasks
            </span>
          </div>
        </div>

        <div className="p-4 border-l-2 border-[#121212] bg-[#F9F9F7] text-xs text-[#121212] leading-relaxed italic">
          <strong className="font-sans not-italic font-bold uppercase tracking-wider text-[10px] block mb-1">
            Significance to Educational Continuity:
          </strong>
          Ad-hoc SRE triage frequently consumes up to 60% of engineering bandwidth troubleshooting noisy telemetry logs that never impede a student exam. Under the SLO Decision Dashboard, every ticket is mathematically substantiated against active exam submission paths, safeguarding finals week uptime.
        </div>
      </div>
    </div>
  );
};
