import React, { useState, useMemo } from 'react';
import { getMonthlyData, DISTRICTS } from '../data/mockData';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import useStore from '../store/useStore';

const ROWS_PER_PAGE = 8;

// Generate activity rows from monthly data (since we don't have per-activity data in real files)
const generateActivities = (monthlyData) => {
  const activities = [];
  let id = 1;
  monthlyData
    .filter((m) => m.sauves > 0 || m.sem_total > 0)
    .forEach((month) => {
      // Generate 2-4 activities per month based on real monthly totals
      const districts = ['Lomé', 'Kpalimé', 'Atakpamé', 'Sokodé', 'Kara', 'Dapaong'];
      const programmes = [
        'Croisade Évangélique', 'Séminaire District', 'Mission Terrain',
        'Formation Prédicateurs', 'Évangélisation de Masse', 'Séminaire Biblique',
      ];
      const semPerDistrict = Math.round(month.sem_total / 3);
      const assistPerDistrict = Math.round(month.assistance / 3);
      const objectif = Math.round(assistPerDistrict * 0.85);

      for (let i = 0; i < Math.min(3, month.sem_total > 0 ? 3 : 0); i++) {
        const districtIndex = (month.monthIndex + i) % districts.length;
        const dateDay = 5 + i * 8;
        const date = `${month.year}-${String(month.monthIndex + 1).padStart(2, '0')}-${String(Math.min(dateDay, 28)).padStart(2, '0')}`;
        activities.push({
          id: id++,
          date,
          month: month.month,
          district: districts[districtIndex],
          programme: programmes[(month.monthIndex + i) % programmes.length],
          objectif: Math.max(objectif, 50),
          assistance: Math.max(Math.round(assistPerDistrict * (0.85 + i * 0.1)), 30),
          sauves: Math.round(month.sauves / 3),
          ajoutes: Math.round(month.ajoutes / 3),
        });
      }
    });
  return activities;
};

const ActivitiesTable = ({ selectedYear }) => {
  const { selectedMonths, selectedDistrict, setDistrict, theme } = useStore();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const allActivities = useMemo(() => {
    const monthlyData = getMonthlyData(selectedYear || 2024);
    return generateActivities(monthlyData);
  }, [selectedYear]);

  const filtered = useMemo(() => {
    let rows = allActivities;
    if (selectedMonths.length > 0) rows = rows.filter((r) => selectedMonths.includes(r.month));
    if (selectedDistrict) rows = rows.filter((r) => r.district === selectedDistrict);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.programme.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.month.toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allActivities, selectedMonths, selectedDistrict, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortIcon = ({ col }) => sortKey === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronDown size={12} className="opacity-30" />;

  return (
    <div className={`theme-transition backdrop-blur border rounded-2xl p-5
      ${isDark ? 'bg-navy-800/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-widest mb-4
        ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Activités Terrain — {selectedYear}
      </h3>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`w-full border rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none transition-colors
              ${isDark
                ? 'bg-navy-700/60 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500/60'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-brand-400'
              }`}
          />
        </div>
        {/* Filtre district uniquement - les mois sont gérés depuis la sidebar */}
        <select
          value={selectedDistrict || ''}
          onChange={(e) => { setDistrict(e.target.value || null); setPage(1); }}
          className={`border rounded-lg px-3 py-2 text-xs cursor-pointer focus:outline-none
            ${isDark
              ? 'bg-navy-700/60 border-slate-700 text-slate-300 focus:border-cyan-500/60'
              : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-brand-400'
            }`}
        >
          <option value="">Tous les districts</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className={`border-b ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
              {[
                { key: 'date', label: 'Date' },
                { key: 'district', label: 'District' },
                { key: 'programme', label: 'Programme' },
                { key: 'sauves', label: 'Sauvés' },
                { key: 'ajoutes', label: 'Ajoutés' },
                { key: 'assistance', label: 'Assistance' },
              ].map((col) => (
                <th key={col.label} onClick={() => handleSort(col.key)}
                  className={`text-left py-3 px-3 font-semibold uppercase tracking-wider cursor-pointer transition-colors
                    ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}>
                  <span className="flex items-center gap-1">{col.label} <SortIcon col={col.key} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={6} className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aucune activité trouvée</td></tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id} className={`border-b transition-colors
                  ${isDark
                    ? `border-slate-800/40 hover:bg-slate-700/20 ${i % 2 !== 0 ? 'bg-navy-700/10' : ''}`
                    : `border-slate-100 hover:bg-brand-50/50 ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`
                  }`}>
                  <td className={`py-2.5 px-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {new Date(row.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold
                      ${isDark
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-brand-100 text-brand-700 border border-brand-200'
                      }`}>
                      {row.district}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-medium max-w-[180px] truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{row.programme}</td>
                  <td className="py-2.5 px-3 text-violet-500 font-semibold text-right">{row.sauves.toLocaleString('fr-FR')}</td>
                  <td className="py-2.5 px-3 text-emerald-500 font-semibold text-right">{row.ajoutes.toLocaleString('fr-FR')}</td>
                  <td className={`py-2.5 px-3 text-right ${isDark ? 'text-cyan-400' : 'text-sky-600'}`}>{row.assistance.toLocaleString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{filtered.length} activité{filtered.length > 1 ? 's' : ''} · Page {page}/{totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className={`px-3 py-1 text-xs rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed transition-all
                ${isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-brand-700 hover:border-brand-300'
                }`}>
              ‹ Préc
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2;
              if (pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all
                    ${pg === page
                      ? isDark
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-brand-500 border-brand-500 text-white'
                      : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-brand-700 hover:border-brand-300'
                    }`}>
                  {pg}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`px-3 py-1 text-xs rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed transition-all
                ${isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-brand-700 hover:border-brand-300'
                }`}>
              Suiv ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesTable;
