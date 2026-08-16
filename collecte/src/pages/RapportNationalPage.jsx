import React, { useState, useEffect } from 'react';
import {
  Plus, Send, CheckCircle, AlertCircle, Lock, Globe,
  MapPin, Activity, CalendarDays, Users, Banknote,
  Info, List, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPays, getActivitesNational, addActiviteNational } from '../api';

const MOIS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const ANNEES = [2024, 2025, 2026, 2027];
const TYPES_ACTIVITE_NATIONAL = [
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

export default function RapportNationalPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const isAdminAfrique = role === 'ADMIN_AFRIQUE' || role === 'ADMIN';

  const [paysList, setPaysList] = useState([]);
  const [selectedPays, setSelectedPays] = useState('');
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
    getPays()
      .then(d => {
        setPaysList(d);
        if (!isAdminAfrique && user?.pays_id) {
          setSelectedPays(String(user.pays_id));
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPays) return;
    setLoadingActivites(true);
    getActivitesNational({ pays_id: selectedPays, annee, mois })
      .then(setActivites)
      .catch(console.error)
      .finally(() => setLoadingActivites(false));
  }, [selectedPays, annee, mois]);

  const handleAddActivite = async (e) => {
    e.preventDefault();
    if (!selectedPays) { alert('Veuillez selectionner un pays.'); return; }
    setLoading(true); setStatus(null);
    try {
      await addActiviteNational({ ...newActivite, pays_id: selectedPays, annee, mois });
      setNewActivite(INITIAL_ACTIVITE);
      setShowForm(false);
      setStatus('success');
      setMessage('Activite nationale enregistree avec succes !');
      const updated = await getActivitesNational({ pays_id: selectedPays, annee, mois });
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
  const nomPays = paysList.find(p => String(p.id) === String(selectedPays))?.nom_pays;

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Activites et Rapport National</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Saisie et consultation des evenements propres a l echelon national
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black ${
          isAdminAfrique ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-blue-50 border-blue-300 text-blue-800'
        }`}>
          {isAdminAfrique ? <Globe size={12} /> : <Lock size={12} />}
          <span>{isAdminAfrique ? 'Acces global - Tous les pays' : ('Acces : ' + (user?.nom_pays || 'Mon pays'))}</span>
        </div>
      </div>

      <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
        <button onClick={() => setShowExplication(v => !v)} className="w-full flex items-center justify-between px-5 py-3 text-left">
          <div className="flex items-center gap-2.5 text-blue-800">
            <Info size={16} className="shrink-0" />
            <span className="text-xs font-extrabold">Comment fonctionne cette page ?</span>
          </div>
          {showExplication ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
        </button>
        {showExplication && (
          <div className="px-5 pb-4 space-y-2 text-xs text-blue-900 font-semibold border-t border-blue-200">
            <p className="pt-3">
              <strong>Cette page sert a enregistrer les activites a l echelle nationale</strong>
              {' '}(conferences nationales, assemblees generales, campagnes d evangelisation, etc.),
              distinctes des rapports d assemblee ou de district.
            </p>
            <ol className="space-y-1 pl-4 list-decimal">
              <li><strong>Selectionnez un pays, un mois et une annee</strong> - la liste des activites deja enregistrees s affiche automatiquement.</li>
              <li><strong>Cliquez sur "+ Enregistrer une activite"</strong> pour saisir un nouvel evenement sur cette periode.</li>
              <li>Chaque activite est independante : vous pouvez en ajouter autant que necessaire sur le meme mois.</li>
            </ol>
          </div>
        )}
      </div>

      <div className="card-sm">
        <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100">
          <List size={14} /> Identification de l Echelon et Periode
        </p>
        {!isAdminAfrique && (
          <div className="mb-4 flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-900 text-xs font-extrabold">
            <Lock size={14} className="text-blue-600 shrink-0" />
            Saisie verrouilee sur votre pays : <span className="text-blue-700 ml-1">{user?.nom_pays || 'Mon pays'}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Pays *</label>
            <select className={`input text-sm font-bold bg-slate-50 ${!isAdminAfrique ? 'opacity-75 cursor-not-allowed' : ''}`}
              value={selectedPays} onChange={e => setSelectedPays(e.target.value)} disabled={!isAdminAfrique}>
              {isAdminAfrique && <option value="">-- Selectionner un pays --</option>}
              {paysList.map(p => <option key={p.id} value={p.id}>{p.nom_pays}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mois</label>
            <select className="input text-sm font-bold bg-slate-50" value={mois} onChange={e => setMois(e.target.value)}>
              {MOIS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Annee</label>
            <select className="input text-sm font-bold bg-slate-50" value={annee} onChange={e => setAnnee(e.target.value)}>
              {ANNEES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        {selectedPays && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-700">
              <MapPin size={13} className="text-blue-500" />{nomPays}
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-700">
              <CalendarDays size={13} className="text-emerald-500" />{mois} {annee}
            </div>
            {loadingActivites ? (
              <span className="text-xs font-bold text-slate-400">Chargement...</span>
            ) : (
              <div className="flex items-center gap-2 bg-blue-700 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white">
                <Activity size={13} />{activites.length} activite{activites.length > 1 ? 's' : ''} enregistree{activites.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title">
            <Activity size={18} className="text-blue-600" />
            Activites Nationales &mdash; {selectedPays ? (nomPays + ', ' + mois + ' ' + annee) : 'Selectionnez un pays'}
          </p>
          <button onClick={() => setShowForm(v => !v)} disabled={!selectedPays} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus size={16} /> Enregistrer une activite
          </button>
        </div>

        {!selectedPays && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-400 text-sm font-semibold">
            <Info size={18} className="shrink-0 text-slate-300" />
            Selectionnez d abord un pays et une periode pour voir ou saisir les activites.
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAddActivite} className="bg-slate-50 rounded-lg p-3 mb-3 space-y-3 border border-blue-200 shadow-sm">
            <p className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} /> Nouvelle activite nationale &mdash; {nomPays}, {mois} {annee}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Date de l evenement</label>
                <input type="date" className="input text-sm font-bold" value={newActivite.date_activite} onChange={e => change('date_activite', e.target.value)} />
              </div>
              <div>
                <label className="label">Type d activite</label>
                <select className="input text-sm font-bold" value={newActivite.type_activite} onChange={e => change('type_activite', e.target.value)}>
                  {TYPES_ACTIVITE_NATIONAL.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nom de l activite *</label>
                <input className="input text-sm font-bold" required value={newActivite.nom_activite} onChange={e => change('nom_activite', e.target.value)} placeholder="Ex: Conference Nationale LWM" />
              </div>
              <div>
                <label className="label">Lieu</label>
                <input className="input text-sm font-bold" value={newActivite.lieu} onChange={e => change('lieu', e.target.value)} placeholder="Ex: Lome" />
              </div>
              <div>
                <label className="label">Nombre de jours</label>
                <input type="number" min="1" className="input text-sm font-bold" value={newActivite.nb_jours} onChange={e => change('nb_jours', parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <label className="label">Intervenant principal</label>
                <input className="input text-sm font-bold" value={newActivite.intervenant_principal} onChange={e => change('intervenant_principal', e.target.value)} placeholder="Ex: Pasteur National" />
              </div>
            </div>
            <div>
              <label className="label">Thème enseignement / Exhortation</label>
              <input className="input text-sm" value={newActivite.theme_module} onChange={e => change('theme_module', e.target.value)} placeholder="Ex: L Evangelisation en 2025" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Pasteur intervenant</label>
                <input className="input text-sm" value={newActivite.intervenant_principal} onChange={e => change('intervenant_principal', e.target.value)} placeholder="Ex: Pasteur National" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={13} /> Participants - Assistance</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[['Hommes', 'hommes'], ['Femmes', 'femmes'], ['Jeunes', 'jeunes'], ['Les plus jeunes', 'plus_jeunes'], ['Assistance Totale', 'assistance_totale']].map(([label, field]) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input type="number" min="0" className="input text-sm font-black" value={newActivite[field]} onChange={e => change(field, parseInt(e.target.value) || 0)} />
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
                Enregistrer l activite
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        )}

        {status === 'success' && (<div className="flex items-center gap-3 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 text-emerald-950 text-sm font-extrabold mb-4"><CheckCircle size={18} className="text-emerald-700" /> {message}</div>)}
        {status === 'error'   && (<div className="flex items-center gap-3 bg-rose-100 border border-rose-300 rounded-lg px-3 py-2 text-rose-900 text-sm font-extrabold mb-4"><AlertCircle size={18} className="text-rose-600" /> {message}</div>)}

        {selectedPays && activites.length > 0 && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-blue-800 flex items-center gap-2">
              <Users size={13} /> Total participants : <span className="text-blue-700 ml-1">{totalAssistance.toLocaleString('fr-FR')}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-emerald-800 flex items-center gap-2">
              <Banknote size={13} /> Total depenses : <span className="text-emerald-700 ml-1">{totalDepenses.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        {selectedPays && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr>{['Date', 'Type', "Nom de l activite", 'Lieu', 'Assistance', 'Depenses (FCFA)'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loadingActivites ? (
                  <tr><td colSpan={6} className="table-td text-center text-slate-400 py-4 font-bold">Chargement...</td></tr>
                ) : activites.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center text-slate-500 py-4 font-bold">Aucune activite enregistree pour {mois} {annee}</td></tr>
                ) : activites.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td text-slate-700 font-mono text-xs font-bold">{a.date_activite ? new Date(a.date_activite).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="table-td"><span className="badge bg-blue-100 text-blue-900 border border-blue-300 font-black">{a.type_activite}</span></td>
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