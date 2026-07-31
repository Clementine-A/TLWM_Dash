import React from 'react';
import { getMonthlyData } from '../data/mockData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import useStore from '../store/useStore';

const indicators = [
  { key: 'sem_total', label: 'Séminaires', darkColor: 'text-cyan-400', lightColor: 'text-sky-600' },
  { key: 'assistance', label: 'Assistance', darkColor: 'text-violet-400', lightColor: 'text-violet-600' },
  { key: 'sauves', label: 'Sauvés', darkColor: 'text-emerald-400', lightColor: 'text-emerald-600' },
  { key: 'ajoutes', label: 'Ajoutés', darkColor: 'text-amber-400', lightColor: 'text-amber-600' },
];

const calcTrend = (cur, prev) => {
  if (!prev || prev === 0) return { pct: '0.0', dir: 'neutral' };
  const pct = ((cur - prev) / prev) * 100;
  if (pct >= 10) return { pct: pct.toFixed(1), dir: 'up' };
  if (pct <= -10) return { pct: Math.abs(pct).toFixed(1), dir: 'down' };
  return { pct: Math.abs(pct).toFixed(1), dir: 'neutral' };
};

const MissionPulse = ({ selectedMonths = [], selectedYear }) => {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  const months = getMonthlyData(selectedYear || 2024).filter((m) => m.sauves > 0 || m.sem_total > 0);

  // Utilise le dernier mois sélectionné (ou le dernier mois avec données)
  const lastSelected = selectedMonths.length > 0
    ? selectedMonths[selectedMonths.length - 1]
    : null;
  const currentIdx = lastSelected
    ? months.findIndex((m) => m.month === lastSelected)
    : months.length - 1;
  const current = months[currentIdx];
  const previous = currentIdx > 0 ? months[currentIdx - 1] : null;

  return (
    <div className={`theme-transition backdrop-blur border rounded-2xl p-5
      ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <h3 className={`text-sm font-semibold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Mission Pulse
        </h3>
        <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
          LIVE
        </span>
      </div>
      <p className={`text-[10px] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        Comparaison vs mois précédent — {current?.month || ''}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {indicators.map((ind) => {
          const cur = current?.[ind.key] ?? 0;
          const prev = previous?.[ind.key] ?? 0;
          const trend = calcTrend(cur, prev);
          const bgColor = isDark
            ? trend.dir === 'up'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : trend.dir === 'down'
              ? 'bg-rose-500/10 border-rose-500/20'
              : 'bg-slate-700/20 border-slate-600/20'
            : trend.dir === 'up'
              ? 'bg-emerald-50 border-emerald-200'
              : trend.dir === 'down'
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50 border-slate-200';
          const trendColor = trend.dir === 'up' ? 'text-emerald-400' : trend.dir === 'down' ? 'text-rose-400' : 'text-slate-500';
          const TrendIcon = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;

          return (
            <div key={ind.key} className={`border rounded-xl p-3 ${bgColor} theme-transition`}>
              <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{ind.label}</p>
              <p className={`text-lg font-extrabold leading-tight ${isDark ? ind.darkColor : ind.lightColor}`}>
                {cur.toLocaleString('fr-FR')}
              </p>
              <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                <TrendIcon size={11} />
                <span className="text-[10px] font-semibold">
                  {trend.dir === 'neutral' ? '±' : trend.dir === 'up' ? '+' : '-'}{trend.pct}%
                </span>
                {previous && (
                  <span className={`text-[9px] ml-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>({prev.toLocaleString('fr-FR')})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className={`text-[9px] mt-3 text-center ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>≥+10%=vert · ±10%=neutre · ≤-10%=rouge</p>
    </div>
  );
};

export default MissionPulse;
