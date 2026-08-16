import React from 'react';
import useStore from '../store/useStore';

const KPICard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  const colorMap = {
    cyan: {
      darkBg: 'from-cyan-500/20 to-cyan-600/5',
      darkBorder: 'border-cyan-500/30',
      darkIcon: 'bg-cyan-500/20 text-cyan-400',
      darkText: 'text-cyan-400',
      darkGlow: 'shadow-cyan-500/20',
      lightBg: 'from-sky-50 to-white',
      lightBorder: 'border-sky-200',
      lightIcon: 'bg-sky-100 text-sky-600',
      lightText: 'text-sky-700',
      lightGlow: 'shadow-sky-100',
    },
    violet: {
      darkBg: 'from-violet-500/20 to-violet-600/5',
      darkBorder: 'border-violet-500/30',
      darkIcon: 'bg-violet-500/20 text-violet-400',
      darkText: 'text-violet-400',
      darkGlow: 'shadow-violet-500/20',
      lightBg: 'from-violet-50 to-white',
      lightBorder: 'border-violet-200',
      lightIcon: 'bg-violet-100 text-violet-600',
      lightText: 'text-violet-700',
      lightGlow: 'shadow-violet-100',
    },
    emerald: {
      darkBg: 'from-emerald-500/20 to-emerald-600/5',
      darkBorder: 'border-emerald-500/30',
      darkIcon: 'bg-emerald-500/20 text-emerald-400',
      darkText: 'text-emerald-400',
      darkGlow: 'shadow-emerald-500/20',
      lightBg: 'from-emerald-50 to-white',
      lightBorder: 'border-emerald-200',
      lightIcon: 'bg-emerald-100 text-emerald-600',
      lightText: 'text-emerald-700',
      lightGlow: 'shadow-emerald-100',
    },
    amber: {
      darkBg: 'from-amber-500/20 to-amber-600/5',
      darkBorder: 'border-amber-500/30',
      darkIcon: 'bg-amber-500/20 text-amber-400',
      darkText: 'text-amber-400',
      darkGlow: 'shadow-amber-500/20',
      lightBg: 'from-amber-50 to-white',
      lightBorder: 'border-amber-200',
      lightIcon: 'bg-amber-100 text-amber-600',
      lightText: 'text-amber-700',
      lightGlow: 'shadow-amber-100',
    },
  };

  const c = colorMap[color] || colorMap.cyan;
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-sm theme-transition
        bg-gradient-to-br ${isDark ? c.darkBg : c.lightBg} ${isDark ? c.darkBorder : c.lightBorder}
        p-3 shadow-xl ${isDark ? c.darkGlow : c.lightGlow}
        hover:scale-[1.02] transition-all duration-300 ease-out
        animate-slide-up group cursor-default
      `}
    >
      {/* Decorative glow blob */}
      <div
        className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 blur-2xl ${isDark ? c.darkText : c.lightText} bg-current`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1
            ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {title}
          </p>
          <p className={`text-2xl font-extrabold leading-tight ${isDark ? c.darkText : c.lightText}`}>
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>
          )}
          {trendValue !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-semibold ${
                  isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {isPositive ? '▲' : isNegative ? '▼' : '─'} {trendValue}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>vs mois préc.</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ml-3 flex-shrink-0 ${isDark ? c.darkIcon : c.lightIcon}`}>
          {Icon && <Icon size={18} strokeWidth={2} />}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
