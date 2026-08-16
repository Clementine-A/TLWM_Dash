import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, CheckCircle, Clock, BarChart3, Globe, Lock, Banknote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDistricts, getAssemblees, getRapportsAssemblee } from '../api';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const canSeeAllPays = role === 'ADMIN_AFRIQUE' || role === 'ADMIN';
  const isLockedDistrict = role === 'SUPERVISEUR_DISTRICT' || role === 'SUPERVISEUR';

  const [districts, setDistricts] = useState([]);
  const [assemblees, setAssemblees] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [mois, setMois] = useState(MOIS[new Date().getMonth()]);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee]);

  async function loadAll() {
    setLoading(true);
    try {
      // Filtrer selon le rôle : ADMIN_PAYS voit son pays, SUPERVISEUR son district
      const paysFilter    = canSeeAllPays ? undefined : user?.pays_id;
      const districtFilter = isLockedDistrict ? user?.district_id : undefined;

      const [d, a, r] = await Promise.all([
        getDistricts(paysFilter),
        getAssemblees(districtFilter),
        getRapportsAssemblee({ annee, mois }),
      ]);
      setDistricts(d);
      setAssemblees(a);
      // Filtrer les rapports selon la portée de l'utilisateur
      let filteredR = r;
      if (isLockedDistrict && user?.district_id) {
        const aIds = new Set(a.map(as => as.id));
        filteredR = r.filter(rp => aIds.has(rp.assemblee_id));
      }
      setRapports(filteredR);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }


  // Stats agrégées
  const totalSauves = rapports.reduce((s, r) => s + (r.sauves || 0), 0);
  const totalSeminaires = rapports.reduce((s, r) => s + (r.sem_total || 0), 0);
  const totalMembres = rapports.reduce((s, r) => s + (r.membres_actifs || 0), 0);

  // Statut des rapports par assemblée
  const rapportIds = new Set(rapports.map(r => r.assemblee_id));
  const assembleesAvecRapport = assemblees.filter(a => rapportIds.has(a.id));
  const assembleesSansRapport = assemblees.filter(a => !rapportIds.has(a.id));
  const tauxCompletion = assemblees.length > 0
    ? Math.round((assembleesAvecRapport.length / assemblees.length) * 100)
    : 0;

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header avec choix mois/année */}
      <div className="card flex items-center justify-between flex-wrap gap-3 border-2 border-slate-300">
        <div>
          <h1 className="text-lg font-black text-slate-900">Tableau de Bord National</h1>
          <p className="text-slate-600 text-sm font-bold mt-0.5">Suivi consolidé des activités missionnaires et réceptions des rapports</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="label">Mois</label>
            <select className="input text-sm font-bold bg-slate-50 w-36" value={mois} onChange={e => setMois(e.target.value)}>
              {MOIS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Année</label>
            <select className="input text-sm font-bold bg-slate-50 w-28" value={annee} onChange={e => setAnnee(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs avec couleurs riches et fort contraste */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard icon={Building2} label="Total Assemblées" value={assemblees.length} color="blue" />
        <KPICard icon={CheckCircle} label="Rapports Reçus" value={`${assembleesAvecRapport.length}/${assemblees.length}`} color="emerald" sub={`${tauxCompletion}% complétés`} />
        <KPICard icon={TrendingUp} label="Personnes Sauvées" value={totalSauves} color="indigo" />
        <KPICard icon={Users} label="Membres Actifs" value={totalMembres.toLocaleString('fr-FR')} color="amber" />
        <KPICard icon={BarChart3} label="Séminaires" value={totalSeminaires} color="rose" />
      </div>

      {/* Taux de complétion et listes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title"><BarChart3 size={18} className="text-blue-600" /> Réception des Rapports - {mois} {annee}</p>
          <span className={`badge text-sm px-3.5 py-1 ${tauxCompletion === 100 ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400' : tauxCompletion >= 60 ? 'bg-amber-100 text-amber-900 border-2 border-amber-400' : 'bg-rose-100 text-rose-900 border-2 border-rose-400'}`}>
            {tauxCompletion}% Complétés
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden border border-slate-300">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tauxCompletion === 100 ? 'bg-emerald-600' : tauxCompletion >= 60 ? 'bg-amber-500' : 'bg-rose-600'}`}
            style={{ width: `${tauxCompletion}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Assemblées ayant rendu */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-700" /> Rapports Reçus ({assembleesAvecRapport.length})
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {assembleesAvecRapport.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white border border-emerald-300 rounded-xl px-3.5 py-2 shadow-sm">
                  <span className="text-sm font-extrabold text-slate-900 truncate">{a.nom_assemblee}</span>
                  <span className="text-xs font-black text-emerald-900 shrink-0 ml-2 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">{a.nom_district}</span>
                </div>
              ))}
              {assembleesAvecRapport.length === 0 && (
                <p className="text-xs font-bold text-slate-600 p-4 text-center">Aucun rapport reçu pour {mois} {annee}</p>
              )}
            </div>
          </div>

          {/* Assemblées en attente */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-4">
            <p className="text-xs font-black text-rose-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={16} className="text-rose-700" /> En attente de rapport ({assembleesSansRapport.length})
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {assembleesSansRapport.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white border border-rose-300 rounded-xl px-3.5 py-2 shadow-sm">
                  <span className="text-sm font-extrabold text-slate-900 truncate">{a.nom_assemblee}</span>
                  <span className="text-xs font-black text-slate-700 shrink-0 ml-2 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">{a.nom_district}</span>
                </div>
              ))}
              {assembleesSansRapport.length === 0 && (
                <p className="text-xs font-black text-emerald-800 p-4 text-center">🎉 Excellent ! Toutes les assemblées ont transmis leur rapport.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Finances consolidées */}
      <div className="card">
        <p className="section-title"><Banknote size={18} className="text-emerald-600" /> Synthèse Financière Consolidée - {mois} {annee}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Recettes (Offrandes+Dîmes)', value: rapports.reduce((s, r) => s + Number(r.offrandes || 0) + Number(r.dimes || 0), 0), bg: 'bg-blue-50 border-2 border-blue-300 text-blue-950' },
            { label: 'Dépenses Fonctionnement', value: rapports.reduce((s, r) => s + Number(r.depenses_fonctionnement || 0), 0), bg: 'bg-slate-100 border-2 border-slate-300 text-slate-950' },
            { label: 'Dépenses Mission', value: rapports.reduce((s, r) => s + Number(r.depenses_mission || 0), 0), bg: 'bg-purple-50 border-2 border-purple-300 text-purple-950' },
            {
              label: 'Solde Net Conservé',
              value: rapports.reduce((s, r) => s + Number(r.offrandes || 0) + Number(r.dimes || 0) - Number(r.depenses_fonctionnement || 0) - Number(r.depenses_mission || 0), 0),
              isBalance: true,
              bg: 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950'
            },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`rounded-lg p-4 border ${bg} shadow-sm`}>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-black">
                {value.toLocaleString('fr-FR')} <span className="text-xs font-bold opacity-75">FCFA</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, sub }) {
  const styles = {
    blue: 'bg-blue-50 border-2 border-blue-300 text-blue-950 icon-text-blue-700',
    emerald: 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950 icon-text-emerald-700',
    indigo: 'bg-indigo-50 border-2 border-indigo-300 text-indigo-950 icon-text-indigo-700',
    amber: 'bg-amber-50 border-2 border-amber-300 text-amber-950 icon-text-amber-700',
    rose: 'bg-rose-50 border-2 border-rose-300 text-rose-950 icon-text-rose-700',
  };
  return (
    <div className={`${styles[color].split(' ').slice(0, 3).join(' ')} rounded-lg p-4 shadow-sm`}>
      <Icon size={22} className="text-blue-800 mb-2" />
      <p className="text-lg font-black tracking-tight text-slate-900">{value}</p>
      <p className="text-xs font-black text-slate-700 mt-1 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs font-extrabold text-emerald-800 mt-1">{sub}</p>}
    </div>
  );
}
