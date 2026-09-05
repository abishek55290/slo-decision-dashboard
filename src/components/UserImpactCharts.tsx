import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { ServiceSLOSummary } from '../types';
import { Users, BarChart3, AlertOctagon } from 'lucide-react';

interface UserImpactChartsProps {
  slos: ServiceSLOSummary[];
}

export const UserImpactCharts: React.FC<UserImpactChartsProps> = ({ slos }) => {
  // Format data for chart
  const chartData = slos.map((s) => ({
    name: s.service_name.replace(' Service', '').replace(' & Edge Proxy', ''),
    fullName: s.service_name,
    usersAffected: s.users_affected,
    totalIncidents: s.total_incidents,
    sloTarget: s.slo_target,
    currentSli: s.current_sli,
    errorBudgetUsed: s.error_budget_used_pct,
    tier: s.tier,
    isBreached: s.is_breached
  }));

  return (
    <div id="user-impact-charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Chart 1: Users Affected & Incidents by Service */}
      <div className="border border-[#121212] bg-[#F9F9F7] p-6">
        <div className="flex items-center justify-between mb-4 border-b border-[#121212] pb-3 bg-white -mx-6 -mt-6 p-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
              Student Impact & Support Incidents
            </h3>
            <p className="text-xs text-[#121212]/70 mt-1 font-medium">
              Correlating exam interruption volume with customer escalation frequency
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF4E00] border border-[#FF4E00] px-2 py-0.5">
            Real-time Load
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E5E0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#121212', fontWeight: 600 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#121212' }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#121212' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121212',
                  borderColor: '#121212',
                  borderRadius: '0px',
                  color: '#F9F9F7',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'Students Affected') return [Number(val).toLocaleString(), name];
                  return [val, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              <Bar
                yAxisId="left"
                dataKey="usersAffected"
                name="Students Affected"
                fill="#121212"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.usersAffected > 2000 ? '#FF4E00' : '#121212'}
                  />
                ))}
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="totalIncidents"
                name="Incidents Logged"
                fill="#888888"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: SLO Compliance & Error Budget Consumption */}
      <div className="border border-[#121212] bg-[#F9F9F7] p-6">
        <div className="flex items-center justify-between mb-4 border-b border-[#121212] pb-3 bg-white -mx-6 -mt-6 p-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] italic border-b-2 border-[#121212] pb-1 inline-block">
              SLO Target vs Observed SLI Availability
            </h3>
            <p className="text-xs text-[#121212]/70 mt-1 font-medium">
              Empirical margin against contracted SLO availability guarantees
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212] border border-[#121212] px-2 py-0.5">
            Availability Ratio
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E5E0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#121212', fontWeight: 600 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                domain={[97, 100]}
                tick={{ fontSize: 11, fill: '#121212' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121212',
                  borderColor: '#121212',
                  borderRadius: '0px',
                  color: '#F9F9F7',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
                formatter={(val: any, name: any) => [`${val}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              <Bar
                dataKey="sloTarget"
                name="Contracted SLO Target"
                fill="#D4D4D0"
              />
              <Bar
                dataKey="currentSli"
                name="Observed SLI"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`sli-cell-${index}`}
                    fill={entry.isBreached ? '#FF4E00' : '#121212'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
