import React, { useState, useEffect, useCallback } from 'react';
import {
  Send, CheckCircle, AlertCircle, Lock, Globe, List, BookOpen,
  Users, Banknote, Activity, Plus, Pencil, Trash2, X, ChevronDown,
  ChevronUp, History, FileText, Star, UserPlus, Search, Check, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getDistricts, getAssemblees, getPays,
  getRapportsAssemblee, submitRapportAssembleeComplet, getRapportsAssembleeHistorique,
  getActivites, addActivite, updateActivite, deleteActivite,
  getFinancesAssemblee, saveFinancesAssemblee,
  getComite, addComiteMembre, updateComiteMembre, deleteComiteMembre,
  getMembres, addMembre, updateMembre, deleteMembre
} from '../api';

const MOIS = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const ANNEES = [2024, 2025, 2026, 2027];
const TYPES_ACTIVITE = ['Culte', 'Ecole de base', 'Pri\u00e8re', 'S\u00e9minaire', 'Urgence', 'Formations', 'R\u00e9union Mensuelles'];
const FONCTIONS_COMITE = [
  'Pasteur principal','Pasteur principal adjoint','Conseiller',
  'Secretaire principal(e)','Secretaire adjoint(e)',
  'Porte parole mission','Porte parole Famille','Porte parole Finance',
  'Porte parole Art et Culture','Porte parole Communication',
  'Porte parole Protocole','Porte parole Patrimoine'
];

const INIT_RAPPORT = {
  assemblee_id:'', annee: new Date().getFullYear(), mois: MOIS[new Date().getMonth()],
  assistance_totale:0, sauves:0, ajoutes:0, invites:0, temoignages:0,
  sem_assemblees:0, sem_hors:0, cultes_tenus:0, seminaires_tenus:0, formations_tenues:0,
  membres_actifs:0, membres_nouveaux:0, membres_transferes_entrants:0,
  membres_transferes_sortants:0, membres_decedes:0, pasteurs:0, predicateurs:0,
  offrandes:0, dimes:0, bp:0, dovocoq:0, autres_liberalites:0,
  depenses_seminaires:0, depenses_fonctionnement:0, depenses_mission:0, remontee_district:0,
  reussites:'', difficultes:'', besoins:'', perspectives:''
};

const INIT_MEMBRE = {
  nom:'', prenoms:'', sexe:'', contact:'', statut_membre:'Actif', type_membre:'Membre',
  date_salut:'', date_bapteme:'', division_ga:'', situation_matrimoniale:'',
  nbre_enfants:0, conjoint_sauve:'Non', quartier:'', activite_assemblee:'',
  profession:'', assiduite:'Moyen', actif_liberalites:'Non',
  date_entree_assemblee:'', date_mutation:'', ancienne_assemblee:'', notes:''
};
const INIT_COMITE = { fonction: FONCTIONS_COMITE[0], nom:'', prenoms:'', contact:'', date_entree_fonction:'' };

function NumField({ label, field, form, onChange, isFloat }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" step={isFloat ? '0.01' : '1'} min="0"
        className="input text-xs font-extrabold"
        value={form[field] ?? 0}
        onChange={e => onChange(field, isFloat ? parseFloat(e.target.value)||0 : parseInt(e.target.value)||0)}
        placeholder="0" />
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="card-sm">
      <p className="card-title">{icon}{title}</p>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, size = 'xl' }) {
  const maxW = size === '2xl' ? 'max-w-2xl' : size === 'lg' ? 'max-w-lg' : 'max-w-xl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-lg shadow-md w-full ${maxW} max-h-[90vh] overflow-y-auto border border-slate-200`}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} className="text-slate-600" /></button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

export default function RapportAssembleePage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const isLockedAsm  = role === 'RAPPORTEUR_ASSEMBLEE' || role === 'RAPPORTEUR';
  const isLockedDist = role === 'SUPERVISEUR_DISTRICT' || role === 'SUPERVISEUR';
  const isAdminPays  = role === 'ADMIN_PAYS';
  const isAdminAf    = role === 'ADMIN_AFRIQUE' || role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('synthese');
  const [paysList, setPaysList] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [assemblees, setAssemblees] = useState([]);
  const [selPays, setSelPays] = useState('');
  const [selDistrict, setSelDistrict] = useState('');
  const [selAssemblee, setSelAssemblee] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [mois, setMois] = useState(MOIS[new Date().getMonth()]);
  const [toast, setToast] = useState(null);

  const nomAsm = assemblees.find(a => String(a.id) === String(selAssemblee))?.nom_assemblee || '';

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      const pays = await getPays().catch(() => []);
      setPaysList(pays);
      if (!isAdminAf && user?.pays_id) setSelPays(String(user.pays_id));
      const dists = await getDistricts(isAdminAf ? undefined : user?.pays_id).catch(() => []);
      setDistricts(dists);
      if (isLockedDist && user?.district_id) setSelDistrict(String(user.district_id));
      const asms = await getAssemblees(isLockedDist ? user?.district_id : undefined).catch(() => []);
      setAssemblees(asms);
      if (isLockedAsm && user?.assemblee_id) setSelAssemblee(String(user.assemblee_id));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDistricts = selPays ? districts.filter(d => String(d.pays_id) === String(selPays)) : districts;
  const filteredAssemblees = selDistrict ? assemblees.filter(a => String(a.district_id) === String(selDistrict)) : assemblees;

  const TABS = [
    { id: 'synthese',  label: 'Synthese Mensuelle', icon: <FileText size={14} /> },
    { id: 'activites', label: 'Activites',           icon: <Activity size={14} /> },
    { id: 'finances',  label: 'Finances',             icon: <Banknote size={14} /> },
    { id: 'membres',   label: 'Membres',              icon: <Users size={14} /> },
    { id: 'comite',    label: 'Comite',               icon: <Star size={14} /> },
  ];

  return (
    <div className="p-3 max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Rapport Assemblee</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">Synthese mensuelle, activites, finances, membres et comite</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black ${isLockedAsm ? 'bg-slate-100 border-slate-300 text-slate-700' : isLockedDist ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
          {isLockedAsm ? <Lock size={12}/> : <Globe size={12}/>}
          {isLockedAsm && ('Acces : ' + (user?.nom_assemblee || 'Mon assemblee'))}
          {isLockedDist && ('District : ' + (user?.nom_district || 'Mon district'))}
          {isAdminPays && ('Pays : ' + (user?.nom_pays || 'Mon pays'))}
          {isAdminAf && 'Acces global'}
        </div>
      </div>

      <div className="card-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(isAdminAf || isAdminPays) && (
            <div>
              <label className="label">Pays</label>
              <select className="input text-xs font-bold bg-slate-50" value={selPays}
                onChange={e => { setSelPays(e.target.value); setSelDistrict(''); setSelAssemblee(''); }}
                disabled={isAdminPays}>
                {isAdminAf && <option value="">Tous les pays</option>}
                {paysList.map(p => <option key={p.id} value={p.id}>{p.nom_pays}</option>)}
              </select>
            </div>
          )}
          {!isLockedAsm && (
            <div>
              <label className="label">District</label>
              <select className="input text-xs font-bold bg-slate-50" value={selDistrict}
                onChange={e => { setSelDistrict(e.target.value); setSelAssemblee(''); }} disabled={isLockedDist}>
                {!isLockedDist && <option value="">Tous</option>}
                {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Assemblee *</label>
            <select className={`input text-xs font-bold bg-slate-50 ${isLockedAsm ? 'opacity-75 cursor-not-allowed' : ''}`}
              value={selAssemblee} onChange={e => setSelAssemblee(e.target.value)} disabled={isLockedAsm}>
              {!isLockedAsm && <option value="">- Selectionner -</option>}
              {filteredAssemblees.map(a => <option key={a.id} value={a.id}>{a.nom_assemblee}</option>)}
              {isLockedAsm && assemblees.length === 0 && <option value={user?.assemblee_id}>{user?.nom_assemblee}</option>}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Mois</label>
              <select className="input text-xs font-bold bg-slate-50" value={mois} onChange={e => setMois(e.target.value)}>
                {MOIS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Annee</label>
              <select className="input text-xs font-bold bg-slate-50" value={annee} onChange={e => setAnnee(e.target.value)}>
                {ANNEES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
        {selAssemblee && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="bg-blue-700 text-white text-[11px] font-black px-3 py-1 rounded-xl">{nomAsm}</span>
            <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-3 py-1 rounded-xl">{mois} {annee}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap border-b border-slate-200">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-extrabold transition-all border-b-2 ${activeTab === tab.id ? 'bg-white border-blue-700 text-blue-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {!selAssemblee && activeTab !== 'synthese' && (
        <div className="card-sm text-center py-10 text-slate-400 text-sm font-semibold">
          Selectionnez une assemblee pour acceder a cet onglet
        </div>
      )}

      {activeTab === 'synthese' && (
        <OngletSynthese assemblee_id={selAssemblee} annee={annee} mois={mois} nomAsm={nomAsm} showToast={showToast} />
      )}
      {activeTab === 'activites' && selAssemblee && (
        <OngletActivites assemblee_id={selAssemblee} annee={annee} mois={mois} nomAsm={nomAsm} showToast={showToast} />
      )}
      {activeTab === 'finances' && selAssemblee && (
        <OngletFinances assemblee_id={selAssemblee} annee={annee} mois={mois} nomAsm={nomAsm} showToast={showToast} />
      )}
      {activeTab === 'membres' && selAssemblee && (
        <OngletMembres assemblee_id={selAssemblee} nomAsm={nomAsm} showToast={showToast} />
      )}
      {activeTab === 'comite' && selAssemblee && (
        <OngletComite assemblee_id={selAssemblee} nomAsm={nomAsm} showToast={showToast} />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-3 py-3 rounded-lg shadow-md text-sm font-black flex items-center gap-2 ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function OngletSynthese({ assemblee_id, annee, mois, nomAsm, showToast }) {
  const [form, setForm] = useState(INIT_RAPPORT);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [showHisto, setShowHisto] = useState(false);
  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    if (!assemblee_id) return;
    getRapportsAssemblee({ assemblee_id, annee, mois })
      .then(r => {
        if (r.length > 0) { setExisting(r[0]); setForm(p => ({ ...p, ...r[0], assemblee_id })); }
        else { setExisting(null); setForm({ ...INIT_RAPPORT, assemblee_id }); }
      }).catch(() => {});
  }, [assemblee_id, annee, mois]);

  useEffect(() => {
    if (!assemblee_id || !showHisto) return;
    getRapportsAssembleeHistorique({ assemblee_id }).then(setHistorique).catch(() => {});
  }, [assemblee_id, showHisto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assemblee_id) { showToast('Selectionnez une assemblee', false); return; }
    setLoading(true);
    try {
      await submitRapportAssembleeComplet({ ...form, assemblee_id, annee, mois });
      showToast('Rapport ' + mois + ' ' + annee + ' enregistre !');
      setExisting({ id: 1 });
    } catch (err) { showToast(err.message, false); }
    finally { setLoading(false); }
  };

  const tauxConv = form.sauves > 0 ? ((form.ajoutes / form.sauves) * 100).toFixed(1) : 0;
  const totalRecettes = (parseFloat(form.offrandes)||0) + (parseFloat(form.dimes)||0) + (parseFloat(form.bp)||0) + (parseFloat(form.dovocoq)||0) + (parseFloat(form.autres_liberalites)||0);

  return (
    <div className="space-y-4">
      {!assemblee_id && (
        <div className="card-sm text-center py-10 text-slate-400 text-sm font-semibold">
          Selectionnez une assemblee et une periode pour saisir le rapport mensuel
        </div>
      )}
      {assemblee_id && (
        <>
          {existing && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-amber-900 text-xs font-extrabold">
              <AlertCircle size={14} className="text-amber-600 shrink-0"/>
              Un rapport existe deja pour {mois} {annee}. Modification en cours.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="card-sm">
              <p className="card-title"><Activity size={14} className="text-blue-600 mr-1.5 inline"/>Totaux Mission du Mois</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumField label="Assistance totale" field="assistance_totale" form={form} onChange={ch}/>
                <NumField label="Personnes sauvees" field="sauves" form={form} onChange={ch}/>
                <NumField label="Ajoutes a l Eglise" field="ajoutes" form={form} onChange={ch}/>
                <NumField label="Temoignages" field="temoignages" form={form} onChange={ch}/>
                <NumField label="Invites amenes" field="invites" form={form} onChange={ch}/>
                <div>
                  <label className="label">Taux de conversion</label>
                  <div className="input text-xs font-black bg-blue-50 text-blue-800 cursor-default">{tauxConv}%</div>
                </div>
              </div>
            </div>
            <div className="card-sm">
              <p className="card-title"><BookOpen size={14} className="text-purple-600 mr-1.5 inline"/>Activites du Mois</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <NumField label="Seminaires en asm." field="sem_assemblees" form={form} onChange={ch}/>
                <NumField label="Seminaires hors asm." field="sem_hors" form={form} onChange={ch}/>
                <NumField label="Cultes tenus" field="cultes_tenus" form={form} onChange={ch}/>
                <NumField label="Seminaires tenus" field="seminaires_tenus" form={form} onChange={ch}/>
                <NumField label="Formations tenues" field="formations_tenues" form={form} onChange={ch}/>
              </div>
            </div>
            <div className="card-sm">
              <p className="card-title"><Users size={14} className="text-indigo-600 mr-1.5 inline"/>Ressources Humaines</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumField label="Membres actifs (fin mois)" field="membres_actifs" form={form} onChange={ch}/>
                <NumField label="Membres nouveaux" field="membres_nouveaux" form={form} onChange={ch}/>
                <NumField label="Transferes entrants" field="membres_transferes_entrants" form={form} onChange={ch}/>
                <NumField label="Transferes sortants" field="membres_transferes_sortants" form={form} onChange={ch}/>
                <NumField label="Decedes ce mois" field="membres_decedes" form={form} onChange={ch}/>
                <NumField label="Nb. de pasteurs" field="pasteurs" form={form} onChange={ch}/>
                <NumField label="Predicateurs accredites" field="predicateurs" form={form} onChange={ch}/>
              </div>
            </div>
            <div className="card-sm">
              <p className="card-title"><Banknote size={14} className="text-emerald-600 mr-1.5 inline"/>Finances du Mois (FCFA)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <NumField label="Offrandes" field="offrandes" form={form} onChange={ch} isFloat/>
                <NumField label="Dimes" field="dimes" form={form} onChange={ch} isFloat/>
                <NumField label="BP" field="bp" form={form} onChange={ch} isFloat/>
                <NumField label="DOVOCOQ" field="dovocoq" form={form} onChange={ch} isFloat/>
                <NumField label="Autres liberalites" field="autres_liberalites" form={form} onChange={ch} isFloat/>
              </div>
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-emerald-900 text-xs font-black">
                TOTAL RECETTES : {totalRecettes.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <NumField label="Depenses seminaires" field="depenses_seminaires" form={form} onChange={ch} isFloat/>
                <NumField label="Depenses locales" field="depenses_fonctionnement" form={form} onChange={ch} isFloat/>
                <NumField label="Depenses mission" field="depenses_mission" form={form} onChange={ch} isFloat/>
                <NumField label="Remontee au District" field="remontee_district" form={form} onChange={ch} isFloat/>
              </div>
            </div>
            <div className="card-sm">
              <p className="card-title"><FileText size={14} className="text-rose-600 mr-1.5 inline"/>Reussites, Difficultes et Perspectives</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['Reussites','reussites'],['Difficultes','difficultes'],['Besoins','besoins'],['Perspectives','perspectives']].map(([label, field]) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <textarea className="input text-xs font-semibold min-h-[72px] resize-none" rows={3}
                      value={form[field]} onChange={e => ch(field, e.target.value)} placeholder={label + '...'}/>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-sm disabled:opacity-40">
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                {existing ? 'Mettre a jour le rapport' : 'Valider et Transmettre'}
              </button>
            </div>
          </form>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowHisto(v => !v)} className="w-full flex items-center justify-between px-3 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><History size={14}/> Historique des rapports - {nomAsm}</div>
              {showHisto ? <ChevronUp size={14} className="text-slate-500"/> : <ChevronDown size={14} className="text-slate-500"/>}
            </button>
            {showHisto && (
              <div className="overflow-x-auto">
                {historique.length === 0 ? (
                  <p className="text-center text-slate-400 py-3 text-xs font-semibold">Aucun rapport passe</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr>{['Mois','Annee','Assistance','Sauves','Ajoutes','Offrandes','Dimes','Statut'].map(h => <th key={h} className="table-th text-[10px]">{h}</th>)}</tr></thead>
                    <tbody>
                      {historique.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="table-td font-bold">{r.mois}</td>
                          <td className="table-td">{r.annee}</td>
                          <td className="table-td font-black text-blue-800">{(r.assistance_totale||0).toLocaleString('fr-FR')}</td>
                          <td className="table-td font-black text-emerald-800">{r.sauves||0}</td>
                          <td className="table-td">{r.ajoutes||0}</td>
                          <td className="table-td">{Number(r.offrandes||0).toLocaleString('fr-FR')}</td>
                          <td className="table-td">{Number(r.dimes||0).toLocaleString('fr-FR')}</td>
                          <td className="table-td"><span className="badge bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]">{r.statut||'SOUMIS'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const INIT_ACTIVITE = {
  date_activite:'', type_activite:'Reunion Mensuelle', nom_activite:'', departement_concerne:'',
  lieu:'', nb_jours:1, pasteur_responsable:'', intervenant_principal:'', theme_module:'',
  ass_femmes:0, ass_hommes:0, ass_jeunes:0, assistance_totale:0, budget_fcfa:0, depenses_fcfa:0, observations:''
};

function OngletActivites({ assemblee_id, annee, mois, nomAsm, showToast }) {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INIT_ACTIVITE);
  const [saving, setSaving] = useState(false);
  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const load = useCallback(() => {
    if (!assemblee_id) return;
    setLoading(true);
    getActivites({ niveau:'assemblee', assemblee_id, annee, mois }).then(setActivites).catch(() => []).finally(() => setLoading(false));
  }, [assemblee_id, annee, mois]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.nom_activite) { showToast('Nom obligatoire', false); return; }
    setSaving(true);
    try {
      if (modal?.id) { await updateActivite(modal.id, form); showToast('Activite modifiee'); }
      else { await addActivite({ ...form, niveau:'assemblee', assemblee_id, annee, mois }); showToast('Activite ajoutee'); }
      setModal(null); load();
    } catch (err) { showToast(err.message, false); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette activite ?')) return;
    await deleteActivite(id).catch(() => {});
    showToast('Supprimee'); load();
  };

  return (
    <div className="card-sm space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-title"><Activity size={16} className="text-blue-600"/>Activites - {nomAsm} ({mois} {annee})</p>
        <button onClick={() => { setForm(INIT_ACTIVITE); setModal({}); }} className="btn-primary text-xs py-2 px-3"><Plus size={13}/> Nouvelle activite</button>
      </div>
      {loading && <p className="text-center text-slate-400 py-2 text-xs">Chargement...</p>}
      {!loading && activites.length === 0 && <p className="text-center text-slate-400 py-3 text-xs font-semibold">Aucune activite pour {mois} {annee}</p>}
      {activites.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr>{['Date','Type','Nom activite','Dept.','Assistance','Depenses',''].map(h => <th key={h} className="table-th text-[10px]">{h}</th>)}</tr></thead>
            <tbody>
              {activites.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono">{a.date_activite ? new Date(a.date_activite).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="table-td"><span className="badge bg-blue-50 text-blue-800 border border-blue-200 text-[10px]">{a.type_activite}</span></td>
                  <td className="table-td font-black">{a.nom_activite}</td>
                  <td className="table-td text-slate-600">{a.departement_concerne||'-'}</td>
                  <td className="table-td font-black text-emerald-800">{(a.assistance_totale||0).toLocaleString('fr-FR')}</td>
                  <td className="table-td">{Number(a.depenses_fcfa||0).toLocaleString('fr-FR')}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ date_activite:a.date_activite?.split('T')[0]||'', type_activite:a.type_activite||'Reunion Mensuelle', nom_activite:a.nom_activite||'', departement_concerne:a.departement_concerne||'', lieu:a.lieu||'', nb_jours:a.nb_jours||1, pasteur_responsable:a.pasteur_responsable||'', intervenant_principal:a.intervenant_principal||'', theme_module:a.theme_module||'', ass_femmes:a.ass_femmes||0, ass_hommes:a.ass_hommes||0, ass_jeunes:a.ass_jeunes||0, assistance_totale:a.assistance_totale||0, budget_fcfa:a.budget_fcfa||0, depenses_fcfa:a.depenses_fcfa||0, observations:a.observations||'' }); setModal(a); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={12}/></button>
                      <button onClick={() => del(a.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal !== null && (
        <Modal title={modal?.id ? 'Modifier activite' : 'Nouvelle activite'} onClose={() => setModal(null)} size="2xl">
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Date</label><input type="date" className="input text-xs" value={form.date_activite} onChange={e => ch('date_activite', e.target.value)}/></div>
              <div><label className="label">Type *</label>
                <select className="input text-xs font-bold" value={form.type_activite} onChange={e => ch('type_activite', e.target.value)}>
                  {TYPES_ACTIVITE.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="label">Nom de l activite *</label><input required className="input text-xs" value={form.nom_activite} onChange={e => ch('nom_activite', e.target.value)} placeholder="Ex: Reunion mensuelle"/></div>
              <div><label className="label">Departement concerne</label><input className="input text-xs" value={form.departement_concerne} onChange={e => ch('departement_concerne', e.target.value)}/></div>
              <div><label className="label">Lieu</label><input className="input text-xs" value={form.lieu} onChange={e => ch('lieu', e.target.value)}/></div>
              <div><label className="label">Pasteur responsable</label><input className="input text-xs" value={form.pasteur_responsable} onChange={e => ch('pasteur_responsable', e.target.value)}/></div>
              <div><label className="label">Theme / Enseignement</label><input className="input text-xs" value={form.theme_module} onChange={e => ch('theme_module', e.target.value)}/></div>
            </div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider pt-1">Assistance</p>
            <div className="grid grid-cols-4 gap-3">
              {[['Femmes','ass_femmes'],['Hommes','ass_hommes'],['Jeunes','ass_jeunes'],['Total','assistance_totale']].map(([l,f]) => (
                <div key={f}><label className="label">{l}</label><input type="number" min="0" className="input text-xs font-black" value={form[f]} onChange={e => ch(f, parseInt(e.target.value)||0)}/></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Budget (FCFA)</label><input type="number" min="0" className="input text-xs" value={form.budget_fcfa} onChange={e => ch('budget_fcfa', e.target.value)}/></div>
              <div><label className="label">Depenses (FCFA)</label><input type="number" min="0" className="input text-xs" value={form.depenses_fcfa} onChange={e => ch('depenses_fcfa', e.target.value)}/></div>
            </div>
            <div><label className="label">Observations</label><textarea className="input text-xs font-semibold resize-none" rows={2} value={form.observations} onChange={e => ch('observations', e.target.value)}/></div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} {modal?.id ? 'Modifier' : 'Ajouter'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function OngletFinances({ assemblee_id, annee, mois, nomAsm, showToast }) {
  const INIT_FIN = {
    offrandes_total:0, offrandes_pct_asm:100, offrandes_pct_dist:0, offrandes_pct_coord:0, offrandes_pct_afrique:0,
    dimes_total:0, dimes_pct_asm:100, dimes_pct_dist:0, dimes_pct_coord:0, dimes_pct_afrique:0,
    bp_total:0, bp_pct_asm:100, bp_pct_dist:0, bp_pct_coord:0, bp_pct_afrique:0,
    dovocoq_total:0, dovocoq_pct_asm:100, dovocoq_pct_dist:0, dovocoq_pct_coord:0, dovocoq_pct_afrique:0,
    dons_total:0, observations_finances:''
  };
  const [form, setForm] = useState(INIT_FIN);
  const [saving, setSaving] = useState(false);
  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    getFinancesAssemblee({ assemblee_id, annee, mois }).then(r => { if (r.length > 0) setForm({ ...INIT_FIN, ...r[0] }); }).catch(() => {});
  }, [assemblee_id, annee, mois]);

  const totalRecettes = (parseFloat(form.offrandes_total)||0) + (parseFloat(form.dimes_total)||0) + (parseFloat(form.bp_total)||0) + (parseFloat(form.dovocoq_total)||0) + (parseFloat(form.dons_total)||0);
  const lignes = [{ key:'offrandes', label:'Offrandes' }, { key:'dimes', label:'Dimes' }, { key:'bp', label:'BP' }, { key:'dovocoq', label:'DOVOCOQ' }];

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await saveFinancesAssemblee({ ...form, assemblee_id, annee, mois }); showToast('Finances enregistrees'); }
    catch (err) { showToast(err.message, false); }
    finally { setSaving(false); }
  };

  return (
    <div className="card-sm space-y-4">
      <p className="section-title"><Banknote size={16} className="text-emerald-600"/>Finances - {nomAsm} ({mois} {annee})</p>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr><th className="table-th">Designation</th><th className="table-th">% Assemblee</th><th className="table-th">% District</th><th className="table-th">% Coord.</th><th className="table-th">% Afrique</th><th className="table-th">Valeur Totale (FCFA)</th></tr></thead>
            <tbody>
              {lignes.map(({ key, label }) => (
                <tr key={key} className="hover:bg-slate-50">
                  <td className="table-td font-black">{label}</td>
                  {['pct_asm','pct_dist','pct_coord','pct_afrique'].map(p => (
                    <td key={p} className="table-td">
                      <input type="number" min="0" max="100" step="0.1" className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-blue-500" value={form[key + '_' + p]} onChange={e => ch(key + '_' + p, parseFloat(e.target.value)||0)}/>
                    </td>
                  ))}
                  <td className="table-td"><input type="number" min="0" step="0.01" className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs font-black focus:outline-none focus:border-blue-500" value={form[key + '_total']} onChange={e => ch(key + '_total', parseFloat(e.target.value)||0)}/></td>
                </tr>
              ))}
              <tr className="hover:bg-slate-50">
                <td className="table-td font-black">Dons volontaires</td>
                <td className="table-td" colSpan={4}><span className="text-slate-400 text-[10px]">-</span></td>
                <td className="table-td"><input type="number" min="0" step="0.01" className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs font-black focus:outline-none focus:border-blue-500" value={form.dons_total} onChange={e => ch('dons_total', parseFloat(e.target.value)||0)}/></td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="table-td font-black text-emerald-800" colSpan={5}>TOTAL RECETTES</td>
                <td className="table-td font-black text-emerald-800">{totalRecettes.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div><label className="label">Observations finances</label><textarea className="input text-xs font-semibold resize-none" rows={2} value={form.observations_finances} onChange={e => ch('observations_finances', e.target.value)} placeholder="Observations..."/></div>
        <div className="flex justify-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Enregistrer les finances</button></div>
      </form>
    </div>
  );
}

function OngletMembres({ assemblee_id, nomAsm, showToast }) {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INIT_MEMBRE);
  const [saving, setSaving] = useState(false);
  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const load = useCallback(() => {
    if (!assemblee_id) return;
    setLoading(true);
    getMembres(assemblee_id).then(setMembres).catch(() => []).finally(() => setLoading(false));
  }, [assemblee_id]);

  useEffect(() => { load(); }, [load]);

  const filtres = membres.filter(m => !search || (m.nom + ' ' + (m.prenoms||'')).toLowerCase().includes(search.toLowerCase()));

  const save = async (e) => {
    e.preventDefault();
    if (!form.nom) { showToast('Nom obligatoire', false); return; }
    setSaving(true);
    try {
      if (modal?.id) { await updateMembre(modal.id, form); showToast('Membre modifie'); }
      else { await addMembre(assemblee_id, form); showToast('Membre ajoute'); }
      setModal(null); load();
    } catch (err) { showToast(err.message, false); }
    finally { setSaving(false); }
  };

  const del = async (id, nom) => {
    if (!confirm('Supprimer ' + nom + ' ?')) return;
    await deleteMembre(id).catch(() => {});
    showToast('Membre supprime'); load();
  };

  return (
    <div className="card-sm space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="section-title"><Users size={16} className="text-indigo-600"/>Membres - {nomAsm} ({membres.length})</p>
        <button onClick={() => { setForm(INIT_MEMBRE); setModal({}); }} className="btn-primary text-xs py-2 px-3"><UserPlus size={13}/> Ajouter</button>
      </div>
      <div className="relative w-56"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input text-xs py-2 pl-8" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      {loading && <p className="text-center text-slate-400 py-3 text-xs">Chargement...</p>}
      {!loading && filtres.length === 0 && <p className="text-center text-slate-400 py-3 text-xs font-semibold">Aucun membre</p>}
      {filtres.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr>{['Nom','Sexe','Contact','Statut','Assiduite','Dt entree',''].map(h => <th key={h} className="table-th text-[10px]">{h}</th>)}</tr></thead>
            <tbody>
              {filtres.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="table-td font-black">{m.nom} {m.prenoms||''}</td>
                  <td className="table-td">{m.sexe||'-'}</td>
                  <td className="table-td text-slate-600">{m.contact||'-'}</td>
                  <td className="table-td"><span className={`badge text-[10px] ${m.statut_membre==='Actif'?'bg-emerald-50 text-emerald-800 border border-emerald-200':'bg-slate-100 text-slate-600 border border-slate-200'}`}>{m.statut_membre}</span></td>
                  <td className="table-td text-slate-600">{m.assiduite||'-'}</td>
                  <td className="table-td text-slate-500">{m.date_entree_assemblee ? new Date(m.date_entree_assemblee).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ nom:m.nom, prenoms:m.prenoms||'', sexe:m.sexe||'', contact:m.contact||'', statut_membre:m.statut_membre||'Actif', type_membre:m.type_membre||'Membre', date_salut:m.date_salut?.split('T')[0]||'', date_bapteme:m.date_bapteme?.split('T')[0]||'', division_ga:m.division_ga||'', situation_matrimoniale:m.situation_matrimoniale||'', nbre_enfants:m.nbre_enfants||0, conjoint_sauve:m.conjoint_sauve||'Non', quartier:m.quartier||'', activite_assemblee:m.activite_assemblee||'', profession:m.profession||'', assiduite:m.assiduite||'Moyen', actif_liberalites:m.actif_liberalites||'Non', date_entree_assemblee:m.date_entree_assemblee?.split('T')[0]||'', date_mutation:m.date_mutation?.split('T')[0]||'', ancienne_assemblee:m.ancienne_assemblee||'', notes:m.notes||'' }); setModal(m); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={12}/></button>
                      <button onClick={() => del(m.id, m.nom)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal !== null && (
        <Modal title={modal?.id ? ('Modifier - ' + modal.nom) : 'Ajouter un membre'} onClose={() => setModal(null)} size="2xl">
          <form onSubmit={save} className="space-y-3">
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider">Identite</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nom *</label><input required className="input text-xs" value={form.nom} onChange={e => ch('nom', e.target.value)}/></div>
              <div><label className="label">Prenom(s)</label><input className="input text-xs" value={form.prenoms} onChange={e => ch('prenoms', e.target.value)}/></div>
              <div><label className="label">Sexe</label><select className="input text-xs font-bold bg-white" value={form.sexe} onChange={e => ch('sexe', e.target.value)}><option value="">-</option><option value="M">Masculin</option><option value="F">Feminin</option></select></div>
              <div><label className="label">Contact</label><input className="input text-xs" value={form.contact} onChange={e => ch('contact', e.target.value)}/></div>
              <div><label className="label">Quartier</label><input className="input text-xs" value={form.quartier} onChange={e => ch('quartier', e.target.value)}/></div>
              <div><label className="label">Profession</label><input className="input text-xs" value={form.profession} onChange={e => ch('profession', e.target.value)}/></div>
            </div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider pt-1">Vie spirituelle</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Date du Salut</label><input type="date" className="input text-xs" value={form.date_salut} onChange={e => ch('date_salut', e.target.value)}/></div>
              <div><label className="label">Date Bapteme</label><input type="date" className="input text-xs" value={form.date_bapteme} onChange={e => ch('date_bapteme', e.target.value)}/></div>
              <div><label className="label">Assiduite</label><select className="input text-xs font-bold bg-white" value={form.assiduite} onChange={e => ch('assiduite', e.target.value)}>{['Assidu','Moyen','Peu assidu','Absent'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="label">Actif dans les liberalites</label><select className="input text-xs font-bold bg-white" value={form.actif_liberalites} onChange={e => ch('actif_liberalites', e.target.value)}><option>Oui</option><option>Non</option></select></div>
              <div><label className="label">Activite dans l assemblee</label><input className="input text-xs" value={form.activite_assemblee} onChange={e => ch('activite_assemblee', e.target.value)} placeholder="Ex: Louange"/></div>
              <div><label className="label">Divisions (GA)</label><input className="input text-xs" value={form.division_ga} onChange={e => ch('division_ga', e.target.value)}/></div>
            </div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider pt-1">Situation familiale</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Situation matrimoniale</label><select className="input text-xs font-bold bg-white" value={form.situation_matrimoniale} onChange={e => ch('situation_matrimoniale', e.target.value)}><option value="">-</option>{['Celibataire','Marie(e)','Veuf-Veuve','Divorce(e)','Separe(e)'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="label">Nbre enfants</label><input type="number" min="0" className="input text-xs" value={form.nbre_enfants} onChange={e => ch('nbre_enfants', parseInt(e.target.value)||0)}/></div>
              <div><label className="label">Conjoint sauve ?</label><select className="input text-xs font-bold bg-white" value={form.conjoint_sauve} onChange={e => ch('conjoint_sauve', e.target.value)}><option>Oui</option><option>Non</option><option>Celibataire</option></select></div>
            </div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider pt-1">Organisation</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Type membre</label><select className="input text-xs font-bold bg-white" value={form.type_membre} onChange={e => ch('type_membre', e.target.value)}>{['Membre','Predicateur','Pasteur'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="label">Statut</label><select className="input text-xs font-bold bg-white" value={form.statut_membre} onChange={e => ch('statut_membre', e.target.value)}>{['Actif','Inactif','Visiteur'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="label">Date entree Ass.</label><input type="date" className="input text-xs" value={form.date_entree_assemblee} onChange={e => ch('date_entree_assemblee', e.target.value)}/></div>
              <div><label className="label">Date mutation</label><input type="date" className="input text-xs" value={form.date_mutation} onChange={e => ch('date_mutation', e.target.value)}/></div>
              <div><label className="label">Ancienne assemblee</label><input className="input text-xs" value={form.ancienne_assemblee} onChange={e => ch('ancienne_assemblee', e.target.value)}/></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} {modal?.id ? 'Modifier' : 'Ajouter'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function OngletComite({ assemblee_id, nomAsm, showToast }) {
  const [comite, setComite] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INIT_COMITE);
  const [saving, setSaving] = useState(false);
  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const load = useCallback(() => {
    if (!assemblee_id) return;
    getComite(assemblee_id).then(setComite).catch(() => []);
  }, [assemblee_id]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.nom) { showToast('Nom obligatoire', false); return; }
    setSaving(true);
    try {
      if (modal?.id) { await updateComiteMembre(modal.id, form); showToast('Membre modifie'); }
      else { await addComiteMembre(assemblee_id, form); showToast('Membre ajoute'); }
      setModal(null); load();
    } catch (err) { showToast(err.message, false); }
    finally { setSaving(false); }
  };

  const del = async (id, nom) => {
    if (!confirm('Supprimer ' + nom + ' du comite ?')) return;
    await deleteComiteMembre(id).catch(() => {});
    showToast('Supprime'); load();
  };

  return (
    <div className="card-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-title"><Star size={16} className="text-amber-500"/>Comite - {nomAsm}</p>
        <button onClick={() => { setForm(INIT_COMITE); setModal({}); }} className="btn-primary text-xs py-2 px-3"><Plus size={13}/> Ajouter</button>
      </div>
      {comite.length === 0 ? (
        <p className="text-center text-slate-400 py-4 text-xs font-semibold">Aucun membre dans le comite</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {['Nom', 'Prénom(s)', 'Rôle / Fonction', 'Contact', 'En fonction depuis', ''].map(h => (
                  <th key={h} className="table-th text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comite.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <td className="table-td font-black text-slate-900">{m.nom}</td>
                  <td className="table-td text-slate-600">{m.prenoms || '-'}</td>
                  <td className="table-td">
                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-black">{m.fonction}</span>
                  </td>
                  <td className="table-td text-slate-500">{m.contact || '-'}</td>
                  <td className="table-td text-slate-400 font-mono">
                    {m.date_entree_fonction ? new Date(m.date_entree_fonction).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setForm({ fonction: m.fonction, nom: m.nom, prenoms: m.prenoms||'', contact: m.contact||'', date_entree_fonction: m.date_entree_fonction?.split('T')[0]||'' }); setModal(m); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      ><Pencil size={13}/></button>
                      <button onClick={() => del(m.id, m.nom)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal !== null && (
        <Modal title={modal?.id ? ('Modifier - ' + modal.nom) : 'Ajouter au comite'} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-3">
            <div><label className="label">Fonction</label>
              <select className="input text-xs font-bold bg-white" value={form.fonction} onChange={e => ch('fonction', e.target.value)}>
                {FONCTIONS_COMITE.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nom *</label><input required className="input text-xs" value={form.nom} onChange={e => ch('nom', e.target.value)}/></div>
              <div><label className="label">Prenom(s)</label><input className="input text-xs" value={form.prenoms} onChange={e => ch('prenoms', e.target.value)}/></div>
              <div><label className="label">Contact</label><input className="input text-xs" value={form.contact} onChange={e => ch('contact', e.target.value)}/></div>
              <div><label className="label">Date entree en fonction</label><input type="date" className="input text-xs" value={form.date_entree_fonction} onChange={e => ch('date_entree_fonction', e.target.value)}/></div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} {modal?.id ? 'Modifier' : 'Ajouter'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
