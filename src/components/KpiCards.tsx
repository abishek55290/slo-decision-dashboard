import React from 'react';
import { Server, AlertOctagon, Flame, AlertCircle, Users, CheckSquare } from 'lucide-react';
import { ServiceSLOSummary, Incident, ReliabilityTask } from '../types';

interface KpiCardsProps {
  slos: ServiceSLOSummary[];
  incidents: Incident[];
  tasks: ReliabilityTask[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ slos, incidents, tasks }) => {
  const totalServices = slos.length;
  const sloBreaches = slos.filter(s => s.is_breached).length;
  const errorBudgetAtRisk = slos.filter(s => s.error_budget_status === 'RED' || s.error_budget_status === 'YELLOW').length;
  
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const criticalIncidents = activeIncidents.filter(i => i.severity === 'CRITICAL').length;
  const totalUsersAffected = activeIncidents.reduce((acc, i) => acc + (i.users_affected || 0), 0);

  const pendingTasks = tasks.filter(t => t.status !== 'DONE').length;
  const criticalTasks = tasks.filter(t => t.priority === 'CRITICAL').length;

  return (
    <section id="kpi-cards-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border border-[#121212] bg-[#F9F9F7] mb-8">
      {/* 1. Total Services */}
      <div id="kpi-card-services" className="p-4 sm:p-5 border-r border-b lg:border-b-0 border-[#121212] flex flex-col justify-between hover:bg-white transition-colors">
        <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
          01. Service Integrity
        </span>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[#121212]">
              {totalServices < 10 ? `0${totalServices}` : totalServices}
            </span>
            <span className="text-xs ml-2 opacity-60 uppercase font-medium">Services</span>
          </div>
          <p className="text-[10px] text-[#121212]/60 mt-1 uppercase tracking-wider font-semibold">
            Active Microservices
          </p>
        </div>
      </div>

      {/* 2. SLO Breaches (Editorial Vermilion Highlight Card) */}
      <div
        id="kpi-card-breaches"
        className={`p-4 sm:p-5 border-r border-b lg:border-b-0 border-[#121212] flex flex-col justify-between transition-colors ${
          sloBreaches > 0
            ? 'bg-[#FF4E00] text-white'
            : 'bg-white text-[#121212]'
        }`}
      >
        <span className={`text-[10px] uppercase font-bold tracking-widest italic ${sloBreaches > 0 ? 'text-white' : 'text-[#121212]/70'}`}>
          02. SLO Breaches
        </span>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-bold font-mono">
              {sloBreaches < 10 ? `0${sloBreaches}` : sloBreaches}
            </span>
            <span className="text-xs ml-2 uppercase font-black tracking-wide">
              {sloBreaches > 0 ? 'Critical' : 'Nominal'}
            </span>
          </div>
          <p className={`text-[10px] mt-1 uppercase tracking-wider font-bold ${sloBreaches > 0 ? 'text-white/90' : 'text-emerald-700'}`}>
            {sloBreaches > 0 ? 'Exam Submission Alert' : 'Compliant'}
          </p>
        </div>
      </div>

      {/* 3. Error Budget at Risk */}
      <div id="kpi-card-error-budget" className="p-4 sm:p-5 border-r border-b lg:border-b-0 border-[#121212] flex flex-col justify-between hover:bg-white transition-colors">
        <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
          03. Budget Risk
        </span>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[#121212]">
              {errorBudgetAtRisk < 10 ? `0${errorBudgetAtRisk}` : errorBudgetAtRisk}
            </span>
            <span className="text-xs ml-2 opacity-60 uppercase font-medium">Exhausted</span>
          </div>
          <p className="text-[10px] text-[#FF4E00] mt-1 font-bold uppercase tracking-wider">
            {slos.filter(s => s.error_budget_status === 'RED').length} Depleted to 0%
          </p>
        </div>
      </div>

      {/* 4. Active Incidents */}
      <div id="kpi-card-incidents" className="p-4 sm:p-5 border-r border-b md:border-b-0 border-[#121212] flex flex-col justify-between hover:bg-white transition-colors">
        <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
          04. Active Incidents
        </span>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[#121212]">
              {activeIncidents.length < 10 ? `0${activeIncidents.length}` : activeIncidents.length}
            </span>
            <span className="text-xs ml-2 opacity-60 uppercase font-medium">Tickets</span>
          </div>
          <p className="text-[10px] text-[#121212]/70 mt-1 uppercase tracking-wider font-semibold">
            {criticalIncidents} Critical Severity
          </p>
        </div>
      </div>

      {/* 5. Users Affected */}
      <div id="kpi-card-users" className="p-4 sm:p-5 border-r border-[#121212] flex flex-col justify-between hover:bg-white transition-colors">
        <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
          05. Impacted Users
        </span>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-black italic serif text-[#121212]">
              {totalUsersAffected.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-[#121212]/60 mt-1 uppercase tracking-wider font-medium">
            Active Exam Takers
          </p>
        </div>
      </div>

      {/* 6. Reliability Tasks */}
      <div id="kpi-card-tasks" className="p-4 sm:p-5 flex flex-col justify-between hover:bg-white transition-colors">
        <span className="text-[10px] uppercase font-bold tracking-widest italic text-[#121212]/70">
          06. Reliability Tasks
        </span>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[#121212]">
              {pendingTasks < 10 ? `0${pendingTasks}` : pendingTasks}
            </span>
            <span className="text-xs ml-2 opacity-60 uppercase font-medium">Queued</span>
          </div>
          <p className="text-[10px] text-[#121212]/70 mt-1 uppercase tracking-wider font-semibold">
            {criticalTasks} Critical Priority
          </p>
        </div>
      </div>
    </section>
  );
};
