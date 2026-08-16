import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPlus, Pencil, Trash2, Check, X, Loader2, Search,
  Shield, UserCheck, UserX, Key, RefreshCw, Filter,
  ChevronDown, AlertTriangle, Users, Globe, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminUtilisateurs, createAdminUtilisateur, updateAdminUtilisateur,
  updateUserStatut, resetUserPassword, deleteAdminUtilisateur,
  getPays, getDistricts, getAssemblees,
} from '../api';

// ─── Constantes ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'ADMIN_AFRIQUE',        label: 'Admin Afrique',        color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'ADMIN_PAYS',           label: 'Admin National',        color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'SUPERVISEUR_DISTRICT', label: 'Superviseur District',  color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'RAPPORTEUR_ASSEMBLEE', label: 'Rapporteur Assemblée',  color: 'bg-slate-100 text-slate-700 border-slate-300' },
];

const STATUTS = [
  { value: 'ACTIF',      label: 'Actif',      color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'INACTIF',    label: 'Inactif',    color: 'bg-slate-100 text-slate-600 border-slate-300' },
  { value: 'EN_ATTENTE', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'REJETE',     label: 'Rejeté',     color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

const getRoleInfo  = (role)   => ROLES.find(r => r.value === role)   || { label: role,   color: 'bg-slate-100 text-slate-600 border-slate-300' };
const getStatutInfo = (statut) => STATUTS.find(s => s.value === statut) || { label: statut, color: 'bg-slate-100 text-slate-600 border-slate-300' };

// ─── Modal générique ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-lg shadow-md w-full ${widths[size]} max-h-[90vh] overflow-y-auto border border-slate-200`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-3 py-3 rounded-lg shadow-md text-sm font-bold flex items-center gap-2 animate-bounce-in ${
      type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
    }`}>
      {type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
      {msg}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// COMPOSANT FORMULAIRE UTILISATEUR (création + modification)
// ──────────────────────────────────────────────────────────────────────────────
function FormUtilisateur({ initial, onSave, onCancel, pays, isAdminAfrique, userPaysId, saving }) {
  const [form, setForm] = useState(initial);
  const [districts, setDistricts] = useState([]);
  const [assemblees, setAssemblees] = useState([]);
  const isMounted = useRef(false); // Distingue le montage initial d'un vrai changement

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Chargement initial : si le formulaire s'ouvre avec un pays_id déjà renseigné
  // (mode édition), on charge directement les districts et assemblées existants
  useEffect(() => {
    const init = async () => {
      if (initial.pays_id) {
        const d = await getDistricts(initial.pays_id).catch(() => []);
        setDistricts(d);
        if (initial.district_id) {
          const a = await getAssemblees(initial.district_id).catch(() => []);
          setAssemblees(a);
        }
      }
      isMounted.current = true; // Prêt pour les changements utilisateur
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger districts quand l'utilisateur CHANGE le pays (pas au montage)
  useEffect(() => {
    if (!isMounted.current) return; // Ignore le premier déclenchement au montage
    if (!form.pays_id) {
      setDistricts([]); setAssemblees([]);
      setForm(p => ({ ...p, district_id: '', assemblee_id: '' }));
      return;
    }
    getDistricts(form.pays_id)
      .then(d => { setDistricts(d); setAssemblees([]); })
      .catch(() => { setDistricts([]); setAssemblees([]); });
    setForm(p => ({ ...p, district_id: '', assemblee_id: '' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pays_id]);

  // Charger assemblées quand l'utilisateur CHANGE le district (pas au montage)
  useEffect(() => {
    if (!isMounted.current) return;
    if (!form.district_id) { setAssemblees([]); setForm(p => ({ ...p, assemblee_id: '' })); return; }
    getAssemblees(form.district_id)
      .then(setAssemblees)
      .catch(() => setAssemblees([]));
    setForm(p => ({ ...p, assemblee_id: '' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.district_id]);

  // Déterminer quels champs afficher selon le rôle
  const role = form.role;
  const needsPays     = true;
  const needsDistrict = ['SUPERVISEUR_DISTRICT', 'RAPPORTEUR_ASSEMBLEE'].includes(role);
  const needsAssemblee = role === 'RAPPORTEUR_ASSEMBLEE';

  // Les rôles disponibles selon qui crée
  const rolesDisponibles = isAdminAfrique
    ? ROLES
    : ROLES.filter(r => r.value !== 'ADMIN_AFRIQUE');

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nom complet *</label>
          <input className="input text-sm" placeholder="Dupont Jean" required
            value={form.nom} onChange={e => set('nom', e.target.value)} />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input text-sm" placeholder="jean@lwm.org" required
            value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
      </div>

      {/* Mot de passe : uniquement à la création */}
      {initial._isNew && (
        <div>
          <label className="label">Mot de passe * <span className="text-slate-400 font-normal normal-case">(min. 6 caractères)</span></label>
          <input type="password" className="input text-sm" required minLength={6}
            value={form.password || ''} onChange={e => set('password', e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Rôle *</label>
          <select className="input text-sm font-bold bg-white" value={form.role}
            onChange={e => set('role', e.target.value)} required>
            {rolesDisponibles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select className="input text-sm font-bold bg-white" value={form.statut}
            onChange={e => set('statut', e.target.value)}>
            {STATUTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Portée géographique */}
      <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
        <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={13} className="text-blue-500" /> Portée d'accès
        </p>
        <div>
          <label className="label">Pays</label>
          {role === 'ADMIN_AFRIQUE' ? (
            // Admin Afrique : accès à tout, pas de restriction de pays
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-amber-800 text-xs font-extrabold">
              <Globe size={13} className="text-amber-500" />
              Tout (Afrique) - accès à tous les pays
            </div>
          ) : (
            <select className="input text-sm font-bold bg-white"
              value={form.pays_id || ''}
              onChange={e => set('pays_id', e.target.value)}
              disabled={!isAdminAfrique}
            >
              <option value="">-- Sélectionner un pays --</option>
              {pays.map(p => <option key={p.id} value={p.id}>{p.nom_pays}</option>)}
            </select>
          )}
        </div>
        {needsDistrict && (
          <div>
            <label className="label">District</label>
            <select className="input text-sm font-bold bg-white"
              value={form.district_id || ''}
              onChange={e => set('district_id', e.target.value)}>
              <option value="">-- Sélectionner un district --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
            </select>
          </div>
        )}
        {needsAssemblee && (
          <div>
            <label className="label">Assemblée</label>
            <select className="input text-sm font-bold bg-white"
              value={form.assemblee_id || ''}
              onChange={e => set('assemblee_id', e.target.value)}>
              <option value="">-- Sélectionner une assemblée --</option>
              {assemblees.map(a => <option key={a.id} value={a.id}>{a.nom_assemblee}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Annuler</button>
        <button type="submit" disabled={saving} className="flex-1 btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {initial._isNew ? "Créer l'utilisateur" : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ──────────────────────────────────────────────────────────────────────────────
export default function GestionUtilisateursPage() {
  const { user, updateUser } = useAuth();
  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(user?.role);

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [pays, setPays]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Filtres
  const [filterStatut, setFilterStatut] = useState('');
  const [filterRole, setFilterRole]     = useState('');
  const [filterPays, setFilterPays]     = useState('');
  const [search, setSearch]             = useState('');

  // Modals
  const [modalForm, setModalForm]       = useState(null); // null | formData object
  const [modalReset, setModalReset]     = useState(null); // null | utilisateur
  const [confirmDel, setConfirmDel]     = useState(null); // null | utilisateur
  const [newPassword, setNewPassword]   = useState('');

  // Toast
  const [toastMsg, setToastMsg]   = useState('');
  const [toastType, setToastType] = useState('success');

  const toast = (msg, type = 'success') => {
    setToastMsg(msg); setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Chargement séparé : si getAdminUtilisateurs échoue, les pays sont quand même disponibles
      const [u, p] = await Promise.allSettled([getAdminUtilisateurs(), getPays()]);
      if (u.status === 'fulfilled') setUtilisateurs(u.value);
      else toast(u.reason?.message || 'Erreur chargement utilisateurs', 'error');
      if (p.status === 'fulfilled') setPays(p.value);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtrages locaux ──────────────────────────────────────────────────────
  const utilisateursFiltres = utilisateurs.filter(u => {
    const matchSearch  = !search   || u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatut  = !filterStatut || u.statut === filterStatut;
    const matchRole    = !filterRole   || u.role === filterRole;
    const matchPays    = !filterPays   || String(u.pays_id) === String(filterPays);
    return matchSearch && matchStatut && matchRole && matchPays;
  });

  // ── Stats rapides ─────────────────────────────────────────────────────────
  const stats = {
    total:     utilisateurs.length,
    actifs:    utilisateurs.filter(u => u.statut === 'ACTIF').length,
    attente:   utilisateurs.filter(u => u.statut === 'EN_ATTENTE').length,
    inactifs:  utilisateurs.filter(u => u.statut === 'INACTIF').length,
  };

  // ── Créer utilisateur ─────────────────────────────────────────────────────
  const openCreate = () => setModalForm({
    _isNew: true,
    nom: '', email: '', password: '',
    role: 'RAPPORTEUR_ASSEMBLEE', statut: 'ACTIF',
    pays_id: isAdminAfrique ? '' : String(user?.pays_id || ''),
    district_id: '', assemblee_id: '',
  });

  // ── Modifier utilisateur ──────────────────────────────────────────────────
  const openEdit = (u) => setModalForm({
    _isNew: false, _id: u.id,
    nom: u.nom, email: u.email,
    role: u.role, statut: u.statut,
    pays_id: u.pays_id ? String(u.pays_id) : '',
    district_id: u.district_id ? String(u.district_id) : '',
    assemblee_id: u.assemblee_id ? String(u.assemblee_id) : '',
  });

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (form._isNew) {
        await createAdminUtilisateur(form);
        toast('Utilisateur créé avec succès !');
      } else {
        await updateAdminUtilisateur(form._id, form);
        toast('Utilisateur mis à jour !');
        // Si on modifie l'utilisateur actuellement connecté, mettre à jour sa session
        if (String(form._id) === String(user?.id)) {
          updateUser({ nom: form.nom, email: form.email });
        }
      }
      setModalForm(null); load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  // ── Toggle statut rapide ──────────────────────────────────────────────────
  const toggleStatut = async (u) => {
    const newStatut = u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try {
      await updateUserStatut(u.id, newStatut);
      toast(`${u.nom} - ${newStatut === 'ACTIF' ? 'Activé' : 'Désactivé'}`);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  // ── Validation rapide (EN_ATTENTE → ACTIF) ───────────────────────────────
  const validerCompte = async (u) => {
    try {
      await updateUserStatut(u.id, 'ACTIF');
      toast(`Compte de ${u.nom} validé !`);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  // ── Reset mot de passe ────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await resetUserPassword(modalReset.id, newPassword);
      toast(res.message || 'Mot de passe réinitialisé');
      setModalReset(null); setNewPassword('');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await deleteAdminUtilisateur(confirmDel.id);
      toast(`${confirmDel.nom} supprimé`);
      setConfirmDel(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="p-3 max-w-7xl mx-auto space-y-5">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestion des Utilisateurs</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            {isAdminAfrique
              ? 'Administration complète - tous les pays'
              : `Administration - ${user?.nom_pays || 'votre pays'} uniquement`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <UserPlus size={16} /> Créer un utilisateur
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',      val: stats.total,    color: 'bg-blue-50 border-blue-200 text-blue-900', icon: Users },
          { label: 'Actifs',     val: stats.actifs,   color: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: UserCheck },
          { label: 'En attente', val: stats.attente,  color: 'bg-amber-50 border-amber-200 text-amber-900', icon: Shield },
          { label: 'Inactifs',   val: stats.inactifs, color: 'bg-slate-100 border-slate-300 text-slate-700', icon: UserX },
        ].map(s => (
          <div key={s.label} className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${s.color}`}>
            <s.icon size={20} className="opacity-60 shrink-0" />
            <div>
              <p className="text-2xl font-black leading-none">{s.val}</p>
              <p className="text-xs font-extrabold opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input text-xs py-2.5 pl-9 w-full" placeholder="Rechercher par nom ou email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input text-xs py-2.5 font-bold bg-white w-36"
            value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input text-xs py-2.5 font-bold bg-white w-44"
            value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {isAdminAfrique && (
            <select className="input text-xs py-2.5 font-bold bg-white w-36"
              value={filterPays} onChange={e => setFilterPays(e.target.value)}>
              <option value="">Tous les pays</option>
              {pays.map(p => <option key={p.id} value={p.id}>{p.nom_pays}</option>)}
            </select>
          )}
          <button onClick={load} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" title="Actualiser">
            <RefreshCw size={15} className="text-slate-600" />
          </button>
          <span className="text-xs font-extrabold text-slate-400">
            {utilisateursFiltres.length} / {utilisateurs.length}
          </span>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : utilisateursFiltres.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50/80 border-b-2 border-blue-200">
                  {['Utilisateur', 'Rôle', 'Portée', 'Statut', 'Créé le', 'Actions'].map(h => (
                    <th key={h} className="text-xs font-black text-blue-950 uppercase tracking-wider px-4 py-3.5 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilisateursFiltres.map(u => {
                  const roleInfo   = getRoleInfo(u.role);
                  const statutInfo = getStatutInfo(u.statut);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* Utilisateur */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                            {u.nom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{u.nom}</p>
                            <p className="text-xs text-slate-400 font-semibold">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="px-4 py-3.5">
                        <span className={`badge text-[11px] border font-extrabold ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* Portée */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-semibold text-slate-600 space-y-0.5">
                          {u.nom_pays && (
                            <p className="flex items-center gap-1">
                              <Globe size={11} className="text-blue-400 shrink-0" /> {u.nom_pays}
                            </p>
                          )}
                          {u.nom_district && (
                            <p className="flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400 shrink-0" /> {u.nom_district}
                            </p>
                          )}
                          {u.nom_assemblee && (
                            <p className="text-slate-500">{u.nom_assemblee}</p>
                          )}
                          {!u.nom_pays && !u.nom_district && (
                            <span className="text-slate-300 italic">Global</span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3.5">
                        <span className={`badge text-[11px] border font-extrabold ${statutInfo.color}`}>
                          {statutInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Valider si en attente */}
                          {u.statut === 'EN_ATTENTE' && (
                            <button onClick={() => validerCompte(u)}
                              title="Valider le compte"
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-extrabold border border-emerald-200 transition-colors">
                              <UserCheck size={12} /> Valider
                            </button>
                          )}
                          {/* Toggle actif/inactif */}
                          {u.statut !== 'EN_ATTENTE' && (
                            <button onClick={() => toggleStatut(u)}
                              title={u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-colors ${
                                u.statut === 'ACTIF'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}>
                              {u.statut === 'ACTIF' ? <UserX size={12} /> : <UserCheck size={12} />}
                              {u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                            </button>
                          )}
                          {/* Modifier */}
                          <button onClick={() => openEdit(u)}
                            title="Modifier"
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          {/* Reset MDP */}
                          <button onClick={() => { setModalReset(u); setNewPassword(''); }}
                            title="Réinitialiser le mot de passe"
                            className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors">
                            <Key size={14} />
                          </button>
                          {/* Supprimer */}
                          <button onClick={() => setConfirmDel(u)}
                            title="Supprimer"
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création / modification */}
      {modalForm && (
        <Modal
          title={modalForm._isNew ? 'Créer un utilisateur' : `Modifier - ${modalForm.nom}`}
          onClose={() => setModalForm(null)}
          size="lg"
        >
          <FormUtilisateur
            initial={modalForm}
            pays={pays}
            isAdminAfrique={isAdminAfrique}
            userPaysId={user?.pays_id}
            saving={saving}
            onSave={handleSave}
            onCancel={() => setModalForm(null)}
          />
        </Modal>
      )}

      {/* Modal reset mot de passe */}
      {modalReset && (
        <Modal title={`Réinitialiser le mot de passe - ${modalReset.nom}`} onClose={() => setModalReset(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-900 text-xs font-semibold">
              Le nouveau mot de passe sera communiqué à l'utilisateur par vos soins.
            </div>
            <div>
              <label className="label">Nouveau mot de passe * <span className="text-slate-400 font-normal normal-case">(min. 6 caractères)</span></label>
              <input type="password" className="input" required minLength={6}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModalReset(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" className="flex-1 btn-primary">
                <Key size={16} /> Réinitialiser
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation suppression */}
      {confirmDel && (
        <Modal title="Confirmer la suppression" onClose={() => setConfirmDel(null)} size="sm">
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-rose-900 font-extrabold text-sm">
                Supprimer l'utilisateur <span className="text-rose-700">"{confirmDel.nom}"</span> ?
              </p>
              <p className="text-rose-700 text-xs mt-1 font-semibold">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Toast msg={toastMsg} type={toastType} />
    </div>
  );
}
