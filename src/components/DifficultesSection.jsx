import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, AlertCircle, Target,
  GraduationCap, BookOpen, CheckSquare, Square,
} from 'lucide-react';
import useStore from '../store/useStore';
import { getDifficultesData, getDivisionFormation, getFormationMonths } from '../data/mockData';

// ─── Stat card individuelle ───────────────────────────────────────
const StatCard = ({ label, value, accent, isDark }) => (
  <div className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 transition-all
    ${isDark ? 'bg-navy-900/40 border-slate-700/40' : 'bg-white border-slate-200'}`}>
    <span className={`text-[10px] leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
      {label}
    </span>
    <span className={`text-[18px] font-extrabold leading-tight tabular-nums ${accent}`}>
      {value ?? 0}
    </span>
  </div>
);

// ─── Séparateur de section ────────────────────────────────────────
const SectionDivider = ({ label, color, isDark }) => (
  <div className={`flex items-center gap-2 pt-2`}>
    <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${color}`}>{label}</span>
    <div className={`flex-1 h-px ${isDark ? 'bg-slate-700/60' : 'bg-slate-200'}`} />
  </div>
);

// ─── Composant principal ──────────────────────────────────────────
const DifficultesSection = ({ selectedYear }) => {
  const { selectedMonths, theme } = useStore();
  const isDark = theme === 'dark';
  const [openDiff, setOpenDiff] = useState(true);
  const [openPersp, setOpenPersp] = useState(true);
  const [openForm, setOpenForm] = useState(true);

  // Mois ayant des formations (SFC ou SFD) pour cette année
  const formationMonths = useMemo(
    () => getFormationMonths(selectedYear),
    [selectedYear]
  );

  // Sélection locale des mois dans la section Formation
  // Par défaut : tous les mois avec données
  const [selectedFormMonths, setSelectedFormMonths] = useState([]);
  useEffect(() => {
    setSelectedFormMonths(formationMonths.map((fm) => fm.month));
  }, [selectedYear, formationMonths.length]);

  const toggleFormMonth = (month) => {
    setSelectedFormMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month]
    );
  };

  const selectAll = () => setSelectedFormMonths(formationMonths.map((fm) => fm.month));
  const isAllSelected = selectedFormMonths.length === formationMonths.length;

  // Données difficultés/perspectives
  const { difficultes, perspectives, hasMensuel, moisLabel } = useMemo(
    () => getDifficultesData(selectedYear, selectedMonths),
    [selectedYear, selectedMonths]
  );

  // Stats formation filtrées par les mois sélectionnés localement
  const divForm = useMemo(
    () => getDivisionFormation(selectedYear, selectedFormMonths),
    [selectedYear, selectedFormMonths]
  );

  const card = `theme-transition border rounded-2xl overflow-hidden
    ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`;
  const headerCls = `flex items-center justify-between w-full px-5 py-3.5 cursor-pointer select-none
    transition-colors duration-150
    ${isDark ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'}`;
  const titleCls = `text-sm font-semibold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  const subLabel = moisLabel ? `${moisLabel} ${selectedYear}` : `${selectedYear}`;

  const ListSection = ({ items, emptyMsg }) => {
    if (!items || items.length === 0) {
      return (
        <p className={`px-5 pb-4 text-xs italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          {emptyMsg}
        </p>
      );
    }
    return (
      <ul className="px-5 pb-4 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0
              ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-3">

      {/* ══════════════════════════════════════════════════════
          II. DIVISION FORMATION (2025/2026 seulement)
      ══════════════════════════════════════════════════════ */}
      {divForm && (
        <div className={card}>
          <button className={headerCls} onClick={() => setOpenForm((v) => !v)}>
            <div className="flex items-center gap-2.5">
              <GraduationCap size={14} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
              <h3 className={titleCls}>II. Division Formation - {selectedYear}</h3>
              {formationMonths.length > 0 && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold
                  ${isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                  {selectedFormMonths.length}/{formationMonths.length} mois
                </span>
              )}
            </div>
            {openForm
              ? <ChevronUp size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              : <ChevronDown size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />}
          </button>

          {openForm && (
            <div className="px-5 pb-6 space-y-5">

              {/* ── Sélecteur de mois ── */}
              {formationMonths.length > 0 && (
                <div className={`rounded-2xl border overflow-hidden
                  ${isDark ? 'border-slate-700/50 bg-navy-900/30' : 'border-slate-200 bg-slate-50'}`}>

                  {/* Header sélecteur */}
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b
                    ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest
                      ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Filtre par mois
                    </span>
                    <button
                      onClick={isAllSelected ? () => setSelectedFormMonths([]) : selectAll}
                      className={`text-[10px] font-bold transition-colors flex items-center gap-1
                        ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-800'}`}>
                      {isAllSelected ? <CheckSquare size={11} /> : <Square size={11} />}
                      {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>

                  {/* Mois sélectionnables */}
                  <div className="flex flex-wrap gap-0 p-3">
                    {formationMonths.map((fm, idx) => {
                      const isActive = selectedFormMonths.includes(fm.month);
                      return (
                        <button
                          key={fm.month}
                          onClick={() => toggleFormMonth(fm.month)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2.5 m-1 rounded-xl
                            border-2 transition-all duration-200 cursor-pointer select-none
                            ${isActive
                              ? isDark
                                ? 'bg-violet-500/20 border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                                : 'bg-violet-600 border-violet-600 shadow-md'
                              : isDark
                                ? 'bg-slate-800/50 border-slate-700/40 hover:border-slate-600/60'
                                : 'bg-white border-slate-200 hover:border-violet-300'
                            }`}
                        >
                          {/* Nom du mois */}
                          <span className={`text-[12px] font-bold leading-none
                            ${isActive
                              ? isDark ? 'text-violet-200' : 'text-white'
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                            {fm.month.substring(0, 3).toUpperCase()}
                          </span>

                          {/* Indicateurs SFC / SFD */}
                          <div className="flex gap-1">
                            {fm.hasSFC && (
                              <span className={`text-[8px] px-1 rounded font-black uppercase leading-4
                                ${isActive
                                  ? isDark ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/25 text-white'
                                  : isDark ? 'bg-cyan-900/50 text-cyan-500' : 'bg-cyan-100 text-cyan-700'
                                }`}>
                                SFC
                              </span>
                            )}
                            {fm.hasSFD && (
                              <span className={`text-[8px] px-1 rounded font-black uppercase leading-4
                                ${isActive
                                  ? isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/25 text-white'
                                  : isDark ? 'bg-emerald-900/50 text-emerald-500' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                SFD
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Résumé sélection */}
                  <div className={`px-4 py-2 border-t text-[10px]
                    ${isDark ? 'border-slate-700/50 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                    {selectedFormMonths.length === 0
                      ? 'Aucun mois sélectionné — sélectionnez au moins un mois pour voir les statistiques'
                      : `Statistiques pour : ${selectedFormMonths.join(', ')}`}
                  </div>
                </div>
              )}

              {/* ── Stats (masquées si aucun mois sélectionné) ── */}
              {selectedFormMonths.length > 0 && divForm && (
                <div className="space-y-4">

                  {/* SFA */}
                  <div>
                    <SectionDivider
                      label="SFA - Service de la Formation Academique"
                      color={isDark ? 'text-violet-400' : 'text-violet-600'}
                      isDark={isDark}
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2.5">
                      <StatCard label="Ecoles ouvertes" value={divForm.sfa.ecoles_ouvertes}
                        accent={isDark ? 'text-violet-300' : 'text-violet-700'} isDark={isDark} />
                      <StatCard label="Eleves inscrits" value={divForm.sfa.eleves_inscrits}
                        accent={isDark ? 'text-indigo-300' : 'text-indigo-700'} isDark={isDark} />
                      <StatCard label="Eleves actuels" value={divForm.sfa.eleves_actuels}
                        accent={isDark ? 'text-blue-300' : 'text-blue-700'} isDark={isDark} />
                    </div>
                  </div>

                  {/* SFD Classique */}
                  {divForm.sfd_classique.formations_classiques > 0 && (
                    <div>
                      <SectionDivider
                        label="SFD - Formation Classique"
                        color={isDark ? 'text-cyan-400' : 'text-cyan-700'}
                        isDark={isDark}
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
                        <StatCard label="Formations" value={divForm.sfd_classique.formations_classiques}
                          accent={isDark ? 'text-cyan-300' : 'text-cyan-700'} isDark={isDark} />
                        <StatCard label="Sauves formes" value={divForm.sfd_classique.sauves_formes}
                          accent={isDark ? 'text-emerald-300' : 'text-emerald-700'} isDark={isDark} />
                        <StatCard label="Formateurs natio." value={divForm.sfd_classique.formateurs_nationaux}
                          accent={isDark ? 'text-slate-300' : 'text-slate-600'} isDark={isDark} />
                        <StatCard label="Formateurs intl." value={divForm.sfd_classique.formateurs_internationaux}
                          accent={isDark ? 'text-amber-300' : 'text-amber-700'} isDark={isDark} />
                      </div>
                    </div>
                  )}

                  {/* SFD Diverses */}
                  {divForm.sfd_diverses.formations_diverses > 0 && (
                    <div>
                      <SectionDivider
                        label="SFD - Formations Diverses & Renforcement de capacites"
                        color={isDark ? 'text-rose-400' : 'text-rose-600'}
                        isDark={isDark}
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2.5">
                        <StatCard label="Formations diverses" value={divForm.sfd_diverses.formations_diverses}
                          accent={isDark ? 'text-rose-300' : 'text-rose-700'} isDark={isDark} />
                        <StatCard label="Leaders renforces" value={divForm.sfd_diverses.leaders_renforces}
                          accent={isDark ? 'text-orange-300' : 'text-orange-700'} isDark={isDark} />
                        <StatCard label="Hommes formes" value={divForm.sfd_diverses.hommes_formes}
                          accent={isDark ? 'text-slate-300' : 'text-slate-600'} isDark={isDark} />
                        <StatCard label="Femmes formees" value={divForm.sfd_diverses.femmes_formees}
                          accent={isDark ? 'text-pink-300' : 'text-pink-700'} isDark={isDark} />
                        <StatCard label="Jeunes formes" value={divForm.sfd_diverses.jeunes_formes}
                          accent={isDark ? 'text-yellow-300' : 'text-yellow-700'} isDark={isDark} />
                        <StatCard label="Renforcements" value={divForm.sfd_diverses.renforcements_capacite}
                          accent={isDark ? 'text-teal-300' : 'text-teal-700'} isDark={isDark} />
                      </div>
                    </div>
                  )}

                  {divForm.sfd_classique.formations_classiques === 0 &&
                   divForm.sfd_diverses.formations_diverses === 0 && (
                    <p className={`text-xs italic pt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      Aucune formation SFD pour les mois selectionnes
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DIFFICULTES & PERSPECTIVES
      ══════════════════════════════════════════════════════ */}
      <div className={card}>
        <button className={headerCls} onClick={() => setOpenDiff((v) => !v)}>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className={isDark ? 'text-rose-400' : 'text-rose-600'} />
            <h3 className={titleCls}>
              Difficultes & Perspectives - {subLabel}
            </h3>
            {hasMensuel && moisLabel && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase
                ${isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
                {moisLabel}
              </span>
            )}
          </div>
          {openDiff
            ? <ChevronUp size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            : <ChevronDown size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />}
        </button>

        {openDiff && (
          <div className="pb-2">
            <p className={`px-5 pt-1 pb-2 text-[10px] uppercase tracking-wider font-bold
              ${isDark ? 'text-rose-400/70' : 'text-rose-500'}`}>
              Difficultes
            </p>
            <ListSection items={difficultes} emptyMsg="Aucune difficulte renseignee pour cette periode." />

            <div className={`mx-5 border-t my-2 ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`} />

            <p className={`px-5 pt-1 pb-2 text-[10px] uppercase tracking-wider font-bold
              ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
              Perspectives
            </p>
            <ListSection items={perspectives} emptyMsg="Aucune perspective renseignee pour cette periode." />
          </div>
        )}
      </div>
    </div>
  );
};

export default DifficultesSection;
