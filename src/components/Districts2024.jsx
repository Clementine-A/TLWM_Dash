import React, { useState, useMemo } from 'react';
import { MapPin, ChevronDown, ChevronUp, Users, BarChart2, Calendar } from 'lucide-react';
import useStore from '../store/useStore';
import districtsData from '../data/districts_2024.json';

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

// Nettoyage : regrouper les doublons évidents
const DISTRICT_ALIASES = {
  'dnmf': 'DNMF (National)',
  'autres districts': null, // ignorer
  'district du nord': 'Zone Nord',
};

const Districts2024 = () => {
  const { theme } = useStore();
  const isDark = theme === 'dark';
  const [view, setView] = useState('aggregate'); // 'aggregate' | 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const aggregate = useMemo(() => {
    return districtsData.districts_aggregate
      .filter((d) => d.name && !['Autres districts'].includes(d.name))
      .sort((a, b) => b.assistance - a.assistance);
  }, []);

  const monthsAvailable = useMemo(() => {
    return Object.keys(districtsData.monthly_by_district)
      .map(Number)
      .sort()
      .map((mi) => ({ mi, label: MONTHS_FR[mi] }));
  }, []);

  const monthlyRows = useMemo(() => {
    if (selectedMonth === null) return [];
    const rows = districtsData.monthly_by_district[String(selectedMonth)] || [];
    return rows.sort((a, b) => b.assistance - a.assistance);
  }, [selectedMonth]);

  const maxAss = aggregate.length > 0 ? aggregate[0].assistance : 1;

  const card = `theme-transition backdrop-blur border rounded-2xl
    ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`;

  return (
    <div className={card}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b
        ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-amber-500/15' : 'bg-amber-50'}`}>
            <MapPin size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Activites par District - 2024
            </h3>
            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              Programmes terrain - Aout, Septembre, Octobre, Novembre, Decembre 2024
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors
            ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="p-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('aggregate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${view === 'aggregate'
                  ? isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              <BarChart2 size={12} />
              Vue globale
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${view === 'monthly'
                  ? isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              <Calendar size={12} />
              Par mois
            </button>
          </div>

          {/* Vue globale */}
          {view === 'aggregate' && (
            <div className="space-y-2">
              <p className={`text-[10px] uppercase tracking-wider font-bold
                ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {aggregate.length} districts - classement par audience cumulee
              </p>
              {aggregate.map((d, i) => {
                const bar = maxAss > 0 ? (d.assistance / maxAss) * 100 : 0;
                const isTop = i < 3;
                return (
                  <div key={d.name} className={`flex items-center gap-3 py-1.5 border-b last:border-0
                    ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                    <span className={`text-[10px] font-bold w-5 text-right flex-shrink-0
                      ${isTop ? (isDark ? 'text-amber-400' : 'text-amber-600')
                        : (isDark ? 'text-slate-600' : 'text-slate-400')}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[11px] font-semibold truncate
                          ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {d.name}
                        </span>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {d.sem} event{d.sem > 1 ? 's' : ''}
                          </span>
                          <span className={`text-[11px] font-bold w-16 text-right
                            ${isTop
                              ? (isDark ? 'text-amber-300' : 'text-amber-700')
                              : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
                            {d.assistance > 0 ? d.assistance.toLocaleString('fr-FR') : '-'}
                          </span>
                        </div>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden
                        ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${bar}%`,
                            background: isTop
                              ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                              : isDark ? '#334155' : '#94a3b8',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className={`rounded-xl border p-3 mt-2
                ${isDark ? 'border-slate-700/50 bg-navy-900/30' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Note : Les donnees de districts sont disponibles uniquement pour les mois avec
                  programmes speciaux (Aout-Decembre 2024). Les mois Jan-Juil utilisaient
                  un format de rapport different sans detail par district.
                </p>
              </div>
            </div>
          )}

          {/* Vue par mois */}
          {view === 'monthly' && (
            <div className="space-y-3">
              {/* Selector */}
              <div className="flex flex-wrap gap-2">
                {monthsAvailable.map(({ mi, label }) => (
                  <button
                    key={mi}
                    onClick={() => setSelectedMonth(mi)}
                    className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-all
                      ${selectedMonth === mi
                        ? isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-amber-100 border-amber-300 text-amber-700'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/30'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedMonth !== null && monthlyRows.length > 0 && (
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
                        {['District','Programme','Date','Assistance'].map((h) => (
                          <th key={h} className={`text-left py-2 px-3 font-bold uppercase tracking-wider text-[10px]
                            ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRows.map((row, i) => (
                        <tr key={i} className={`border-b transition-colors
                          ${isDark
                            ? `border-slate-800/40 hover:bg-slate-700/20 ${i%2!==0 ? 'bg-navy-700/10' : ''}`
                            : `border-slate-100 hover:bg-amber-50/40 ${i%2!==0 ? 'bg-slate-50/50' : ''}`
                          }`}>
                          <td className={`py-2 px-3 font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                            {row.district}
                          </td>
                          <td className={`py-2 px-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {row.programme || '-'}
                          </td>
                          <td className={`py-2 px-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {row.date || '-'}
                          </td>
                          <td className={`py-2 px-3 font-bold text-right
                            ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {row.assistance > 0 ? row.assistance.toLocaleString('fr-FR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <td colSpan={3} className={`py-2 px-3 text-xs font-bold
                          ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Total {MONTHS_FR[selectedMonth]}
                        </td>
                        <td className={`py-2 px-3 text-right font-extrabold
                          ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                          {monthlyRows.reduce((s, r) => s + r.assistance, 0).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {selectedMonth === null && (
                <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  Selectionnez un mois pour voir le detail par district
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Districts2024;
