import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMonthlyData } from '../data/mockData';
import useStore from '../store/useStore';

const RADIAN = Math.PI / 180;
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieRepartition = ({ selectedMonths = [], selectedYear }) => {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  const allData = useMemo(() => getMonthlyData(selectedYear || 2024), [selectedYear]);

  const data = useMemo(() => {
    const months = selectedMonths.length > 0
      ? allData.filter((d) => selectedMonths.includes(d.month))
      : allData;
    const totalAss  = months.reduce((s, m) => s + (m.sem_assemblees || 0), 0);
    const totalHors = months.reduce((s, m) => s + (m.sem_hors || 0), 0);
    return [
      { name: 'En assemblées',   value: totalAss,  color: '#06b6d4' },
      { name: 'Hors assemblées', value: totalHors, color: '#8b5cf6' },
    ];
  }, [selectedMonths, allData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`backdrop-blur border rounded-xl px-4 py-3 shadow-2xl
          ${isDark ? 'bg-navy-800/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
          <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{payload[0].name}</p>
          <p className="text-xs" style={{ color: payload[0].payload.color }}>
            <span className="font-bold text-lg">{payload[0].value}</span> séminaires
          </p>
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
        Répartition des Séminaires
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} innerRadius={45}
            dataKey="value" labelLine={false} label={CustomLabel}
            animationBegin={0} animationDuration={800}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', paddingTop: '8px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieRepartition;
