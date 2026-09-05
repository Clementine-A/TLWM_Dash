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
      lightBg: 'from-sky-100 via-sky-50 to-white',
      lightBorder: 'border-sky-300',
      lightIcon: 'bg-sky-500 text-white',
      lightText: 'text-sky-700',
      lightGlow: 'shadow-sm',
      lightTopBar: 'from-sky-400 to-cyan-400',
    },
    violet: {
      darkBg: 'from-violet-500/20 to-violet-600/5',
      darkBorder: 'border-violet-500/30',
      darkIcon: 'bg-violet-500/20 text-violet-400',
      darkText: 'text-violet-400',
      darkGlow: 'shadow-violet-500/20',
      lightBg: 'from-violet-100 via-violet-50 to-white',
      lightBorder: 'border-violet-300',
      lightIcon: 'bg-violet-500 text-white',
      lightText: 'text-violet-700',
      lightGlow: 'shadow-sm',
      lightTopBar: 'from-violet-400 to-indigo-400',
    },
    emerald: {
      darkBg: 'from-emerald-500/20 to-emerald-600/5',
      darkBorder: 'border-emerald-500/30',
      darkIcon: 'bg-emerald-500/20 text-emerald-400',
      darkText: 'text-emerald-400',
      darkGlow: 'shadow-emerald-500/20',
      lightBg: 'from-emerald-100 via-emerald-50 to-white',
      lightBorder: 'border-emerald-300',
      lightIcon: 'bg-emerald-500 text-white',
      lightText: 'text-emerald-700',
      lightGlow: 'shadow-sm',
      lightTopBar: 'from-emerald-400 to-teal-400',
    },
    amber: {
      darkBg: 'from-amber-500/20 to-amber-600/5',
      darkBorder: 'border-amber-500/30',
      darkIcon: 'bg-amber-500/20 text-amber-400',
      darkText: 'text-amber-400',
      darkGlow: 'shadow-amber-500/20',
      lightBg: 'from-amber-100 via-amber-50 to-white',
      lightBorder: 'border-amber-300',
      lightIcon: 'bg-amber-500 text-white',
      lightText: 'text-amber-700',
      lightGlow: 'shadow-sm',
      lightTopBar: 'from-amber-400 to-orange-400',
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
        p-3 shadow-lg ${isDark ? c.darkGlow : c.lightGlow}
        hover:scale-[1.02] transition-all duration-300 ease-out
        animate-slide-up group cursor-default
      `}
    >
      {/* Top accent bar — light mode only */}
      {!isDark && c.lightTopBar && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.lightTopBar} rounded-t-2xl`} />
      )}

      {/* Decorative glow blob */}
      <div
        className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 blur-2xl ${isDark ? c.darkText : c.lightText} bg-current`}
      />

      <div className="relative z-10 flex items-start justify-between mt-0.5">
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
                  isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {isPositive ? '▲' : isNegative ? '▼' : '─'} {trendValue}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>vs mois prec.</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ml-3 flex-shrink-0 shadow-sm ${isDark ? c.darkIcon : c.lightIcon}`}>
          {Icon && <Icon size={18} strokeWidth={2} />}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
