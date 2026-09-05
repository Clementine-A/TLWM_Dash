import React, { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, Info,
  BarChart2, Activity, Users, BookOpen,
  ChevronDown, ChevronUp, Zap, Target, Award,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import useStore from '../store/useStore';
import { getMonthlyData, computeAnnualTotals } from '../data/mockData';

// ── Helpers ────────────────────────────────────────────────────────
const pct = (a, b) => b > 0 ? (((a - b) / b) * 100) : null;
const fmt = (n, dec = 1) => Number(n).toFixed(dec);
const fmtN = (n) => Math.round(n).toLocaleString('fr-FR');

const TrendBadge = ({ value, isDark, inverse = false }) => {
  if (value === null || isNaN(value)) return <span className="text-slate-500 text-xs">—</span>;
  const positive = inverse ? value < 0 : value >= 0;
  const Icon = value > 0.5 ? TrendingUp : value < -0.5 ? TrendingDown : Minus;
  const color = positive
    ? isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'
    : isDark ? 'text-rose-400 bg-rose-500/10' : 'text-rose-600 bg-rose-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <Icon size={10} />
      {value > 0 ? '+' : ''}{fmt(value)}%
    </span>
  );
};

const SignalCard = ({ type, title, message, detail, isDark }) => {
  const config = {
    success: {
      icon: CheckCircle,
      border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      bg: isDark ? 'bg-emerald-500/5' : 'bg-emerald-50',
      icon_color: isDark ? 'text-emerald-400' : 'text-emerald-600',
      title_color: isDark ? 'text-emerald-300' : 'text-emerald-700',
    },
    warning: {
      icon: AlertTriangle,
      border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      bg: isDark ? 'bg-amber-500/5' : 'bg-amber-50',
      icon_color: isDark ? 'text-amber-400' : 'text-amber-600',
      title_color: isDark ? 'text-amber-300' : 'text-amber-700',
    },
    info: {
      icon: Info,
      border: isDark ? 'border-cyan-500/30' : 'border-sky-200',
      bg: isDark ? 'bg-cyan-500/5' : 'bg-sky-50',
      icon_color: isDark ? 'text-cyan-400' : 'text-sky-600',
      title_color: isDark ? 'text-cyan-300' : 'text-sky-700',
    },
    alert: {
      icon: AlertTriangle,
      border: isDark ? 'border-rose-500/30' : 'border-rose-200',
      bg: isDark ? 'bg-rose-500/5' : 'bg-rose-50',
      icon_color: isDark ? 'text-rose-400' : 'text-rose-600',
      title_color: isDark ? 'text-rose-300' : 'text-rose-700',
    },
  };
  const c = config[type] || config.info;
  const Icon = c.icon;
  return (
    <div className={`rounded-xl border p-3.5 ${c.border} ${c.bg}`}>
      <div className="flex items-start gap-2.5">
        <Icon size={14} className={`mt-0.5 flex-shrink-0 ${c.icon_color}`} />
        <div>
          <p className={`text-xs font-bold mb-0.5 ${c.title_color}`}>{title}</p>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{message}</p>
          {detail && (
            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Spark Line inline ──────────────────────────────────────────────
const SparkLine = ({ data, color = '#06b6d4' }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const H = 36;
  const W = 1000; // viewBox large — SVG s'étire
  const step = W / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${H - ((v - min) / range) * H}`)
    .join(' ');
  const last = data[data.length - 1];
  const lx = (data.length - 1) * step;
  const ly = H - ((last - min) / range) * H;
  return (
    <svg
      viewBox={`0 0 ${W} ${H + 6}`}
      preserveAspectRatio="none"
      className="w-full opacity-80"
      style={{ height: 36 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="18"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="18" fill={color} />
    </svg>
  );
};

// ── Composant principal ────────────────────────────────────────────
const InsightsPanel = () => {
  const { theme } = useStore();
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | signals | seasonality | radar

  // ── Calculs ──
  const metrics = useMemo(() => {
    const y = [2024, 2025, 2026].map((year) => {
      const data = getMonthlyData(year);
      const filled = data.filter((m) => (m.sem_total || 0) > 0 || (m.sauves || 0) > 0);
      const t = computeAnnualTotals(year);
      const lastMem = [...filled].reverse().find((m) => (m.membres || 0) > 0);
      const lastAss = [...filled].reverse().find((m) => (m.assemblees_count || 0) > 0);
      const lastCell = [...filled].reverse().find((m) => (m.cellules || 0) > 0);
      const firstCell = filled.find((m) => (m.cellules || 0) > 0);
      const sem = t.totalSeminaires;
      const ass = t.totalAssistance;
      const sauv = t.totalSauves;
      const aj = t.totalAjoutes;
      const nMois = filled.length;
      return {
        year,
        nMois,
        sem, ass, sauv, aj,
        membres: lastMem?.membres || 0,
        assemblees: lastAss?.assemblees_count || 0,
        cellules: lastCell?.cellules || 0,
        cellulesDebut: firstCell?.cellules || 0,
        convRate: sauv > 0 ? (aj / sauv) * 100 : 0,
        assPerSem: sem > 0 ? ass / sem : 0,
        sauvPerSem: sem > 0 ? sauv / sem : 0,
        semPerMois: nMois > 0 ? sem / nMois : 0,
        // Meilleur mois
        bestMonth: filled.reduce((b, m) => ((m.sauves || 0) > (b.sauves || 0) ? m : b), filled[0] || {}),
        monthlyData: filled,
      };
    });

    const [y24, y25, y26] = y;

    // Tendances 2024→2025
    const t2425 = {
      sem:   pct(y25.sem,  y24.sem),
      ass:   pct(y25.ass,  y24.ass),
      sauv:  pct(y25.sauv, y24.sauv),
      aj:    pct(y25.aj,   y24.aj),
      aps:   pct(y25.assPerSem, y24.assPerSem),
      conv:  pct(y25.convRate,  y24.convRate),
    };
    // Tendances 2025→2026 (annualisé 7→12 mois pour la comparabilité)
    const factor = 12 / y26.nMois; // annualisation 2026
    const y26ann = {
      sem: y26.sem * factor, ass: y26.ass * factor,
      sauv: y26.sauv * factor, aj: y26.aj * factor,
      assPerSem: y26.assPerSem, convRate: y26.convRate,
    };
    const t2526 = {
      sem:   pct(y26ann.sem,  y25.sem),
      ass:   pct(y26ann.ass,  y25.ass),
      sauv:  pct(y26ann.sauv, y25.sauv),
      aj:    pct(y26ann.aj,   y25.aj),
      aps:   pct(y26ann.assPerSem, y25.assPerSem),
      conv:  pct(y26.convRate, y25.convRate),
    };

    // Saisonnalité — meilleurs/pires mois sur 2024+2025
    const monthAgg = {};
    [y24, y25].forEach(({ monthlyData }) => {
      monthlyData.forEach((m) => {
        if (!monthAgg[m.month]) monthAgg[m.month] = { sauv: 0, sem: 0, count: 0 };
        monthAgg[m.month].sauv += m.sauves || 0;
        monthAgg[m.month].sem += m.sem_total || 0;
        monthAgg[m.month].count += 1;
      });
    });
    const monthRanking = Object.entries(monthAgg)
      .map(([month, v]) => ({
        month,
        avgSauves: v.count > 0 ? v.sauv / v.count : 0,
        avgSem: v.count > 0 ? v.sem / v.count : 0,
      }))
      .sort((a, b) => b.avgSauves - a.avgSauves);

    // Sparklines mensuelles (sauvés par mois 2024/2025/2026)
    const MONTH_ORDER = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const sparkSauves = {
      2024: MONTH_ORDER.map((mn) => {
        const m = y24.monthlyData.find((d) => d.month === mn);
        return m ? (m.sauves || 0) : 0;
      }),
      2025: MONTH_ORDER.map((mn) => {
        const m = y25.monthlyData.find((d) => d.month === mn);
        return m ? (m.sauves || 0) : 0;
      }),
      2026: MONTH_ORDER.slice(0, 7).map((mn) => {
        const m = y26.monthlyData.find((d) => d.month === mn);
        return m ? (m.sauves || 0) : 0;
      }),
    };

    // Radar data (0-100 normalisé vs 2024 = base)
    const radarData = [
      { metric: 'Séminaires', '2024': 100, '2025': fmt(y25.sem / y24.sem * 100, 0), '2026': fmt(y26ann.sem / y24.sem * 100, 0) },
      { metric: 'Assistance', '2024': 100, '2025': fmt(y25.ass / y24.ass * 100, 0), '2026': fmt(y26ann.ass / y24.ass * 100, 0) },
      { metric: 'Sauvés', '2024': 100, '2025': fmt(y25.sauv / y24.sauv * 100, 0), '2026': fmt(y26ann.sauv / y24.sauv * 100, 0) },
      { metric: 'Conv.%', '2024': 100, '2025': fmt(y25.convRate / y24.convRate * 100, 0), '2026': fmt(y26.convRate / y24.convRate * 100, 0) },
      { metric: 'Eff/Sém', '2024': 100, '2025': fmt(y25.assPerSem / y24.assPerSem * 100, 0), '2026': fmt(y26.assPerSem / y24.assPerSem * 100, 0) },
    ];

    // Signals automatiques
    const signals = [];

    // Signal cellules
    if (y26.cellules > 0 && y26.cellulesDebut > 0) {
      const cellGrowth = pct(y26.cellules, y26.cellulesDebut);
      signals.push({
        type: 'success',
        title: `Cellules +${fmt(cellGrowth)}% en 7 mois (${y26.cellulesDebut}→${y26.cellules})`,
        message: 'La stratégie de décentralisation par cellules fonctionne très bien. Une cellule = un point d\'ancrage local auto-géré.',
        detail: 'Objectif : maintenir ce rythme pour atteindre ~70 cellules d\'ici fin 2026.',
      });
    }

    // Signal membres
    if (y25.membres > 0 && y26.membres > 0) {
      const memGrowth = pct(y26.membres, y25.membres);
      signals.push({
        type: 'success',
        title: `Membres +${fmt(memGrowth)}% (${fmtN(y25.membres)}→${fmtN(y26.membres)} en 7 mois)`,
        message: 'La base communautaire croît de façon stable et soutenue. C\'est le signe d\'une bonne rétention des convertis.',
        detail: `Projection fin 2026 : ~${fmtN(y25.membres + (y26.membres - y25.membres) * 12/7)} membres si la tendance se maintient.`,
      });
    }

    // Signal conversion 2026 vs 2025
    if (t2526.conv !== null) {
      if (t2526.conv > 5) {
        signals.push({
          type: 'success',
          title: `Taux de conversion en hausse : ${fmt(y26.convRate)}% vs ${fmt(y25.convRate)}% en 2025`,
          message: 'Plus de personnes sauvées rejoignent maintenant l\'église. La qualité du suivi post-conversion s\'améliore.',
          detail: 'Lien direct probable avec les formations SFD (renforcement des capacités des leaders).',
        });
      }
    }

    // Signal assistance/séminaire
    if (t2526.aps !== null && t2526.aps < -10) {
      signals.push({
        type: 'warning',
        title: `Audience/séminaire en baisse continue : ${fmt(y24.assPerSem)}→${fmt(y25.assPerSem)}→${fmt(y26.assPerSem)} pers/sem`,
        message: 'Chaque séminaire touche moins de personnes. Deux explications possibles : expansion vers des zones moins denses (signe positif d\'expansion) ou fatigue de l\'audience (risque à surveiller).',
        detail: 'Recommandation : analyser la répartition géographique des séminaires. Si les nouvelles zones sont rurales, c\'est normal.',
      });
    }

    // Signal saisonnalité
    signals.push({
      type: 'info',
      title: `Août est le mois record systématiquement (${fmtN(monthRanking[0]?.avgSauves || 0)} sauvés/an en moy.)`,
      message: 'L\'effet vacances scolaires concentre l\'audience et les ressources humaines. C\'est un levier stratégique sous-exploité.',
      detail: 'Recommandation : planifier 30% de ressources supplémentaires en juillet-août (missionnaires, matériel, budget).',
    });

    // Signal missionnaires
    if (y25.monthlyData.some((m) => (m.miss_nationaux || 0) > 0)) {
      const missStat = y25.monthlyData.find((m) => (m.miss_nationaux || 0) > 0);
      if (missStat && missStat.miss_nationaux < 40) {
        signals.push({
          type: 'alert',
          title: `Effectif missionnaire limité : ${missStat.miss_nationaux} nationaux actifs`,
          message: 'Avec ~120 assemblées à couvrir, le ratio est de 1 missionnaire pour 3+ assemblées. Les difficultés récurrentes (indisponibilité, manque de transport) en découlent directement.',
          detail: 'C\'est le goulot d\'étranglement principal de la croissance. Doubler les missionnaires nationaux = doubler l\'impact potentiel.',
        });
      }
    }

    return { y24, y25, y26, t2425, t2526, monthRanking, sparkSauves, radarData, signals, y26ann };
  }, []);

  const { y24, y25, y26, t2425, t2526, monthRanking, sparkSauves, radarData, signals } = metrics;

  const card = `theme-transition backdrop-blur border rounded-2xl
    ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`;

  const tabBtn = (id, label, Icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
        ${activeTab === id
          ? isDark ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-brand-100 text-brand-700 border border-brand-200'
          : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
        }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  const MetricRow = ({ label, v24, v25, v26, trend2425, trend2526, format = fmtN, inverse = false }) => (
    <div className={`flex items-center gap-2 py-2.5 border-b text-xs last:border-0
      ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
      <span className={`flex-1 min-w-0 truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
      <span className={`w-20 text-right font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{format(v24)}</span>
      <span className={`w-20 text-right font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{format(v25)}</span>
      <div className="w-16 flex justify-end">
        <TrendBadge value={trend2425} isDark={isDark} inverse={inverse} />
      </div>
      <span className={`w-20 text-right font-mono ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>{format(v26)}*</span>
      <div className="w-16 flex justify-end">
        <TrendBadge value={trend2526} isDark={isDark} inverse={inverse} />
      </div>
    </div>
  );

  return (
    <div className={card}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b
        ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-cyan-500/15' : 'bg-cyan-50'}`}>
            <Zap size={14} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Analyse - Insights 2024 / 2025 / 2026
            </h3>
            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              DNMF TOGO · *2026 : Janvier - Juillet (7 mois)
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors
            ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabBtn('overview', 'Vue d\'ensemble', BarChart2)}
            {tabBtn('signals', `Signaux (${signals.length})`, Activity)}
            {tabBtn('seasonality', 'Saisonnalité', Target)}
            {tabBtn('radar', 'Radar 3 ans', Award)}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* En-tête colonnes */}
              <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider pb-1 border-b
                ${isDark ? 'border-slate-700/50 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                <span className="flex-1">Indicateur</span>
                <span className="w-20 text-right">2024</span>
                <span className="w-20 text-right">2025</span>
                <span className="w-16 text-right">Δ</span>
                <span className="w-20 text-right">2026*</span>
                <span className="w-16 text-right">Δ ann.</span>
              </div>

              {/* Métriques mission */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1
                  ${isDark ? 'text-cyan-500' : 'text-cyan-700'}`}>
                  I. Division Mission
                </p>
                <MetricRow label="Séminaires" v24={y24.sem} v25={y25.sem} v26={y26.sem}
                  trend2425={t2425.sem} trend2526={t2526.sem} />
                <MetricRow label="Assistance totale" v24={y24.ass} v25={y25.ass} v26={y26.ass}
                  trend2425={t2425.ass} trend2526={t2526.ass} />
                <MetricRow label="Personnes sauvées" v24={y24.sauv} v25={y25.sauv} v26={y26.sauv}
                  trend2425={t2425.sauv} trend2526={t2526.sauv} />
                <MetricRow label="Ajoutés à l'église" v24={y24.aj} v25={y25.aj} v26={y26.aj}
                  trend2425={t2425.aj} trend2526={t2526.aj} />
              </div>

              {/* Métriques d'efficacité */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1
                  ${isDark ? 'text-violet-500' : 'text-violet-700'}`}>
                  Efficacité opérationnelle
                </p>
                <MetricRow
                  label="Assistance / séminaire"
                  v24={y24.assPerSem} v25={y25.assPerSem} v26={y26.assPerSem}
                  trend2425={t2425.aps} trend2526={t2526.aps}
                  format={(v) => fmt(v, 1)}
                  inverse={true}
                />
                <MetricRow
                  label="Sauvés / séminaire"
                  v24={y24.sauvPerSem} v25={y25.sauvPerSem} v26={y26.sauvPerSem}
                  trend2425={pct(y25.sauvPerSem, y24.sauvPerSem)}
                  trend2526={pct(y26.sauvPerSem, y25.sauvPerSem)}
                  format={(v) => fmt(v, 1)}
                />
                <MetricRow
                  label="Taux de conversion (%)"
                  v24={y24.convRate} v25={y25.convRate} v26={y26.convRate}
                  trend2425={t2425.conv} trend2526={t2526.conv}
                  format={(v) => `${fmt(v)}%`}
                />
              </div>

              {/* Métriques structurelles */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1
                  ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>
                  Structure & croissance
                </p>
                <MetricRow label="Membres (fin de période)"
                  v24={y24.membres || '—'} v25={y25.membres} v26={y26.membres}
                  trend2425={pct(y25.membres, y24.membres)}
                  trend2526={pct(y26.membres, y25.membres)}
                  format={(v) => typeof v === 'number' ? fmtN(v) : v}
                />
                <MetricRow label="Assemblées actives"
                  v24={y24.assemblees || '—'} v25={y25.assemblees} v26={y26.assemblees}
                  trend2425={pct(y25.assemblees, y24.assemblees)}
                  trend2526={pct(y26.assemblees, y25.assemblees)}
                  format={(v) => typeof v === 'number' ? fmtN(v) : v}
                />
                {y26.cellules > 0 && (
                  <MetricRow label="Cellules actives (2026)"
                    v24={'—'} v25={'—'} v26={y26.cellules}
                    trend2425={null} trend2526={pct(y26.cellules, y26.cellulesDebut)}
                    format={(v) => typeof v === 'number' ? fmtN(v) : v}
                  />
                )}
              </div>

              {/* Sparklines — pleine largeur */}
              <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-700/50 bg-navy-900/30' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Courbe des sauvés par mois
                </p>
                <div className="space-y-3">
                  {[
                    { year: 2024, color: '#475569', label: '2024' },
                    { year: 2025, color: '#06b6d4', label: '2025' },
                    { year: 2026, color: '#a78bfa', label: '2026 (Jan-Juil)' },
                  ].map(({ year, color, label }) => (
                    <div key={year} className="grid grid-cols-[80px_1fr] items-center gap-2">
                      <span style={{ color }} className="text-[10px] font-bold">{label}</span>
                      <SparkLine data={sparkSauves[year]} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: SIGNALS ── */}
          {activeTab === 'signals' && (
            <div className="space-y-3">
              {signals.map((s, i) => (
                <SignalCard key={i} {...s} isDark={isDark} />
              ))}
            </div>
          )}

          {/* ── TAB: SAISONNALITÉ ── */}
          {activeTab === 'seasonality' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                {monthRanking.map((m, rank) => {
                  const max = monthRanking[0].avgSauves;
                  const bar = max > 0 ? (m.avgSauves / max) * 100 : 0;
                  const isTop = rank < 3;
                  const isBot = rank >= monthRanking.length - 3;
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className={`text-[11px] w-20 flex-shrink-0 font-medium
                        ${isTop ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                          : isBot ? (isDark ? 'text-rose-400' : 'text-rose-500')
                          : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                        {m.month.substring(0, 3)}.
                      </span>
                      <div className="flex-1 h-4 rounded-full overflow-hidden bg-slate-800/20 dark:bg-slate-700/40">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${bar}%`,
                            background: isTop
                              ? 'linear-gradient(90deg, #059669, #34d399)'
                              : isBot
                              ? 'linear-gradient(90deg, #9f1239, #f43f5e)'
                              : 'linear-gradient(90deg, #475569, #64748b)',
                          }}
                        />
                      </div>
                      <span className={`text-[11px] w-24 text-right font-bold
                        ${isTop ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                          : isBot ? (isDark ? 'text-rose-400' : 'text-rose-500')
                          : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                        {fmtN(m.avgSauves)} sauvés
                      </span>
                      {isTop && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase
                        ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>TOP</span>}
                      {isBot && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase
                        ${isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>BAS</span>}
                    </div>
                  );
                })}
              </div>
              <div className={`rounded-xl border p-3.5 ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  Implication strategique
                </p>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Les mois Juillet-Aout representent systematiquement le pic d'activite.
                  Planifier les formations SFD et les missions terrain sur Juin-Aout
                  maximise le retour sur investissement humain et financier.
                </p>
              </div>
            </div>
          )}

          {/* TAB: RADAR */}
          {activeTab === 'radar' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">

                {/* Graphique */}
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                      <PolarGrid stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }}
                      />
                      <Radar name="2024" dataKey="2024" stroke="#475569" fill="#475569" fillOpacity={0.1} strokeWidth={1.5} />
                      <Radar name="2025" dataKey="2025" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                      <Radar name="2026" dataKey="2026" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                          borderRadius: 10,
                          fontSize: 11,
                        }}
                        formatter={(v, name) => [`${v} pts`, name]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 text-xs mt-1">
                    {[
                      { label: '2024 (reference)', color: '#475569' },
                      { label: '2025', color: '#06b6d4' },
                      { label: '2026 proj.', color: '#a78bfa' },
                    ].map(({ label, color }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interprétation */}
                <div className="space-y-2.5">
                  <p className={`text-xs font-bold uppercase tracking-wider
                    ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Interpretation
                  </p>
                  {[
                    {
                      axis: 'Séminaires',
                      color: '#06b6d4',
                      text: `2025 dépasse 2024 - le rythme terrain s'intensifie d'année en année. Plus de séminaires = plus de présence.`,
                    },
                    {
                      axis: 'Assistance',
                      color: '#7c3aed',
                      text: `En retrait vs 2024 - chaque séminaire touche moins de personnes. La couverture s'élargit vers des zones moins denses.`,
                    },
                    {
                      axis: 'Sauvés',
                      color: '#059669',
                      text: `Légère baisse en 2025 vs 2024, mais la projection 2026 montre un redressement fort grâce à l'amélioration du suivi.`,
                    },
                    {
                      axis: 'Conv. %',
                      color: '#d97706',
                      text: `2026 est au-dessus de 2024 sur cet axe - signe que les personnes sauvées sont mieux intégrées. Impact direct des formations.`,
                    },
                    {
                      axis: 'Eff/Sém',
                      color: '#be123c',
                      text: `Axe en contraction - l'efficacité par séminaire baisse. Point de vigilance à surveiller pour optimiser les ressources terrain.`,
                    },
                  ].map(({ axis, color, text }) => (
                    <div key={axis} className={`rounded-lg border p-2.5
                      ${isDark ? 'bg-navy-700/30 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-bold mb-0.5" style={{ color }}>{axis}</p>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
