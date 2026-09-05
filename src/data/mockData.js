// ============================================================
// DONNÉES RÉELLES — DNMF TOGO 2024, 2025 & 2026
// Extraites depuis les rapports Word mensuels officiels
// 2026 : Janvier - Juillet (7 mois disponibles)
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

export const YEARS = [2024, 2025, 2026];

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
// Pour 2026 : comparaison Jan-Juil seulement (7 mois disponibles)
export const getYoYComparison = (refYear = 2025) => {
  const t2024 = computeAnnualTotals(2024);
  const t2025 = computeAnnualTotals(2025);
  const t2026 = computeAnnualTotals(2026);
  const pct = (a, b) => b > 0 ? (((a - b) / b) * 100).toFixed(1) : 'N/A';
  return {
    seminaires: {
      y2024: t2024.totalSeminaires,
      y2025: t2025.totalSeminaires,
      y2026: t2026.totalSeminaires,
      pct2425: pct(t2025.totalSeminaires, t2024.totalSeminaires),
      pct2526: pct(t2026.totalSeminaires, t2025.totalSeminaires),
      // Rétrocompat
      pct: pct(t2025.totalSeminaires, t2024.totalSeminaires),
    },
    assistance: {
      y2024: t2024.totalAssistance,
      y2025: t2025.totalAssistance,
      y2026: t2026.totalAssistance,
      pct2425: pct(t2025.totalAssistance, t2024.totalAssistance),
      pct2526: pct(t2026.totalAssistance, t2025.totalAssistance),
      pct: pct(t2025.totalAssistance, t2024.totalAssistance),
    },
    sauves: {
      y2024: t2024.totalSauves,
      y2025: t2025.totalSauves,
      y2026: t2026.totalSauves,
      pct2425: pct(t2025.totalSauves, t2024.totalSauves),
      pct2526: pct(t2026.totalSauves, t2025.totalSauves),
      pct: pct(t2025.totalSauves, t2024.totalSauves),
    },
    ajoutes: {
      y2024: t2024.totalAjoutes,
      y2025: t2025.totalAjoutes,
      y2026: t2026.totalAjoutes,
      pct2425: pct(t2025.totalAjoutes, t2024.totalAjoutes),
      pct2526: pct(t2026.totalAjoutes, t2025.totalAjoutes),
      pct: pct(t2025.totalAjoutes, t2024.totalAjoutes),
    },
  };
};

// ─── Métriques enrichies 2026 ─────────────────────────────────
// Invités, témoignages, baptisés, cellules (disponibles dès 2026)
export const getEnrichedMetrics = (year, monthNames = null) => {
  const data = getMonthlyData(year);
  const months = monthNames ? data.filter((d) => monthNames.includes(d.month)) : data;
  const total = (key) => months.reduce((s, m) => s + (m[key] || 0), 0);
  return {
    invites:    total('invites'),
    temoignages: total('temoignages'),
    baptises:   total('baptises'),
    cellules:   months.length > 0 ? (months[months.length - 1].cellules || 0) : 0,
    tauxInvitesSauves: (() => {
      const inv = total('invites');
      const sauv = total('sauves');
      return inv > 0 ? ((sauv / inv) * 100).toFixed(1) : '0.0';
    })(),
  };
};

// ─── Difficultés & Perspectives ─────────────────────────────────
// selectedMonths = [] → données annuelles dédupliquées
// selectedMonths = ['Janvier'] → données du mois spécifique
// Déduplication par les 60 premiers caractères (insensible à la casse)
export const getDifficultesData = (year, selectedMonths = []) => {
  const data = getMonthlyData(year);

  // 2024 : pas de données par mois → retour annuel brut
  if (year === 2024) {
    const yd = getYearData(year);
    return {
      difficultes: yd.difficultes || [],
      perspectives: yd.perspectives || [],
      hasMensuel: false,
    };
  }

  const months = selectedMonths.length > 0
    ? data.filter((m) => selectedMonths.includes(m.month))
    : data;

  const dedupe = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      if (!item || !item.trim()) return false;
      const key = item.trim().substring(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  if (selectedMonths.length === 1) {
    // Un seul mois : afficher les données de ce mois + indication du mois
    const m = months[0];
    return {
      difficultes: m?.difficultes_mois || [],
      perspectives: m?.perspectives_mois || [],
      hasMensuel: true,
      moisLabel: selectedMonths[0],
    };
  }

  // Plusieurs mois ou vue annuelle : dédupliquer sur l'union
  const allDiffs = months.flatMap((m) => m.difficultes_mois || []);
  const allPersps = months.flatMap((m) => m.perspectives_mois || []);
  return {
    difficultes: dedupe(allDiffs),
    perspectives: dedupe(allPersps),
    hasMensuel: true,
    moisLabel: null,
  };
};

// ─── Division Formation (SFA + SFD) ─────────────────────────────
// Disponible pour 2025 et 2026 uniquement
export const getDivisionFormation = (year, selectedMonths = []) => {
  if (year === 2024) return null;
  const data = getMonthlyData(year);
  const months = selectedMonths.length > 0
    ? data.filter((m) => selectedMonths.includes(m.month))
    : data;

  const sum = (key1, key2) => months.reduce((s, m) => {
    const df = m.division_formation || {};
    const section = df[key1] || {};
    return s + (section[key2] || 0);
  }, 0);

  const lastNonZeroDF = (key1, key2) => {
    for (let i = months.length - 1; i >= 0; i--) {
      const df = months[i].division_formation || {};
      const val = (df[key1] || {})[key2] || 0;
      if (val > 0) return val;
    }
    return 0;
  };

  return {
    hasDivisionFormation: true,
    sfa: {
      ecoles_ouvertes: lastNonZeroDF('sfa', 'ecoles_ouvertes'),
      eleves_inscrits: lastNonZeroDF('sfa', 'eleves_inscrits'),
      eleves_actuels: lastNonZeroDF('sfa', 'eleves_actuels'),
    },
    sfd_classique: {
      formations_classiques: sum('sfd_classique', 'formations_classiques'),
      sauves_formes: sum('sfd_classique', 'sauves_formes'),
      formateurs_nationaux: sum('sfd_classique', 'formateurs_nationaux'),
      formateurs_internationaux: sum('sfd_classique', 'formateurs_internationaux'),
    },
    sfd_diverses: {
      formations_diverses: sum('sfd_diverses', 'formations_diverses'),
      renforcements_capacite: sum('sfd_diverses', 'renforcements_capacite'),
      leaders_renforces: sum('sfd_diverses', 'leaders_renforces'),
      hommes_formes: sum('sfd_diverses', 'hommes_formes'),
      femmes_formees: sum('sfd_diverses', 'femmes_formees'),
      jeunes_formes: sum('sfd_diverses', 'jeunes_formes'),
    },
  };
};

// ─── Mois ayant des formations SFC ou SFD ─────────────────────────
// Retourne la liste des mois (avec label et type) qui ont eu des formations
export const getFormationMonths = (year) => {
  if (year === 2024) return [];
  const data = getMonthlyData(year);
  const result = [];
  for (const m of data) {
    const df = m.division_formation || {};
    const sfc = (df.sfd_classique || {}).formations_classiques || 0;
    const sfd = (df.sfd_diverses || {}).formations_diverses || 0;
    if (sfc > 0 || sfd > 0) {
      result.push({
        month: m.month,
        hasSFC: sfc > 0,
        hasSFD: sfd > 0,
        sfcCount: sfc,
        sfdCount: sfd,
      });
    }
  }
  return result;
};

// ─── Activités réelles (séminaires par mois) ─────────────────────
// Structure par mois depuis les données réelles — PAS de données générées
// selectedMonths = [] → tous les mois avec données
export const getActivitiesReal = (year, selectedMonths = []) => {
  const data = getMonthlyData(year);
  const months = (selectedMonths.length > 0
    ? data.filter((m) => selectedMonths.includes(m.month))
    : data
  ).filter((m) => m.sem_total > 0 || m.sauves > 0 || m.assistance > 0);

  const SERVICES = ['SCE - Séminaires', 'SPGFM - Mission', 'SFA - Formation'];

  return months.flatMap((m, mi) => {
    const rows = [];
    // Ligne principale : séminaires du mois
    rows.push({
      id: `${year}-${m.monthIndex}-mission`,
      date: `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-01`,
      month: m.month,
      division: 'Mission',
      service: 'SCE - Séminaires',
      sem_assemblees: m.sem_assemblees || 0,
      sem_hors: m.sem_hors || 0,
      sem_total: m.sem_total || 0,
      assistance: m.assistance || 0,
      invites: m.invites || 0,
      sauves: m.sauves || 0,
      ajoutes: m.ajoutes || 0,
      temoignages: m.temoignages || 0,
      baptises: m.baptises || 0,
      membres: m.membres || 0,
    });

    // Ligne Formation si données disponibles
    const df = m.division_formation;
    if (df && year !== 2024) {
      const sfc = df.sfd_classique || {};
      const sfd = df.sfd_diverses || {};
      if ((sfc.formations_classiques || 0) > 0 || (sfd.formations_diverses || 0) > 0) {
        rows.push({
          id: `${year}-${m.monthIndex}-formation`,
          date: `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-15`,
          month: m.month,
          division: 'Formation',
          service: 'SFD - Formation',
          sem_assemblees: 0,
          sem_hors: 0,
          sem_total: (sfc.formations_classiques || 0) + (sfd.formations_diverses || 0),
          assistance: sfc.sauves_formes || 0,
          invites: 0,
          sauves: sfc.sauves_formes || 0,
          ajoutes: 0,
          temoignages: 0,
          baptises: 0,
          membres: 0,
        });
      }
    }
    return rows;
  });
};

