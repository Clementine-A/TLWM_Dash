import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMonthlyData, shortMonth } from '../data/mockData';
import useStore from '../store/useStore';

const SavedVsAddedChart = ({ selectedMonths = [], selectedYear }) => {
  const { theme } = useStore();
  const isDark = theme === 'dark';
  const hasFilter = selectedMonths.length > 0;

  const allData = getMonthlyData(selectedYear || 2024);
  const data = hasFilter
    ? allData.filter((d) => selectedMonths.includes(d.month))
    : allData.filter((m) => m.sauves > 0);

  const chartData = data.map((d) => ({
    name: shortMonth(d.month),
    Sauvés: d.sauves,
    Ajoutés: d.ajoutes,
  }));

  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tickColor = isDark ? '#64748b' : '#94a3b8';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`backdrop-blur border rounded-xl px-4 py-3 shadow-2xl
          ${isDark ? 'bg-navy-800/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
          <p className={`font-semibold text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</p>
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{entry.name} :</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.value?.toLocaleString('fr-FR')}
              </span>
            </div>
          ))}
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
        Ajoutés vs Sauvés par Mois
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: tickColor }} />
          <Bar dataKey="Sauvés" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Ajoutés" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SavedVsAddedChart;
