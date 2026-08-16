import React, { useMemo } from 'react';
import {
  BookOpen, Users, Heart, TrendingUp,
  UserCheck, GraduationCap, Globe,
  Building2, BarChart3, Filter,
} from 'lucide-react';

import KPICard from '../components/KPICard';
import MonthlyLineChart from '../components/MonthlyLineChart';
import SeminarsBarChart from '../components/SeminarsBarChart';
import PieRepartition from '../components/PieRepartition';
import SavedVsAddedChart from '../components/SavedVsAddedChart';
import ActivitiesTable from '../components/ActivitiesTable';
import DifficultesSection from '../components/DifficultesSection';
import MissionPulse from '../components/MissionPulse';
import YoYChart from '../components/YoYChart';

import useStore from '../store/useStore';
import {
  getMonthlyData, computeAnnualTotals, getHumanResources,
  getYoYComparison, MONTH_ABBR,
} from '../data/mockData';

const Dashboard = () => {
  const { selectedMonths, selectedYear, theme } = useStore();
  const isDark = theme === 'dark';
  const hasFilter = selectedMonths.length > 0;

  const monthlyData = useMemo(() => getMonthlyData(selectedYear), [selectedYear]);
  const annualTotals = useMemo(() => computeAnnualTotals(selectedYear), [selectedYear]);
  const hrBase = useMemo(() => getHumanResources(selectedYear), [selectedYear]);
  const yoy = useMemo(() => getYoYComparison(), []);

  // Données filtrées selon les mois sélectionnés
  const filteredMonthData = useMemo(() => {
    if (!hasFilter) return null;
    return monthlyData.filter((d) => selectedMonths.includes(d.month));
  }, [hasFilter, monthlyData, selectedMonths]);

  // HR data : dernier mois sélectionné (ou base annuelle)
  const hr = useMemo(() => {
    if (hasFilter && filteredMonthData && filteredMonthData.length > 0) {
      const m = filteredMonthData[filteredMonthData.length - 1];
      return {
        predicateurs: m.predicateurs || hrBase.predicateurs,
        elevesPredicateurs: m.eleves_inscrits || m.eleves_actuels || hrBase.elevesPredicateurs,
        missionnaireNationaux: m.miss_nationaux || hrBase.missionnaireNationaux,
        missionnaireInternationaux: m.miss_internationaux || hrBase.missionnaireInternationaux,
        pasteurs: m.pasteurs || hrBase.pasteurs,
        membres: m.membres || hrBase.membres,
        assemblees: m.assemblees_count || hrBase.assemblees,
        districts: m.districts || hrBase.districts,
      };
    }
    return hrBase;
  }, [hasFilter, filteredMonthData, hrBase]);

  // KPIs : somme des mois sélectionnés (ou totaux annuels)
  const kpis = useMemo(() => {
    if (hasFilter && filteredMonthData) {
      if (filteredMonthData.length === 0) return null;
      const seminaires = filteredMonthData.reduce((s, m) => s + (m.sem_total || 0), 0);
      const assistance = filteredMonthData.reduce((s, m) => s + (m.assistance || 0), 0);
      const sauves     = filteredMonthData.reduce((s, m) => s + (m.sauves || 0), 0);
      const ajoutes    = filteredMonthData.reduce((s, m) => s + (m.ajoutes || 0), 0);
      return {
        seminaires,
        assistance,
        sauves,
        tauxConversion: sauves > 0 ? ((ajoutes / sauves) * 100).toFixed(1) : '0.0',
      };
    }
    return {
      seminaires: annualTotals.totalSeminaires,
      assistance: annualTotals.totalAssistance,
      sauves: annualTotals.totalSauves,
      tauxConversion: annualTotals.tauxConversion,
    };
  }, [hasFilter, filteredMonthData, annualTotals]);

  // Tendance : compare le dernier mois sélectionné vs son précédent
  const trends = useMemo(() => {
    // Si un seul mois sélectionné → tendance vs mois précédent
    // Sinon → pas de tendance fiable
    let idx;
    if (hasFilter && selectedMonths.length === 1) {
      idx = monthlyData.findIndex((d) => d.month === selectedMonths[0]);
    } else if (!hasFilter) {
      idx = monthlyData.filter(m => m.sauves > 0 || m.sem_total > 0).length - 1;
    } else {
      return {};
    }
    const cur = monthlyData[idx];
    const prev = idx > 0 ? monthlyData[idx - 1] : null;
    if (!prev || !cur) return {};
    const pct = (key) => {
      const diff = prev[key] > 0 ? ((cur[key] - prev[key]) / prev[key]) * 100 : 0;
      return { v: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, dir: diff >= 0 ? 'up' : 'down' };
    };
    const convTrend = (() => {
      const prevConv = prev.pourcentage || 0;
      const curConv  = cur.pourcentage  || 0;
      const diff = prevConv > 0 ? curConv - prevConv : 0;
      return { v: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, dir: diff >= 0 ? 'up' : 'down' };
    })();
    return {
      seminaires: pct('sem_total'),
      assistance: pct('assistance'),
      sauves: pct('sauves'),
      tauxConversion: convTrend,
    };
  }, [hasFilter, selectedMonths, monthlyData]);

  // Libellé du filtre actif
  const filterLabel = useMemo(() => {
    if (!hasFilter) return null;
    if (selectedMonths.length === 1) return `${selectedMonths[0]} ${selectedYear}`;
    if (selectedMonths.length <= 3) {
      return selectedMonths.map(m => MONTH_ABBR[m] || m).join(', ') + ` ${selectedYear}`;
    }
    return `${selectedMonths.length} mois · ${selectedYear}`;
  }, [hasFilter, selectedMonths, selectedYear]);

  const hrItems = [
    { label: 'Prédicateurs', value: hr.predicateurs, icon: UserCheck, darkColor: 'text-cyan-400', lightColor: 'text-brand-600' },
    { label: 'Élèves Préd.', value: hr.elevesPredicateurs, icon: GraduationCap, darkColor: 'text-violet-400', lightColor: 'text-violet-600' },
    { label: 'Pasteurs', value: hr.pasteurs, icon: UserCheck, darkColor: 'text-blue-400', lightColor: 'text-blue-600' },
    { label: 'Miss. Natio.', value: hr.missionnaireNationaux, icon: Users, darkColor: 'text-emerald-400', lightColor: 'text-emerald-600' },
    { label: 'Miss. Intl.', value: hr.missionnaireInternationaux, icon: Globe, darkColor: 'text-amber-400', lightColor: 'text-amber-600' },
    { label: 'Assemblées', value: hr.assemblees, icon: Building2, darkColor: 'text-rose-400', lightColor: 'text-rose-600' },
    { label: 'Districts', value: hr.districts, icon: BarChart3, darkColor: 'text-indigo-400', lightColor: 'text-indigo-600' },
    { label: 'Membres', value: hr.membres, icon: Users, darkColor: 'text-teal-400', lightColor: 'text-teal-600' },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>

      {/* ── Compact top bar ── */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300
        ${isDark
          ? 'border-slate-800/80 bg-navy-900/90'
          : 'border-slate-200/80 bg-white/80 shadow-sm'
        }`}
      >
        <div className="px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-brand-800'}`}>
              {hasFilter ? filterLabel : `Année ${selectedYear}`}
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Rapports d'Activités Missionnaires : DAMF TOGO
            </p>
          </div>
          {hasFilter && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
              ${isDark
                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                : 'bg-brand-100 text-brand-700 border border-brand-200'
              }`}>
              <Filter size={11} className="flex-shrink-0" />
              {selectedMonths.length === 1
                ? selectedMonths[0]
                : `${selectedMonths.length} mois`}
            </span>
          )}
        </div>
      </header>

      <main className="px-6 py-6 space-y-5">

        {/* ── Human Resources Banner ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {hrItems.map((item) => (
            <div
              key={item.label}
              className={`theme-transition rounded-xl px-3 py-2 flex items-center gap-2
                ${isDark
                  ? 'bg-navy-800/40 border border-slate-800'
                  : 'bg-white border border-slate-200 shadow-sm'
                }`}
            >
              <item.icon size={14} className={isDark ? item.darkColor : item.lightColor} />
              <div className="min-w-0">
                <p className={`text-[9px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.label}</p>
                <p className={`text-sm font-extrabold ${isDark ? item.darkColor : item.lightColor}`}>
                  {item.value > 0 ? item.value.toLocaleString('fr-FR') : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            title="Total Séminaires"
            value={kpis?.seminaires ?? 0}
            subtitle={hasFilter
              ? (selectedMonths.length === 1 ? selectedMonths[0] : `${selectedMonths.length} mois`)
              : `Annuel ${selectedYear}`}
            icon={BookOpen}
            color="cyan"
            trend={trends.seminaires?.dir}
            trendValue={trends.seminaires?.v}
          />
          <KPICard
            title="Total Assistance"
            value={kpis?.assistance ?? 0}
            subtitle="Personnes touchées"
            icon={Users}
            color="violet"
            trend={trends.assistance?.dir}
            trendValue={trends.assistance?.v}
          />
          <KPICard
            title="Personnes Sauvées"
            value={kpis?.sauves ?? 0}
            subtitle="Déclaration de salut"
            icon={Heart}
            color="emerald"
            trend={trends.sauves?.dir}
            trendValue={trends.sauves?.v}
          />
          <KPICard
            title="Taux de Conversion"
            value={`${kpis?.tauxConversion ?? 0}%`}
            subtitle="Ajoutés / Sauvés"
            icon={TrendingUp}
            color="amber"
            trend={trends.tauxConversion?.dir}
            trendValue={trends.tauxConversion?.v}
          />
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <MonthlyLineChart selectedMonths={selectedMonths} selectedYear={selectedYear} />
          </div>
          <MissionPulse selectedMonths={selectedMonths} selectedYear={selectedYear} />
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SeminarsBarChart selectedMonths={selectedMonths} selectedYear={selectedYear} />
          <SavedVsAddedChart selectedMonths={selectedMonths} selectedYear={selectedYear} />
          <PieRepartition selectedMonths={selectedMonths} selectedYear={selectedYear} />
        </div>

        {/* ── YoY Comparison (only when no month filter) ── */}
        {!hasFilter && (
          <YoYChart yoy={yoy} />
        )}

        {/* ── Activities Table ── */}
        <ActivitiesTable selectedYear={selectedYear} />

        {/* ── Difficultés & Perspectives ── */}
        <DifficultesSection selectedYear={selectedYear} />

        <footer className={`text-center py-4 border-t text-[10px] transition-colors duration-300
          ${isDark ? 'border-slate-800/50 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          ALWM Dashboard · DAMF TOGO {selectedYear} · Données extraites des rapports officiels mensuels
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
