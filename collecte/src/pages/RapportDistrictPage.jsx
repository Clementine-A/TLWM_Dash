import React, { useState, useEffect } from 'react';
import {
  Plus, Send, CheckCircle, AlertCircle, Lock, Globe,
  MapPin, Activity, CalendarDays, Users, Banknote,
  Info, List, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDistricts, getActivitesDistrict, addActiviteDistrict } from '../api';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const ANNEES = [2024, 2025, 2026, 2027];
const TYPES_ACTIVITE = [
  'QG', 'Culte d\'ensemble', 'Hommes', 'Femmes', 'Jeunes', 'Plus Jeunes',
  'Mission', 'Séminaire', 'Urgence',
  'Retraite Femmes', 'Retraite Hommes', 'Retraite Jeunes', 'Retraite Plus Jeunes'
];
const INITIAL_ACTIVITE = {
  date_activite: '', type_activite: 'QG', nom_activite: '',
  lieu: '', nb_jours: 1, intervenant_principal: '', theme_module: '',
  hommes: 0, femmes: 0, jeunes: 0, plus_jeunes: 0, assistance_totale: 0,
  observations: '',
};

export default function RapportDistrictPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const isLockedDistrict = role === 'SUPERVISEUR_DISTRICT' || role === 'SUPERVISEUR';

  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [mois, setMois] = useState(MOIS[new Date().getMonth()]);
  const [activites, setActivites] = useState([]);
  const [newActivite, setNewActivite] = useState(INITIAL_ACTIVITE);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingActivites, setLoadingActivites] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showExplication, setShowExplication] = useState(false);

  useEffect(() => {
    getDistricts()
      .then(d => {
        setDistricts(d);
        if (isLockedDistrict && user?.district_id) {
          setSelectedDistrict(String(user.district_id));
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    setLoadingActivites(true);
    getActivitesDistrict({ district_id: selectedDistrict, annee, mois })
      .then(setActivites)
      .catch(console.error)
      .finally(() => setLoadingActivites(false));
  }, [selectedDistrict, annee, mois]);

  const handleAddActivite = async (e) => {
    e.preventDefault();
    if (!selectedDistrict) { alert('Veuillez sélectionner un district.'); return; }
    setLoading(true);
    setStatus(null);
    try {
      await addActiviteDistrict({ ...newActivite, district_id: selectedDistrict, annee, mois });
      setNewActivite(INITIAL_ACTIVITE);
      setShowForm(false);
      setStatus('success');
      setMessage('Activité enregistrée avec succès !');
      const updated = await getActivitesDistrict({ district_id: selectedDistrict, annee, mois });
      setActivites(updated);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const change = (field, value) => setNewActivite(p => ({ ...p, [field]: value }));

  const totalAssistance = activites.reduce((s, a) => s + (a.assistance_totale || 0), 0);
  const totalDepenses   = activites.reduce((s, a) => s + Number(a.depenses_fcfa || 0), 0);
  const nomDistrict = districts.find(d => String(d.id) === String(selectedDistrict))?.nom_district;

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-5">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Activités & Rapport du District</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Saisie et consultation des événements propres à l'échelon du district
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black ${
          isLockedDistrict ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          {isLockedDistrict ? <Lock size={12} /> : <Globe size={12} />}
          <span>
            {isLockedDistrict ? `Accès : ${user?.nom_district || 'Mon district'}` : 'Accès global - Tous les districts'}
          </span>
        </div>
      </div>

      <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
        <button
          onClick={() => setShowExplication(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <div className="flex items-center gap-2.5 text-blue-800">
            <Info size={16} className="shrink-0" />
            <span className="text-xs font-extrabold">Comment fonctionne cette page ?</span>
          </div>
          {showExplication ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
        </button>
        {showExplication && (
          <div className="px-5 pb-4 space-y-2 text-xs text-blue-900 font-semibold border-t border-blue-200">
            <p className="pt-3">
              <strong>Cette page sert à enregistrer les activités spécifiques au niveau du district</strong>
              {' '}(formations, CPPD, réunions de pasteurs, évangélisations inter-assemblées, etc.),
              distinctes des rapports mensuels de chaque assemblée.
            </p>
            <ol className="space-y-1 pl-4 list-decimal">
              <li><strong>Sélectionnez un district, un mois et une année</strong> - la liste des activités déjà enregistrées s'affiche automatiquement.</li>
              <li><strong>Cliquez sur "+ Enregistrer une activité"</strong> pour saisir un nouvel événement sur cette période.</li>
              <li>Chaque activité est indépendante : vous pouvez en ajouter autant que nécessaire sur le même mois.</li>
              <li>Les données <strong>ne sont pas calculées automatiquement</strong> - chaque superviseur de district les saisit manuellement après chaque événement.</li>
            </ol>
          </div>
        )}
      </div>

      <div className="card-sm">
        <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100">
          <List size={14} /> Identification de l'Échelon & Période
        </p>
        {isLockedDistrict && (
          <div className="mb-4 flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-900 text-xs font-extrabold">
            <Lock size={14} className="text-blue-600 shrink-0" />
            Saisie verrouillée sur votre district :
            <span className="text-blue-700 ml-1">{user?.nom_district || `District #${user?.district_id}`}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">District *</label>
            <select
              className={`input text-sm font-bold bg-slate-50 ${isLockedDistrict ? 'opacity-75 cursor-not-allowed' : ''}`}
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              disabled={isLockedDistrict}
            >
              {!isLockedDistrict && <option value="">-- Sélectionner le district --</option>}
              {districts.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mois</label>
            <select className="input text-sm font-bold bg-slate-50" value={mois} onChange={e => setMois(e.target.value)}>
              {MOIS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Année</label>
            <select className="input text-sm font-bold bg-slate-50" value={annee} onChange={e => setAnnee(e.target.value)}>
              {ANNEES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {selectedDistrict && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-700">
              <MapPin size={13} className="text-blue-500" />
              {nomDistrict}
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-700">
              <CalendarDays size={13} className="text-emerald-500" />
              {mois} {annee}
            </div>
            {loadingActivites ? (
              <span className="text-xs font-bold text-slate-400">Chargement...</span>
            ) : (
              <div className="flex items-center gap-2 bg-blue-700 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white">
                <Activity size={13} />
                {activites.length} activité{activites.length > 1 ? 's' : ''} enregistrée{activites.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title">
            <Activity size={18} className="text-blue-600" />
            Activités du District - {selectedDistrict ? `${nomDistrict}, ${mois} ${annee}` : 'Sélectionnez un district'}
          </p>
          <button
            onClick={() => setShowForm(v => !v)}
            disabled={!selectedDistrict}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Enregistrer une activité
          </button>
        </div>

        {!selectedDistrict && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-400 text-sm font-semibold">
            <Info size={18} className="shrink-0 text-slate-300" />
            Sélectionnez d'abord un district et une période pour voir ou saisir les activités.
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAddActivite} className="bg-slate-50 rounded-lg p-3 mb-3 space-y-3 border border-blue-200 shadow-sm">
            <p className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} /> Nouvelle activité - {nomDistrict}, {mois} {annee}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Date de l'événement</label>
                <input type="date" className="input text-sm font-bold" value={newActivite.date_activite}
                  onChange={e => change('date_activite', e.target.value)} />
              </div>
              <div>
                <label className="label">Type d'activité</label>
                <select className="input text-sm font-bold" value={newActivite.type_activite}
                  onChange={e => change('type_activite', e.target.value)}>
                  {TYPES_ACTIVITE.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nom de l'activité *</label>
                <input className="input text-sm font-bold" required value={newActivite.nom_activite}
                  onChange={e => change('nom_activite', e.target.value)}
                  placeholder="Ex: École des Prédicateurs" />
              </div>
              <div>
                <label className="label">Lieu</label>
                <input className="input text-sm font-bold" value={newActivite.lieu}
                  onChange={e => change('lieu', e.target.value)} placeholder="Ex: Sokodé Centre" />
              </div>
              <div>
                <label className="label">Nombre de jours</label>
                <input type="number" min="1" className="input text-sm font-bold" value={newActivite.nb_jours}
                  onChange={e => change('nb_jours', parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <label className="label">Intervenant principal</label>
                <input className="input text-sm font-bold" value={newActivite.intervenant_principal}
                  onChange={e => change('intervenant_principal', e.target.value)}
                  placeholder="Ex: Pasteur Superviseur" />
              </div>
            </div>

            <div>
              <label className="label">Thème enseignement / Exhortation</label>
              <input className="input text-sm" value={newActivite.theme_module}
                onChange={e => change('theme_module', e.target.value)}
                placeholder="Ex: L'Évangélisation efficace" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Pasteur intervenant</label>
                <input className="input text-sm" value={newActivite.intervenant_principal}
                  onChange={e => change('intervenant_principal', e.target.value)}
                  placeholder="Ex: Pasteur Superviseur" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users size={13} /> Participants - Assistance
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[['Hommes', 'hommes'], ['Femmes', 'femmes'], ['Jeunes', 'jeunes'], ['Les plus jeunes', 'plus_jeunes'], ['Assistance Totale', 'assistance_totale']].map(([label, field]) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input type="number" min="0" className="input text-sm font-black"
                      value={newActivite[field]}
                      onChange={e => change(field, parseInt(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Observations</label>
              <textarea className="input text-sm" rows={2} value={newActivite.observations}
                onChange={e => change('observations', e.target.value)}
                placeholder="Notes, remarques..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                Enregistrer l'activité
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-3 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 text-emerald-950 text-sm font-extrabold mb-4">
            <CheckCircle size={18} className="text-emerald-700" /> {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-3 bg-rose-100 border border-rose-300 rounded-lg px-3 py-2 text-rose-900 text-sm font-extrabold mb-4">
            <AlertCircle size={18} className="text-rose-600" /> {message}
          </div>
        )}

        {selectedDistrict && activites.length > 0 && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-blue-800 flex items-center gap-2">
              <Users size={13} /> Total participants : <span className="text-blue-700 ml-1">{totalAssistance.toLocaleString('fr-FR')}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-emerald-800 flex items-center gap-2">
              <Banknote size={13} /> Total dépenses : <span className="text-emerald-700 ml-1">{totalDepenses.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        {selectedDistrict && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Type', "Nom de l'activité", 'Lieu', 'Assistance', 'Dépenses (FCFA)'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingActivites ? (
                  <tr><td colSpan={6} className="table-td text-center text-slate-400 py-4 font-bold">Chargement...</td></tr>
                ) : activites.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center text-slate-500 py-4 font-bold">
                    Aucune activité enregistrée pour {mois} {annee} - cliquez sur "+ Enregistrer une activité" pour en ajouter.
                  </td></tr>
                ) : activites.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td text-slate-700 font-mono text-xs font-bold">
                      {a.date_activite ? new Date(a.date_activite).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="table-td">
                      <span className="badge bg-blue-100 text-blue-900 border border-blue-300 font-black">{a.type_activite}</span>
                    </td>
                    <td className="table-td font-black text-slate-900">{a.nom_activite}</td>
                    <td className="table-td text-slate-700 font-bold">{a.lieu || '-'}</td>
                    <td className="table-td font-black text-emerald-800">{(a.assistance_totale || 0).toLocaleString('fr-FR')}</td>
                    <td className="table-td font-black text-slate-900">{Number(a.depenses_fcfa || 0).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}