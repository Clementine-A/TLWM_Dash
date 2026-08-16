import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { getMonthlyData, shortMonth } from '../data/mockData';
import useStore from '../store/useStore';

const COLORS = ['#0891b2','#0891b2','#06b6d4','#06b6d4','#22d3ee','#22d3ee',
                 '#0ea5e9','#0ea5e9','#3b82f6','#3b82f6','#6366f1','#6366f1'];

const SeminarsBarChart = ({ selectedMonths = [], selectedYear }) => {
  const { theme } = useStore();
  const isDark = theme === 'dark';
  const hasFilter = selectedMonths.length > 0;

  const allData = getMonthlyData(selectedYear || 2024);
  const data = hasFilter
    ? allData.filter((d) => selectedMonths.includes(d.month))
    : allData.filter((m) => m.sem_total > 0);

  const chartData = data.map((d) => ({ name: shortMonth(d.month), Séminaires: d.sem_total }));

  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tickColor = isDark ? '#64748b' : '#94a3b8';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`backdrop-blur border rounded-xl px-4 py-3 shadow-2xl
          ${isDark ? 'bg-navy-800/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
          <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Séminaires :</span>
            <span className="font-bold text-cyan-400">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`theme-transition backdrop-blur border rounded-2xl p-5 h-full
      ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-widest mb-4
        ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Séminaires par Mois
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="Séminaires" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeminarsBarChart;
