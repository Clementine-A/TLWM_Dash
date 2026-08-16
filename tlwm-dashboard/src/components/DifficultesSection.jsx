import React from 'react';
import { getDifficultesData } from '../data/mockData';
import { ChevronDown, ChevronUp, AlertTriangle, Target } from 'lucide-react';
import useStore from '../store/useStore';

const DifficultesSection = ({ selectedYear }) => {
  const [open, setOpen] = React.useState(true);
  const { theme } = useStore();
  const isDark = theme === 'dark';
  const { difficultes, perspectives } = getDifficultesData(selectedYear || 2024);

  if (!difficultes.length && !perspectives.length) {
    return (
      <div className={`theme-transition backdrop-blur border rounded-2xl p-5
        ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className={`text-sm font-semibold uppercase tracking-widest mb-2
          ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Difficultés &amp; Perspectives
        </h3>
        <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Aucune information disponible pour {selectedYear}.</p>
      </div>
    );
  }

  return (
    <div className={`theme-transition backdrop-blur border rounded-2xl p-5
      ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h3 className={`text-sm font-semibold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Difficultés &amp; Perspectives — {selectedYear}
        </h3>
        {open
          ? <ChevronUp size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          : <ChevronDown size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        }
      </button>

      {open && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Difficultés */}
          <div className="border-l-4 border-l-rose-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-rose-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Difficultés Identifiées
              </span>
            </div>
            <ul className="space-y-2">
              {difficultes.map((d, i) => (
                <li key={i} className={`flex items-start gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className="mt-1.5 w-1.5 h-1.5 flex-shrink-0 rounded-full bg-rose-500" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Perspectives */}
          <div className="border-l-4 border-l-emerald-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Perspectives &amp; Objectifs
              </span>
            </div>
            <ul className="space-y-2">
              {perspectives.map((p, i) => (
                <li key={i} className={`flex items-start gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className="mt-1.5 w-1.5 h-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DifficultesSection;
