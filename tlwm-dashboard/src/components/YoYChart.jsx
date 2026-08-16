import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import useStore from '../store/useStore';

const YoYChart = ({ yoy }) => {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  const metrics = [
    { key: 'seminaires', label: 'Séminaires', color2024: '#0891b2', color2025: '#22d3ee' },
    { key: 'assistance',  label: 'Assistance',  color2024: '#7c3aed', color2025: '#a78bfa' },
    { key: 'sauves',     label: 'Sauvés',      color2024: '#059669', color2025: '#34d399' },
    { key: 'ajoutes',    label: 'Ajoutés',     color2024: '#d97706', color2025: '#fbbf24' },
  ];

  const chartData = metrics.map((m) => ({
    name: m.label,
    '2024': yoy[m.key]?.y2024 || 0,
    '2025': yoy[m.key]?.y2025 || 0,
    pct: yoy[m.key]?.pct || 'N/A',
    color2024: m.color2024,
    color2025: m.color2025,
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
    <div className={`theme-transition backdrop-blur border rounded-2xl p-5
      ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Comparaison Annuelle — 2024 vs 2025
        </h3>
        <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" /> 2024
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" /> 2025
          </span>
        </div>
      </div>

      {/* Evolution Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {metrics.map((m) => {
          const pct = yoy[m.key]?.pct;
          const isPos = pct && !isNaN(parseFloat(pct)) && parseFloat(pct) >= 0;
          const isNeg = pct && !isNaN(parseFloat(pct)) && parseFloat(pct) < 0;
          return (
            <div key={m.key} className={`theme-transition border rounded-xl p-3
              ${isDark ? 'bg-navy-700/40 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[10px] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{m.label}</p>
              <p className={`text-base font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {yoy[m.key]?.y2025?.toLocaleString('fr-FR') || 0}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                vs {yoy[m.key]?.y2024?.toLocaleString('fr-FR') || 0}
              </p>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isPos ? 'bg-emerald-500/10 text-emerald-400' : isNeg ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700/30 text-slate-500'
              }`}>
                {isPos ? '+' : ''}{pct}%
              </span>
            </div>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="2024" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="2025" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YoYChart;
