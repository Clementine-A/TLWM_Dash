// ============================================================
// DONNÉES RÉELLES — DNMF TOGO 2024 & 2025
// Extraites automatiquement depuis les rapports Word mensuels
// ============================================================

import rawData from './realData.json';

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Abréviations françaises correctes pour les axes de graphiques
export const MONTH_ABBR = {
  'Janvier':   'Jan',
  'Février':   'Fév',
  'Mars':      'Mar',
  'Avril':     'Avr',
  'Mai':       'Mai',
  'Juin':      'Juin',
  'Juillet':   'Juil',
  'Août':      'Août',
  'Septembre': 'Sep',
  'Octobre':   'Oct',
  'Novembre':  'Nov',
  'Décembre':  'Déc',
};

// Helper: retourne l'abréviation correcte du mois
export const shortMonth = (monthName) => MONTH_ABBR[monthName] || monthName.substring(0, 3);

export const YEARS = [2024, 2025];

export const DISTRICTS = [
  'Lomé', 'Kpalimé', 'Atakpamé', 'Sokodé', 'Kara', 'Dapaong',
  'Notsé', 'Tsévié', 'Aného', 'Vogan', 'Bassar',
];

// ─── Compute data for given year ─────────────────────────────
export const getYearData = (year) => {
  const key = String(year);
  return rawData[key] || rawData['2024'];
};

export const getMonthlyData = (year) => {
  return getYearData(year).monthlyData || [];
};

// ─── Filter by month ─────────────────────────────────────────
export const getMonthData = (year, monthName) => {
  const data = getMonthlyData(year);
  if (!monthName) return data;
  return data.filter((d) => d.month === monthName);
};

// ─── Annual totals ────────────────────────────────────────────
export const computeAnnualTotals = (year) => {
  const data = getMonthlyData(year);
  const filled = data.filter((m) => m.sauves > 0 || m.sem_total > 0);
  const totalSeminaires = filled.reduce((s, m) => s + (m.sem_total || 0), 0);
  const totalAssistance = filled.reduce((s, m) => s + (m.assistance || 0), 0);
  const totalSauves     = filled.reduce((s, m) => s + (m.sauves || 0), 0);
  const totalAjoutes    = filled.reduce((s, m) => s + (m.ajoutes || 0), 0);
  return {
    totalSeminaires,
    totalAssistance,
    totalSauves,
    totalAjoutes,
    tauxConversion: totalSauves > 0 ? ((totalAjoutes / totalSauves) * 100).toFixed(1) : '0.0',
  };
};

// ─── Human resources (best known value per field) ────────────
export const getHumanResources = (year) => {
  const data = getMonthlyData(year);
  const reversed = [...data].reverse();

  // For each HR field, find the last month that has a non-zero value
  const lastNonZero = (key) => {
    const m = reversed.find((d) => (d[key] || 0) > 0);
    return m ? m[key] : 0;
  };

  return {
    predicateurs: lastNonZero('predicateurs'),
    elevesPredicateurs: lastNonZero('eleves_inscrits') || lastNonZero('eleves_actuels'),
    missionnaireNationaux: lastNonZero('miss_nationaux'),
    missionnaireInternationaux: lastNonZero('miss_internationaux'),
    pasteurs: lastNonZero('pasteurs'),
    membres: lastNonZero('membres'),
    assemblees: lastNonZero('assemblees_count'),
    districts: lastNonZero('districts'),
  };
};

// ─── Pie data ─────────────────────────────────────────────────
export const getPieData = (year, monthName) => {
  const data = getMonthlyData(year);
  const months = monthName ? data.filter((d) => d.month === monthName) : data;
  const totalAss  = months.reduce((s, m) => s + (m.sem_assemblees || 0), 0);
  const totalHors = months.reduce((s, m) => s + (m.sem_hors || 0), 0);
  return [
    { name: 'En assemblées', value: totalAss,  color: '#06b6d4' },
    { name: 'Hors assemblées', value: totalHors, color: '#8b5cf6' },
  ];
};

// ─── Year-over-year comparison ────────────────────────────────
export const getYoYComparison = () => {
  const t2024 = computeAnnualTotals(2024);
  const t2025 = computeAnnualTotals(2025);
  const pct = (a, b) => b > 0 ? (((a - b) / b) * 100).toFixed(1) : 'N/A';
  return {
    seminaires: { y2024: t2024.totalSeminaires, y2025: t2025.totalSeminaires, pct: pct(t2025.totalSeminaires, t2024.totalSeminaires) },
    assistance:  { y2024: t2024.totalAssistance, y2025: t2025.totalAssistance, pct: pct(t2025.totalAssistance, t2024.totalAssistance) },
    sauves:      { y2024: t2024.totalSauves, y2025: t2025.totalSauves, pct: pct(t2025.totalSauves, t2024.totalSauves) },
    ajoutes:     { y2024: t2024.totalAjoutes, y2025: t2025.totalAjoutes, pct: pct(t2025.totalAjoutes, t2024.totalAjoutes) },
  };
};

// ─── Difficulties & Perspectives ────────────────────────────
export const getDifficultesData = (year) => {
  const yd = getYearData(year);
  return {
    difficultes: yd.difficultes || [],
    perspectives: yd.perspectives || [],
  };
};
