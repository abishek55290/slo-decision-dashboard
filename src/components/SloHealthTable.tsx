import React from 'react';
import { ServiceSLOSummary } from '../types';
import { AlertTriangle, CheckCircle, Flame, Activity } from 'lucide-react';

interface SloHealthTableProps {
  slos: ServiceSLOSummary[];
  onSelectService?: (serviceId: string) => void;
  selectedServiceId?: string | null;
}

export const SloHealthTable: React.FC<SloHealthTableProps> = ({
  slos,
  onSelectService,
  selectedServiceId
}) => {
  return (
    <div id="slo-health-section" className="border border-[#121212] bg-[#F9F9F7] mb-8 overflow-hidden">
      <div className="px-6 py-5 border-b border-[#121212] flex flex-wrap items-end justify-between gap-3 bg-white">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
            Service Level Health Dashboard
          </h2>
          <p className="text-xs text-[#121212]/70 mt-1 font-medium">
            Calculated from 120+ telemetry windows during active examination cycles
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Compliant (&lt;70%)
          </span>
          <span className="flex items-center gap-1.5 text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning (70–99%)
          </span>
          <span className="flex items-center gap-1.5 text-[#FF4E00]">
            <span className="w-2 h-2 rounded-full bg-[#FF4E00]" /> Critical (≥100% Depleted)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#121212] text-[10px] uppercase font-bold tracking-widest text-[#121212] bg-[#F9F9F7]">
              <th className="py-3 px-6">Service Entity</th>
              <th className="py-3 px-4">Tier</th>
              <th className="py-3 px-4 text-right">SLO Target</th>
              <th className="py-3 px-4 text-right">Current SLI</th>
              <th className="py-3 px-4">Budget Consumed</th>
              <th className="py-3 px-4 text-right">Remaining</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-6 text-right">Incidents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#121212]/15 bg-white">
            {slos.map((srv) => {
              const isSelected = selectedServiceId === srv.service_id;
              let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
              let statusText = 'Stable';
              let progressColor = 'bg-emerald-600';

              if (srv.error_budget_status === 'RED') {
                statusBadgeClass = 'bg-red-100 text-red-700 border border-red-300 font-black';
                statusText = 'Breach';
                progressColor = 'bg-[#FF4E00]';
              } else if (srv.error_budget_status === 'YELLOW') {
                statusBadgeClass = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
                statusText = 'Warning';
                progressColor = 'bg-amber-500';
              }

              return (
                <tr
                  key={srv.service_id}
                  id={`slo-row-${srv.service_id}`}
                  onClick={() => onSelectService && onSelectService(srv.service_id)}
                  className={`hover:bg-[#F9F9F7] cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-50/60' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="font-bold italic serif text-base text-[#121212]">{srv.service_name}</div>
                    <div className="text-[11px] text-[#121212]/60 line-clamp-1">{srv.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                      srv.tier === 'TIER_1'
                        ? 'bg-[#121212] text-white border-[#121212]'
                        : 'bg-[#F9F9F7] text-[#121212] border-[#121212]/30'
                    }`}>
                      {srv.tier === 'TIER_1' ? 'Tier 1' : 'Tier 2'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-medium text-[#121212]">
                    {srv.slo_target.toFixed(2)}%
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    <span className={`font-bold ${srv.is_breached ? 'text-red-600' : 'text-emerald-700'}`}>
                      {srv.current_sli.toFixed(3)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 w-52">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#121212]/10 h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${Math.min(srv.error_budget_used_pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#121212] whitespace-nowrap min-w-[3rem] text-right">
                        {srv.error_budget_used_pct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-medium text-[#121212]/70">
                    {srv.error_budget_remaining_pct}%
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusBadgeClass}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-[#121212]">
                    {srv.total_incidents}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
