import React from 'react';
import { FeaturePlan, ReliabilityTask } from '../types';
import { Layers, ShieldCheck, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface ReliabilityVsFeaturesProps {
  features: FeaturePlan[];
  tasks: ReliabilityTask[];
}

export const ReliabilityVsFeatures: React.FC<ReliabilityVsFeaturesProps> = ({ features, tasks }) => {
  const criticalReliability = tasks.filter(t => t.priority === 'CRITICAL').length;
  const inProgressReliability = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoReliability = tasks.filter(t => t.status === 'TODO').length;

  const criticalFeatures = features.filter(f => f.business_priority === 'CRITICAL').length;
  const inProgressFeatures = features.filter(f => f.status === 'IN_PROGRESS').length;
  const backlogFeatures = features.filter(f => f.status === 'BACKLOG').length;

  return (
    <div id="reliability-vs-features-section" className="border border-[#121212] bg-[#F9F9F7] mb-8 overflow-hidden">
      <div className="px-6 py-5 border-b border-[#121212] bg-white flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
            Engineering Resource Allocation
          </h3>
          <p className="text-xs text-[#121212]/70 mt-1 font-medium">
            Balancing exam reliability defense against quarterly product roadmap velocity
          </p>
        </div>
        <div className="text-xs bg-[#121212] text-[#F9F9F7] px-3 py-1.5 font-mono uppercase font-bold tracking-widest">
          Active Policy: <span className="text-[#FF4E00]">Code Freeze On Non-Essential Features</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#121212]">
        {/* Reliability Side */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="flex items-center justify-between mb-4 border-b border-[#121212]/15 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
                01. Defensive Stream
              </span>
              <h4 className="text-xl font-bold italic serif text-[#121212] mt-0.5">
                Reliability Backlog
              </h4>
            </div>
            <span className="text-xs font-bold text-white bg-[#121212] px-2.5 py-1 uppercase tracking-wider">
              {tasks.length} Tasks Queued
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-3 border border-[#121212]/20 bg-[#F9F9F7]">
              <span className="text-[#121212] font-sans font-medium">Critical Exam-Blocker Tasks</span>
              <span className="font-bold text-[#FF4E00]">{criticalReliability} tasks</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-[#121212]/20 bg-[#F9F9F7]">
              <span className="text-[#121212] font-sans font-medium">Remediation in Progress</span>
              <span className="font-bold text-[#121212]">{inProgressReliability} tasks</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-[#121212]/20 bg-[#F9F9F7]">
              <span className="text-[#121212] font-sans font-medium">Pending Triage / Next Sprint</span>
              <span className="font-bold text-[#121212]">{todoReliability} tasks</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-[#121212] border-l-2 border-[#FF4E00] pl-3 py-1 bg-amber-50/50">
            <strong>SRE Policy Directive:</strong> Error budget for Exam Submission is 100% burned. SRE gates mandate pausing low-impact features to divert 2 senior engineers to Kafka async submission ledger partitioning.
          </div>
        </div>

        {/* Feature Side */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="flex items-center justify-between mb-4 border-b border-[#121212]/15 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
                02. Growth Stream
              </span>
              <h4 className="text-xl font-bold italic serif text-[#121212] mt-0.5">
                Product Feature Pipeline
              </h4>
            </div>
            <span className="text-xs font-bold text-[#121212] border border-[#121212] px-2.5 py-1 uppercase tracking-wider bg-[#F9F9F7]">
              {features.length} Planned Features
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-3 border border-[#121212]/20 bg-[#F9F9F7]">
              <span className="text-[#121212] font-sans font-medium">Critical Roadmap Features</span>
              <span className="font-bold text-[#121212]">{criticalFeatures} features</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-[#121212]/20 bg-[#F9F9F7]">
              <span className="text-[#121212] font-sans font-medium">Active Sprint Development</span>
              <span className="font-bold text-[#121212]">{inProgressFeatures} features</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-[#121212]/20 bg-[#F9F9F7]">
              <span className="text-[#121212] font-sans font-medium">Queued in Product Backlog</span>
              <span className="font-bold text-[#121212]">{backlogFeatures} features</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-[#121212] border-l-2 border-[#121212] pl-3 py-1 bg-[#F9F9F7]">
            <strong>Roadmap Gate Status:</strong> Feature releases to Exam Submission & Login clusters are temporarily gated until SLI recovers above 99.95% for 48 consecutive hours.
          </div>
        </div>
      </div>
    </div>
  );
};
