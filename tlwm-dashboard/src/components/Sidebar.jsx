import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight,
  Sun, Moon, Globe, Menu, X, Check, Map, LayoutDashboard,
} from 'lucide-react';
import useStore from '../store/useStore';
import { MONTHS, YEARS, getMonthlyData } from '../data/mockData';

const Sidebar = () => {
  const {
    selectedMonths, selectedYear,
    toggleMonth, clearMonths, setYear,
    theme, toggleTheme, sidebarOpen, toggleSidebar,
    currentPage, setPage,
  } = useStore();

  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);

  const monthlyData = useMemo(() => getMonthlyData(selectedYear), [selectedYear]);

  const isDark = theme === 'dark';
  const expanded = sidebarOpen;

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Libellé du bouton
  const monthButtonLabel = useMemo(() => {
    if (selectedMonths.length === 0) return 'Tous les mois';
    if (selectedMonths.length === 1) return selectedMonths[0];
    return `${selectedMonths.length} mois sélectionnés`;
  }, [selectedMonths]);

  return (
    <aside
      className={`sidebar fixed top-0 left-0 h-screen z-50 flex flex-col
        ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}
        ${isDark
          ? 'bg-navy-800 border-r border-slate-700/50'
          : 'bg-gradient-to-b from-brand-800 to-brand-900 border-r border-brand-700/30'
        }
      `}
    >
      {/* ── Header ── */}
      <div className={`flex items-center ${expanded ? 'px-4 gap-3' : 'px-0 justify-center'} py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-white/10'}`}>
        {expanded && (
          <div className="flex items-center gap-3 flex-1 min-w-0 animate-fade-in">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
              ${isDark
                ? 'bg-gradient-to-br from-cyan-500 to-violet-600 shadow-cyan-500/20'
                : 'bg-gradient-to-br from-brand-400 to-brand-300 shadow-brand-400/30'
              }`}>
              <Globe size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white leading-none truncate">
                ALWM Dashboard
              </h1>
              <p className={`text-[9px] leading-none mt-0.5 ${isDark ? 'text-slate-500' : 'text-brand-200/60'}`}>
                DAMF TOGO
              </p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition-all duration-200
            ${isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              : 'text-brand-200/70 hover:text-white hover:bg-white/10'
            }
            ${!expanded ? 'mx-auto' : ''}
          `}
          title={expanded ? 'Réduire' : 'Développer'}
        >
          {expanded ? <ChevronLeft size={16} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Navigation Pages ── */}
      <div className={`${expanded ? 'px-4' : 'px-2'} py-3 border-b ${isDark ? 'border-slate-700/50' : 'border-white/10'}`}>
        {expanded && (
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-brand-200/70'}`}>
            Navigation
          </p>
        )}
        <div className={`flex ${expanded ? 'flex-col gap-1' : 'flex-col gap-1 items-center'}`}>
          {/* Dashboard */}
          <button
            onClick={() => setPage('dashboard')}
            title="Dashboard"
            className={`sidebar-item w-full ${
              currentPage === 'dashboard'
                ? isDark
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'bg-white/20 text-white border border-white/20'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                  : 'text-brand-200/70 hover:text-white hover:bg-white/10 border border-transparent'
            } ${!expanded ? 'justify-center px-0' : ''}`}
          >
            <LayoutDashboard size={16} className="flex-shrink-0" />
            {expanded && <span>Dashboard</span>}
          </button>
          {/* Carte */}
          <button
            onClick={() => setPage('map')}
            title="Carte des Assemblées"
            className={`sidebar-item w-full ${
              currentPage === 'map'
                ? isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/20 text-white border border-white/20'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                  : 'text-brand-200/70 hover:text-white hover:bg-white/10 border border-transparent'
            } ${!expanded ? 'justify-center px-0' : ''}`}
          >
            <Map size={16} className="flex-shrink-0" />
            {expanded && <span>Carte des Assemblées</span>}
          </button>
        </div>
      </div>

      {/* ── Country Filter ── */}
      <div className={`${expanded ? 'px-4' : 'px-2'} py-3 border-b ${isDark ? 'border-slate-700/50' : 'border-white/10'}`}>
        {expanded && (
          <div className="flex items-center gap-2 mb-2">
            <Globe size={13} className={isDark ? 'text-slate-400' : 'text-brand-200/70'} />
            <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-400' : 'text-brand-200/70'}`}>
              Pays
            </p>
          </div>
        )}
        <div className={`flex ${expanded ? 'gap-2' : 'flex-col gap-1 items-center'}`}>
          {expanded ? (
            <div className="relative w-full">
              <select
                value="TG"
                onChange={() => {}}
                className={`w-full appearance-none rounded-lg text-sm font-bold py-2 pl-3 pr-8 cursor-pointer outline-none transition-colors duration-200 shadow-sm
                  ${isDark
                    ? 'bg-navy-800 text-white border border-slate-700 focus:border-cyan-500 hover:border-slate-600'
                    : 'bg-white/10 text-white border border-brand-700/50 focus:border-white hover:bg-white/20'
                  }`}
              >
                <option value="TG" className="text-slate-800 bg-white">🇹🇬 Togo</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronRight size={14} className={`rotate-90 ${isDark ? 'text-slate-400' : 'text-brand-200/70'}`} />
              </div>
            </div>
          ) : (
            <select
              value="TG"
              onChange={() => {}}
              className={`w-10 h-10 rounded-lg text-xs font-bold p-0 text-center cursor-pointer appearance-none outline-none shadow-sm
                ${isDark
                  ? 'bg-navy-800 text-white border border-slate-700 hover:border-slate-600'
                  : 'bg-white/10 text-white border border-brand-700/50 hover:bg-white/20'
                }`}
              title="Pays"
            >
              <option value="TG" className="text-slate-800 bg-white">TG</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Year Selector ── */}
      <div className={`${expanded ? 'px-4' : 'px-2'} py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-white/10'}`}>
        {expanded && (
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={13} className={isDark ? 'text-slate-400' : 'text-brand-200/70'} />
            <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-400' : 'text-brand-200/70'}`}>
              Année
            </p>
          </div>
        )}
        <div className={`flex ${expanded ? 'gap-2' : 'flex-col gap-1 items-center'}`}>
          {expanded ? (
            <div className="relative w-full">
              <select
                value={selectedYear}
                onChange={(e) => setYear(Number(e.target.value))}
                className={`w-full appearance-none rounded-lg text-sm font-bold py-2 pl-3 pr-8 cursor-pointer outline-none transition-colors duration-200 shadow-sm
                  ${isDark
                    ? 'bg-navy-800 text-white border border-slate-700 focus:border-cyan-500 hover:border-slate-600'
                    : 'bg-white/10 text-white border border-brand-700/50 focus:border-white hover:bg-white/20'
                  }`}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="text-slate-800 bg-white">{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronRight size={14} className={`rotate-90 ${isDark ? 'text-slate-400' : 'text-brand-200/70'}`} />
              </div>
            </div>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setYear(Number(e.target.value))}
              className={`w-10 h-10 rounded-lg text-xs font-bold p-0 text-center cursor-pointer appearance-none outline-none shadow-sm
                ${isDark
                  ? 'bg-navy-800 text-white border border-slate-700 hover:border-slate-600'
                  : 'bg-white/10 text-white border border-brand-700/50 hover:bg-white/20'
                }`}
              title="Sélectionner l'année"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="text-slate-800 bg-white">
                  {String(y).slice(2)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Month Filter (dropdown custom avec checkboxes) ── */}
      <div className={`${expanded ? 'px-4' : 'px-2'} py-4 flex-1 overflow-y-auto`}>
        {expanded && (
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={13} className={isDark ? 'text-slate-400' : 'text-brand-200/70'} />
            <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-400' : 'text-brand-200/70'}`}>
              Mois
            </p>
            {selectedMonths.length > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto
                ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-brand-100 text-brand-700'}`}>
                {selectedMonths.length}
              </span>
            )}
          </div>
        )}

        <div className={`flex ${expanded ? 'gap-2' : 'flex-col gap-1 items-center'}`}>
          {expanded ? (
            /* ── Dropdown custom ── */
            <div className="relative w-full" ref={monthDropdownRef}>
              {/* Bouton déclencheur (même style que Année) */}
              <button
                onClick={() => setMonthDropdownOpen((o) => !o)}
                className={`w-full appearance-none rounded-lg text-sm font-medium py-2 pl-3 pr-8 cursor-pointer outline-none transition-colors duration-200 shadow-sm text-left truncate
                  ${isDark
                    ? 'bg-navy-800 text-white border border-slate-700 hover:border-slate-600 focus:border-violet-500'
                    : 'bg-white/10 text-white border border-brand-700/50 hover:bg-white/20 focus:border-white'
                  }
                  ${monthDropdownOpen
                    ? isDark ? 'border-violet-500' : 'border-white'
                    : ''
                  }`}
              >
                {monthButtonLabel}
              </button>
              {/* Icône chevron */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200
                    ${monthDropdownOpen ? 'rotate-90' : '-rotate-90'}
                    ${isDark ? 'text-slate-400' : 'text-brand-200/70'}
                  `}
                />
              </div>

              {/* Panel déroulant */}
              {monthDropdownOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 z-[60] rounded-xl border shadow-2xl overflow-hidden
                  ${isDark ? 'bg-navy-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  {/* Option "Tous les mois" */}
                  <button
                    onClick={() => { clearMonths(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold transition-colors border-b
                      ${isDark
                        ? 'text-slate-200 hover:bg-slate-700/50 border-slate-700/60'
                        : 'text-slate-700 hover:bg-slate-50 border-slate-100'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${selectedMonths.length === 0
                        ? isDark ? 'bg-violet-500 border-violet-500' : 'bg-brand-500 border-brand-500'
                        : isDark ? 'border-slate-500' : 'border-slate-300'
                      }`}>
                      {selectedMonths.length === 0 && <Check size={9} className="text-white" />}
                    </span>
                    Tous les mois
                  </button>

                  {/* Liste des mois */}
                  <div className="max-h-56 overflow-y-auto">
                    {MONTHS.map((m) => {
                      const mData = monthlyData.find((d) => d.month === m);
                      const hasData = mData && (mData.sauves > 0 || mData.sem_total > 0 || mData.assistance > 0);
                      const isSelected = selectedMonths.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => hasData && toggleMonth(m)}
                          disabled={!hasData}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                            ${!hasData
                              ? isDark ? 'opacity-30 cursor-not-allowed text-slate-500' : 'opacity-30 cursor-not-allowed text-slate-400'
                              : isSelected
                                ? isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-brand-50 text-brand-700'
                                : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                            ${isSelected
                              ? isDark ? 'bg-violet-500 border-violet-500' : 'bg-brand-500 border-brand-500'
                              : isDark ? 'border-slate-500' : 'border-slate-300'
                            }`}>
                            {isSelected && <Check size={9} className="text-white" />}
                          </span>
                          {m}
                          {!hasData && <span className="ml-auto text-[10px] opacity-60">vide</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer si sélection active */}
                  {selectedMonths.length > 0 && (
                    <div className={`flex items-center justify-between px-3 py-2 border-t text-[10px]
                      ${isDark ? 'border-slate-700/60 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                      <span>{selectedMonths.length} mois sélectionné{selectedMonths.length > 1 ? 's' : ''}</span>
                      <button
                        onClick={clearMonths}
                        className={`flex items-center gap-1 font-semibold transition-colors
                          ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-500 hover:text-rose-400'}`}
                      >
                        <X size={9} /> Effacer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Sidebar réduite */
            <button
              onClick={() => { if (selectedMonths.length > 0) clearMonths(); }}
              title={selectedMonths.length > 0 ? `${selectedMonths.length} mois — cliquer pour effacer` : 'Mois'}
              className={`w-10 h-10 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all border
                ${selectedMonths.length > 0
                  ? isDark
                    ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                    : 'bg-brand-500/30 border-brand-400 text-white'
                  : isDark
                    ? 'bg-navy-800 border-slate-700 text-slate-500'
                    : 'bg-white/10 border-brand-700/50 text-white/50'
                }`}
            >
              {selectedMonths.length > 0 ? selectedMonths.length : <Calendar size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Theme Toggle ── */}
      <div className={`${expanded ? 'px-4' : 'px-2'} py-4 border-t ${isDark ? 'border-slate-700/50' : 'border-white/10'}`}>
        <button
          onClick={toggleTheme}
          className={`sidebar-item w-full
            ${isDark
              ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
              : 'text-brand-200/70 hover:text-white hover:bg-white/10'
            }
            ${!expanded ? 'justify-center px-0' : ''}
          `}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {expanded && <span>{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
