import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, MapPin, Building2, Users, Plus, Pencil, Trash2,
  ChevronDown, ChevronRight, X, Check, AlertTriangle,
  UserPlus, Phone, Calendar, Search, Filter, RefreshCw,
  Loader2, ShieldCheck, Star, Download, ChevronUp
} from 'lucide-react';
import {
  getPaysStats, createPays, updatePays, deletePays,
  getDistricts, createDistrict, updateDistrict, deleteDistrict,
  getAssemblees, createAssemblee, updateAssemblee, deleteAssemblee,
  getComite, addComiteMembre, updateComiteMembre, deleteComiteMembre,
  getMembres, getMembresStats, addMembre, updateMembre, deleteMembre,
} from '../api';

// ─── Constantes ──────────────────────────────────────────────────────────────
const FLAG_MAP = {
  TG: '🇹🇬', BJ: '🇧🇯', CI: '🇨🇮', GH: '🇬🇭',
  BF: '🇧🇫', CM: '🇨🇲', NG: '🇳🇬', SN: '🇸🇳',
  ML: '🇲🇱', NE: '🇳🇪', CD: '🇨🇩', GA: '🇬🇦',
};

const FONCTIONS_COMITE = [
  'Pasteur principal',
  'Pasteur principal adjoint',
  'Conseiller',
  'Secrétaire principal(e)',
  'Secrétaire adjoint(e)',
  'Porte parole mission',
  'Porte parole Famille',
  'Porte parole Finance',
  'Porte parole Art et Culture',
  'Porte parole Communication',
  'Porte parole Protocole',
  'Porte parole Patrimoine',
];

const TABS = [
  { id: 'pays',      label: 'Pays & Districts', icon: Globe },
  { id: 'assemblees', label: 'Assemblées',       icon: Building2 },
  { id: 'membres',   label: 'Membres & Comités', icon: Users },
];

// ─── Composant Modal générique ────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-md w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={16} className="text-slate-600" />
          </button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

// ─── Bouton d'action compact ──────────────────────────────────────────────────
function ActionBtn({ onClick, icon: Icon, title, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    blue:  'text-blue-600 hover:bg-blue-50 hover:text-blue-800',
    green: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800',
    red:   'text-rose-500 hover:bg-rose-50 hover:text-rose-700',
    amber: 'text-amber-600 hover:bg-amber-50 hover:text-amber-800',
  };
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}>
      <Icon size={15} />
    </button>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
// ONGLET 1 - PAYS & DISTRICTS
// ══════════════════════════════════════════════════════════════════════════════
function OngletPays({ toast }) {
  const [paysList, setPaysList] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [assembleesAll, setAssembleesAll] = useState([]);
  const [expanded, setExpanded] = useState({});       // expand districts
  const [expandedAsm, setExpandedAsm] = useState({}); // expand assemblées
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalPays, setModalPays] = useState(null);
  const [modalDistrict, setModalDistrict] = useState(null);
  const [modalAssemblee, setModalAssemblee] = useState(null); // null | { pays_id, paysDistricts, assemblee? }
  const [confirmDel, setConfirmDel] = useState(null);

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, a] = await Promise.all([getPaysStats(), getDistricts(), getAssemblees()]);
      setPaysList(p);
      setDistricts(d);
      setAssembleesAll(a);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const togglePays = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAsm  = (id) => setExpandedAsm(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Pays CRUD ──
  const openCreatePays = () => { setForm({ code_pays: '', nom_pays: '' }); setModalPays('create'); };
  const openEditPays   = (p) => { setForm({ code_pays: p.code_pays, nom_pays: p.nom_pays }); setModalPays(p); };

  const savePays = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalPays === 'create') await createPays(form);
      else await updatePays(modalPays.id, form);
      toast(modalPays === 'create' ? 'Pays créé !' : 'Pays mis à jour !');
      setModalPays(null); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const confirmDeletePays = (p) => setConfirmDel({ type: 'pays', id: p.id, nom: p.nom_pays });

  // ── District CRUD ──
  const openCreateDistrict = (paysId) => {
    setForm({ pays_id: paysId, code_district: '', nom_district: '' });
    setModalDistrict({ pays_id: paysId });
  };
  const openEditDistrict = (d) => {
    setForm({ pays_id: d.pays_id, code_district: d.code_district, nom_district: d.nom_district });
    setModalDistrict({ pays_id: d.pays_id, district: d });
  };

  const saveDistrict = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalDistrict.district) await updateDistrict(modalDistrict.district.id, form);
      else await createDistrict(form);
      toast(modalDistrict.district ? 'District mis à jour !' : 'District créé !');
      setModalDistrict(null); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const confirmDeleteDistrict = (d) => setConfirmDel({ type: 'district', id: d.id, nom: d.nom_district });

  // ── Assemblée CRUD (dans le contexte Pays) ──
  const openCreateAssemblee = (paysId, paysDistricts) => {
    setForm({ district_id: paysDistricts[0]?.id || '', code_assemblee: '', nom_assemblee: '', type_unite: 'Assemblée' });
    setModalAssemblee({ pays_id: paysId, paysDistricts });
  };
  const openEditAssemblee = (a, paysDistricts) => {
    setForm({ district_id: a.district_id, code_assemblee: a.code_assemblee, nom_assemblee: a.nom_assemblee, type_unite: a.type_unite || 'Assemblée' });
    setModalAssemblee({ pays_id: a.pays_id, paysDistricts, assemblee: a });
  };

  const saveAssemblee = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalAssemblee.assemblee) await updateAssemblee(modalAssemblee.assemblee.id, form);
      else await createAssemblee(form);
      toast(modalAssemblee.assemblee ? 'Assemblée mise à jour !' : 'Assemblée créée !');
      setModalAssemblee(null); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const confirmDeleteAssemblee = (a) => setConfirmDel({ type: 'assemblee', id: a.id, nom: a.nom_assemblee });

  // ── Suppression commune ──
  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      if (confirmDel.type === 'pays')      await deletePays(confirmDel.id);
      else if (confirmDel.type === 'district')  await deleteDistrict(confirmDel.id);
      else if (confirmDel.type === 'assemblee') await deleteAssemblee(confirmDel.id);
      toast(`${confirmDel.nom} supprimé`);
      setConfirmDel(null); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const rows = [['Pays', 'Code', 'Districts', 'Assemblées']];
    paysList.forEach(p => {
      const paysDistricts = districts.filter(d => String(d.pays_id) === String(p.id));
      rows.push([p.nom_pays, p.code_pays, p.nb_districts || 0, p.nb_assemblees || 0]);
      paysDistricts.forEach(d => {
        rows.push([`  › ${d.nom_district}`, d.code_district || '', '', '']);
      });
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `lwm_pays_districts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const exportExcel = () => {
    // Export Excel natif via HTML table → .xls (compatible Excel, LibreOffice)
    const rows = [['Pays', 'Code', 'Districts', 'Assemblées']];
    paysList.forEach(p => {
      const paysDistricts = districts.filter(d => String(d.pays_id) === String(p.id));
      rows.push([p.nom_pays, p.code_pays, p.nb_districts || 0, p.nb_assemblees || 0]);
      paysDistricts.forEach(d => rows.push([`  › ${d.nom_district}`, d.code_district || '', '', '']));
    });
    const table = `<table><thead><tr>${rows[0].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${
      rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')
    }</tbody></table>`;
    const blob = new Blob([`<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"/></head><body>${table}</body></html>`],
      { type: 'application/vnd.ms-excel;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `lwm_pays_districts_${new Date().toISOString().slice(0,10)}.xls`;
    a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Pays &amp; Districts</h2>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">Structure géographique LWM Afrique</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Boutons export */}
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors">
            <Download size={13} /> CSV
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors">
            <Download size={13} /> Excel
          </button>
          <button onClick={openCreatePays} className="btn-primary gap-2 text-xs py-2 px-4">
            <Plus size={15} /> Nouveau Pays
          </button>
        </div>
      </div>

      {/* Table compacte pays */}
      <div className="overflow-hidden bg-white"
        style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-50/80 border-b-2 border-blue-200">
              <th className="table-th w-8"></th>
              <th className="table-th">Pays</th>
              <th className="table-th text-center">Districts</th>
              <th className="table-th text-center">Assemblées</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paysList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">
                  <Globe size={30} className="mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-sm">Aucun pays enregistré</p>
                  <p className="text-xs mt-1">Cliquez sur "Nouveau Pays" pour commencer</p>
                </td>
              </tr>
            )}
            {paysList.map(pays => {
              const paysDistricts = districts.filter(d => String(d.pays_id) === String(pays.id));
              const isOpen    = expanded[pays.id];
              const isAsmOpen = expandedAsm[pays.id];
              return (
                <React.Fragment key={pays.id}>
                  {/* Ligne pays - badges cliquables indépendamment */}
                  <tr className={`border-b border-slate-200 hover:bg-slate-50/50 transition-colors ${isOpen ? 'bg-blue-50/30' : ''} ${isAsmOpen ? 'bg-emerald-50/20' : ''}`}>
                    {/* Indicateur d'état */}
                    <td className="px-3 py-2 text-slate-300">
                      {(isOpen || isAsmOpen)
                        ? <ChevronDown size={14} className={isOpen ? 'text-blue-400' : 'text-emerald-400'} />
                        : <ChevronRight size={14} className="text-slate-300" />}
                    </td>
                    {/* Nom pays */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {FLAG_MAP[pays.code_pays] ? (
                          <span className="text-lg leading-none">{FLAG_MAP[pays.code_pays]}</span>
                        ) : (
                          <span className="text-xs font-black font-mono text-slate-500 leading-none">{pays.code_pays}</span>
                        )}
                        <div>
                          <p className="font-black text-slate-900 text-[13px]">{pays.nom_pays}</p>
                          <p className="text-[10px] font-mono text-slate-400">{pays.code_pays}</p>
                        </div>
                      </div>
                    </td>
                    {/* Badge districts - clic = expand districts */}
                    <td className="px-3 py-2 text-center">
                      <span
                        onClick={() => togglePays(pays.id)}
                        title="Cliquer pour voir les districts"
                        className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-1 rounded-md cursor-pointer transition-all select-none ${
                          isOpen
                            ? 'text-blue-900 bg-blue-200 ring-1 ring-blue-400 shadow-sm'
                            : 'text-blue-700 bg-blue-100 hover:bg-blue-200 hover:shadow-sm'
                        }`}
                      >
                        <MapPin size={10} /> {pays.nb_districts || 0} district{(pays.nb_districts || 0) > 1 ? 's' : ''}
                      </span>
                    </td>
                    {/* Badge assemblées - clic = expand assemblées */}
                    <td className="px-3 py-2 text-center">
                      <span
                        onClick={() => toggleAsm(pays.id)}
                        title="Cliquer pour voir les assemblées"
                        className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-1 rounded-md cursor-pointer transition-all select-none ${
                          isAsmOpen
                            ? 'text-emerald-900 bg-emerald-200 ring-1 ring-emerald-400 shadow-sm'
                            : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 hover:shadow-sm'
                        }`}
                      >
                        <Building2 size={10} /> {pays.nb_assemblees || 0} assemblée{(pays.nb_assemblees || 0) > 1 ? 's' : ''}
                      </span>
                    </td>
                    {/* Actions pays */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openCreateDistrict(pays.id)}
                          title="Ajouter un district"
                          className="flex items-center gap-1 text-[10px] font-extrabold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors border border-blue-200"
                        >
                          <Plus size={10} /> District
                        </button>
                        <ActionBtn onClick={() => openEditPays(pays)} icon={Pencil} title="Modifier le pays" color="blue" />
                        <ActionBtn onClick={() => confirmDeletePays(pays)} icon={Trash2} title="Supprimer" color="red" />
                      </div>
                    </td>
                  </tr>

                  {/* Sous-zone districts (inline expand) */}
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="p-0 bg-slate-50/80 border-b border-blue-100">
                        <div className="px-8 py-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin size={11} className="text-blue-500" />
                              Districts de {pays.nom_pays} ({paysDistricts.length})
                            </p>
                            <button
                              onClick={() => openCreateDistrict(pays.id)}
                              className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200"
                            >
                              <Plus size={11} /> Nouveau District
                            </button>
                          </div>

                          {paysDistricts.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-1.5 pl-1">
                              Aucun district - cliquez sur "+ Nouveau District"
                            </p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200/70">
                                  <th className="text-left py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">Nom du district</th>
                                  <th className="text-left py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">Code</th>
                                  <th className="text-right py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/80">
                                {paysDistricts.map(d => (
                                  <tr key={d.id} className="hover:bg-white transition-colors">
                                    <td className="py-1.5 px-2">
                                      <div className="flex items-center gap-1.5">
                                        <MapPin size={11} className="text-blue-400 shrink-0" />
                                        <span className="font-extrabold text-slate-800">{d.nom_district}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-2 font-mono text-slate-400">{d.code_district}</td>
                                    <td className="py-1.5 px-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <ActionBtn onClick={() => openEditDistrict(d)} icon={Pencil} title="Modifier" color="blue" />
                                        <ActionBtn onClick={() => confirmDeleteDistrict(d)} icon={Trash2} title="Supprimer" color="red" />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Sous-zone assemblées (expand indépendant - clic sur le badge vert) */}
                  {expandedAsm[pays.id] && (() => {
                    const paysAssemblees = assembleesAll.filter(a =>
                      paysDistricts.some(d => String(d.id) === String(a.district_id))
                    );
                    return (
                      <tr>
                        <td colSpan={5} className="p-0 bg-emerald-50/30 border-b border-emerald-100">
                          <div className="px-8 py-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Building2 size={11} className="text-emerald-600" />
                                Assemblées de {pays.nom_pays} ({paysAssemblees.length})
                              </p>
                              {paysDistricts.length > 0 ? (
                                <button
                                  onClick={() => openCreateAssemblee(pays.id, paysDistricts)}
                                  className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                                >
                                  <Plus size={11} /> Nouvelle Assemblée
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Créez d'abord un district</span>
                              )}
                            </div>
                            {paysAssemblees.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1.5 pl-1">
                                {paysDistricts.length === 0
                                  ? "Aucun district - ajoutez d'abord un district"
                                  : 'Aucune assemblée - cliquez sur "+ Nouvelle Assemblée"'}
                              </p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200/70">
                                    <th className="text-left py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">Assemblée</th>
                                    <th className="text-left py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">District</th>
                                    <th className="text-left py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="text-right py-1 px-2 font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                  {paysAssemblees.map(a => {
                                    const districtNom = paysDistricts.find(d => String(d.id) === String(a.district_id))?.nom_district || '-';
                                    return (
                                      <tr key={a.id} className="hover:bg-white transition-colors">
                                        <td className="py-1.5 px-2">
                                          <div className="flex items-center gap-1.5">
                                            <Building2 size={11} className="text-emerald-500 shrink-0" />
                                            <span className="font-extrabold text-slate-800">{a.nom_assemblee}</span>
                                          </div>
                                        </td>
                                        <td className="py-1.5 px-2 text-slate-500 font-semibold">{districtNom}</td>
                                        <td className="py-1.5 px-2 font-mono text-slate-400">{a.code_assemblee}</td>
                                        <td className="py-1.5 px-2 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <ActionBtn onClick={() => openEditAssemblee(a, paysDistricts)} icon={Pencil} title="Modifier" color="blue" />
                                            <ActionBtn onClick={() => confirmDeleteAssemblee(a)} icon={Trash2} title="Supprimer" color="red" />
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })()}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Pays */}
      {modalPays && (
        <Modal title={modalPays === 'create' ? 'Nouveau Pays' : `Modifier - ${modalPays.nom_pays}`}
          onClose={() => setModalPays(null)}>
          <form onSubmit={savePays} className="space-y-3">
            <div>
              <label className="label text-[10px]">Code Pays * <span className="text-slate-400 font-normal">(ex: TG, BJ, CI)</span></label>
              <input className="input text-xs font-mono uppercase" maxLength={3} placeholder="ex: TG"
                value={form.code_pays} onChange={e => setForm(p => ({ ...p, code_pays: e.target.value }))} required />
            </div>
            <div>
              <label className="label text-[10px]">Nom du Pays *</label>
              <input className="input text-xs" placeholder="ex: Togo"
                value={form.nom_pays} onChange={e => setForm(p => ({ ...p, nom_pays: e.target.value }))} required />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModalPays(null)}
                className="flex-1 btn-secondary text-xs">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary text-xs">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {modalPays === 'create' ? 'Créer le pays' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal District */}
      {modalDistrict && (
        <Modal title={modalDistrict.district ? `Modifier - ${modalDistrict.district.nom_district}` : '🏛️ Nouveau District'}
          onClose={() => setModalDistrict(null)}>
          <form onSubmit={saveDistrict} className="space-y-4">
            <div>
              <label className="label">Pays rattaché</label>
              <select className="input bg-slate-50 font-bold" value={form.pays_id}
                onChange={e => setForm(p => ({ ...p, pays_id: e.target.value }))}>
                {paysList.map(p => <option key={p.id} value={p.id}>{FLAG_MAP[p.code_pays] || '🌐'} {p.nom_pays}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nom du District *</label>
              <input className="input" placeholder="District Nord"
                value={form.nom_district} onChange={e => setForm(p => ({ ...p, nom_district: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Code District <span className="text-slate-400 font-normal">(optionnel, auto-généré sinon)</span></label>
              <input className="input font-mono" placeholder="TG-N01"
                value={form.code_district} onChange={e => setForm(p => ({ ...p, code_district: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalDistrict(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {modalDistrict.district ? 'Enregistrer' : 'Créer le district'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Assemblée */}
      {modalAssemblee && (
        <Modal title={modalAssemblee.assemblee ? `Modifier - ${modalAssemblee.assemblee.nom_assemblee}` : 'Nouvelle Assemblée'}
          onClose={() => setModalAssemblee(null)}>
          <form onSubmit={saveAssemblee} className="space-y-3">
            <div>
              <label className="label">District rattaché *</label>
              <select className="input text-xs bg-slate-50 font-bold" value={form.district_id}
                onChange={e => setForm(p => ({ ...p, district_id: e.target.value }))} required>
                <option value="">-- Sélectionner un district --</option>
                {modalAssemblee.paysDistricts.map(d =>
                  <option key={d.id} value={d.id}>{d.nom_district}</option>
                )}
              </select>
            </div>
            <div>
              <label className="label">Nom de l'Assemblée *</label>
              <input className="input text-xs" placeholder="Assemblée de Lomé Centre"
                value={form.nom_assemblee} onChange={e => setForm(p => ({ ...p, nom_assemblee: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Code <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <input className="input text-xs font-mono" placeholder="TG-001"
                  value={form.code_assemblee} onChange={e => setForm(p => ({ ...p, code_assemblee: e.target.value }))} />
              </div>
              <div>
                <label className="label">Type d'unité</label>
                <select className="input text-xs bg-white font-bold" value={form.type_unite}
                  onChange={e => setForm(p => ({ ...p, type_unite: e.target.value }))}>
                  {['Assemblée', 'Cellule'].map(t =>
                    <option key={t} value={t}>{t}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalAssemblee(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {modalAssemblee.assemblee ? 'Enregistrer' : 'Créer l\'assemblée'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Confirmation suppression */}
      {confirmDel && (
        <Modal title="⚠️ Confirmer la suppression" onClose={() => setConfirmDel(null)}>
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-rose-900 font-extrabold text-sm">
                Êtes-vous sûr de vouloir supprimer <span className="text-rose-700">"{confirmDel.nom}"</span> ?
              </p>
              <p className="text-rose-700 text-xs mt-1 font-semibold">
                ⚠️ Cette action est irréversible et supprimera toutes les données associées.
              </p>
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ONGLET 2 - ASSEMBLEES
// ══════════════════════════════════════════════════════════════════════════════
function OngletAssemblees({ toast, onGererMembres }) {
  const [paysList, setPaysList] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [assemblees, setAssemblees] = useState([]);
  const [filterPays, setFilterPays] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | assemblee object
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const INITIAL_FORM = {
    district_id: '', code_assemblee: '', nom_assemblee: '',
    type_unite: 'Assemblée', pasteur_responsable: '',
    effectif_base: 0, latitude: '', longitude: '',
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, a] = await Promise.all([getPaysStats(), getDistricts(), getAssemblees()]);
      setPaysList(p); setDistricts(d); setAssemblees(a);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Districts filtrés par pays sélectionné
  const districtsFiltres = filterPays
    ? districts.filter(d => String(d.pays_id) === String(filterPays))
    : districts;

  // Assemblées filtrées
  const assembleesFiltrees = assemblees.filter(a => {
    const d = districts.find(dd => String(dd.id) === String(a.district_id));
    const matchPays = !filterPays || (d && String(d.pays_id) === String(filterPays));
    const matchDistrict = !filterDistrict || String(a.district_id) === String(filterDistrict);
    const matchSearch = !search || a.nom_assemblee.toLowerCase().includes(search.toLowerCase()) ||
      (a.pasteur_responsable || '').toLowerCase().includes(search.toLowerCase());
    return matchPays && matchDistrict && matchSearch;
  });

  const openCreate = () => {
    setForm({ ...INITIAL_FORM, district_id: filterDistrict || districts[0]?.id || '' });
    setModal('create');
  };
  const openEdit = (a) => {
    setForm({
      district_id: a.district_id, code_assemblee: a.code_assemblee || '',
      nom_assemblee: a.nom_assemblee, type_unite: a.type_unite || 'Assemblée',
      pasteur_responsable: a.pasteur_responsable || '', effectif_base: a.effectif_base || 0,
      latitude: a.latitude || '', longitude: a.longitude || '',
    });
    setModal(a);
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') await createAssemblee(form);
      else await updateAssemblee(modal.id, form);
      toast(modal === 'create' ? 'Assemblée créée !' : 'Assemblée mise à jour !');
      setModal(null); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await deleteAssemblee(confirmDel.id);
      toast(`${confirmDel.nom_assemblee} supprimée`);
      setConfirmDel(null); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const getDistrictName = (did) => districts.find(d => String(d.id) === String(did))?.nom_district || '-';
  const getPaysFlag = (did) => {
    const d = districts.find(dd => String(dd.id) === String(did));
    const p = paysList.find(pp => String(pp.id) === String(d?.pays_id));
    return FLAG_MAP[p?.code_pays] || '🌐';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-4">
      {/* Filtres & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className="input text-xs py-2 font-bold bg-white w-40"
            value={filterPays} onChange={e => { setFilterPays(e.target.value); setFilterDistrict(''); }}>
            <option value="">🌍 Tous les pays</option>
            {paysList.map(p => <option key={p.id} value={p.id}>{FLAG_MAP[p.code_pays] || '🌐'} {p.nom_pays}</option>)}
          </select>
          <select className="input text-xs py-2 font-bold bg-white w-48"
            value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="">🏛️ Tous les districts</option>
            {districtsFiltres.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input text-xs py-2 pl-8 w-48" placeholder="Rechercher..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl">
            {assembleesFiltrees.length} résultat{assembleesFiltrees.length > 1 ? 's' : ''}
          </span>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 text-xs py-2 px-4">
          <Plus size={15} /> Nouvelle Assemblée
        </button>
      </div>

      {/* Liste - Tableau */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="table-th">Code</th>
              <th className="table-th">Pays</th>
              <th className="table-th">Nom de l'Assemblée</th>
              <th className="table-th">District</th>
              <th className="table-th">Type</th>
              <th className="table-th">Effectif base</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assembleesFiltrees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="font-bold">Aucune assemblée trouvée</p>
                </td>
              </tr>
            ) : assembleesFiltrees.map(a => {
              const dist = districts.find(d => String(d.id) === String(a.district_id));
              const pays = dist ? paysList.find(p => String(p.id) === String(dist.pays_id)) : null;
              return (
                <tr key={a.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <td className="table-td font-mono text-slate-500">{a.code_assemblee || '-'}</td>
                  <td className="table-td">
                    <span className="font-bold text-slate-700">{pays ? (FLAG_MAP[pays.code_pays] || '') + ' ' + pays.nom_pays : '-'}</span>
                  </td>
                  <td className="table-td font-black text-slate-900">{a.nom_assemblee}</td>
                  <td className="table-td text-slate-600 font-semibold">{getDistrictName(a.district_id)}</td>
                  <td className="table-td">
                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-black">{a.type_unite || 'Assemblée'}</span>
                  </td>
                  <td className="table-td font-black text-blue-800">{a.effectif_base || 0}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-0.5">
                      <ActionBtn onClick={() => onGererMembres(a)} icon={Users} title="Membres & Comité" color="green" />
                      <ActionBtn onClick={() => openEdit(a)} icon={Pencil} title="Modifier" color="blue" />
                      <ActionBtn onClick={() => setConfirmDel(a)} icon={Trash2} title="Supprimer" color="red" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Assemblée */}
      {modal && (
        <Modal title={modal === 'create' ? 'Nouvelle Assemblée' : `Modifier - ${modal.nom_assemblee}`}
          onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-2.5">
            <div>
              <label className="label text-[10px]">District rattaché *</label>
              <select className="input text-xs bg-slate-50 font-bold" value={form.district_id}
                onChange={e => setForm(p => ({ ...p, district_id: e.target.value }))} required>
                <option value="">-- Sélectionner --</option>
                {districts.map(d => {
                  const pays = paysList.find(pp => String(pp.id) === String(d.pays_id));
                  return <option key={d.id} value={d.id}>{FLAG_MAP[pays?.code_pays] || '🌐'} {d.nom_district} ({pays?.nom_pays})</option>;
                })}
              </select>
            </div>
            <div>
              <label className="label text-[10px]">Nom de l'Assemblée *</label>
              <input className="input text-xs" placeholder="ex: Assemblée de Lomé-Centre"
                value={form.nom_assemblee} onChange={e => setForm(p => ({ ...p, nom_assemblee: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label text-[10px]">Type</label>
                <select className="input text-xs bg-white font-bold" value={form.type_unite}
                  onChange={e => setForm(p => ({ ...p, type_unite: e.target.value }))}>
                  <option>Assemblée</option>
                  <option>Cellule</option>
                </select>
              </div>
              <div>
                <label className="label text-[10px]">Code <span className="font-normal text-slate-400">(optionnel)</span></label>
                <input className="input text-xs font-mono" placeholder="ex: LOM-C01"
                  value={form.code_assemblee} onChange={e => setForm(p => ({ ...p, code_assemblee: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label text-[10px]">Pasteur Responsable</label>
              <input className="input text-xs" placeholder="ex: Pasteur Jean Dupont"
                value={form.pasteur_responsable} onChange={e => setForm(p => ({ ...p, pasteur_responsable: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label text-[10px]">Effectif de base</label>
                <input type="number" min="0" className="input text-xs" value={form.effectif_base}
                  onChange={e => setForm(p => ({ ...p, effectif_base: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-[10px]">Latitude GPS</label>
                  <input type="number" step="0.000001" className="input text-xs font-mono" placeholder="6.1375"
                    value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
                </div>
                <div>
                  <label className="label text-[10px]">Longitude GPS</label>
                  <input type="number" step="0.000001" className="input text-xs font-mono" placeholder="1.2123"
                    value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary text-xs">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary text-xs">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {modal === 'create' ? "Créer l'assemblée" : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation suppression */}
      {confirmDel && (
        <Modal title="⚠️ Confirmer la suppression" onClose={() => setConfirmDel(null)}>
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-rose-900 font-extrabold text-sm">
                Supprimer <span className="text-rose-700">"{confirmDel.nom_assemblee}"</span> ?
              </p>
              <p className="text-rose-700 text-xs mt-1 font-semibold">Tous les rapports, membres et comité seront supprimés.</p>
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ONGLET 3 - MEMBRES & COMITES
// ══════════════════════════════════════════════════════════════════════════════
function OngletMembres({ toast, initialAssemblee }) {
  const [assemblees, setAssemblees] = useState([]);
  const [selectedAssemblee, setSelectedAssemblee] = useState(initialAssemblee || null);
  const [subTab, setSubTab] = useState('comite'); // 'comite' | 'membres'

  // Comité
  const [comite, setComite] = useState([]);
  const [modalComite, setModalComite] = useState(null);
  const [formComite, setFormComite] = useState({});

  // Membres
  const [membres, setMembres] = useState([]);
  const [membresStats, setMembresStats] = useState(null);
  const [modalMembre, setModalMembre] = useState(null);
  const [formMembre, setFormMembre] = useState({});
  const [filterStatut, setFilterStatut] = useState('');
  const [searchMembre, setSearchMembre] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const INIT_COMITE = { fonction: FONCTIONS_COMITE[0], nom: '', prenoms: '', contact: '', date_entree_fonction: '' };
  const [membreStep, setMembreStep] = useState(1);
  const INIT_MEMBRE = {
    nom: '', prenoms: '', sexe: '', date_naissance: '', contact: '',
    statut_membre: 'Actif', type_membre: 'Membre',
    date_salut: '', date_bapteme: '',
    division_ga: '', situation_matrimoniale: '', nbre_enfants: 0,
    conjoint_sauve: 'Non', quartier: '', activite_assemblee: '',
    profession: '', assiduite: 'Moyen', actif_liberalites: 'Non',
    date_entree_assemblee: '', date_mutation: '', ancienne_assemblee: '', notes: '',
  };

  // Charger les assemblées
  useEffect(() => {
    getAssemblees().then(setAssemblees).catch(e => toast(e.message, 'error'));
  }, [toast]);

  // Quand initialAssemblee change
  useEffect(() => {
    if (initialAssemblee) setSelectedAssemblee(initialAssemblee);
  }, [initialAssemblee]);

  // Charger comité + membres quand assemblée change
  useEffect(() => {
    if (!selectedAssemblee) return;
    loadComite();
    loadMembres();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssemblee]);

  const loadComite = async () => {
    if (!selectedAssemblee) return;
    try { setComite(await getComite(selectedAssemblee.id)); }
    catch (e) { toast(e.message, 'error'); }
  };

  const loadMembres = async () => {
    if (!selectedAssemblee) return;
    try {
      const [m, s] = await Promise.all([getMembres(selectedAssemblee.id), getMembresStats(selectedAssemblee.id)]);
      setMembres(m); setMembresStats(s);
    } catch (e) { toast(e.message, 'error'); }
  };

  // ── Comité CRUD ──
  const saveComite = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalComite === 'create') await addComiteMembre(selectedAssemblee.id, formComite);
      else await updateComiteMembre(modalComite.id, formComite);
      toast(modalComite === 'create' ? 'Membre ajouté au comité !' : 'Comité mis à jour !');
      setModalComite(null); loadComite();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteComiteItem = async (id, nom) => {
    if (!window.confirm(`Supprimer ${nom} du comité ?`)) return;
    try { await deleteComiteMembre(id); loadComite(); toast('Membre retiré du comité'); }
    catch (e) { toast(e.message, 'error'); }
  };

  // ── Membres CRUD ──
  const saveMembre = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalMembre === 'create') await addMembre(selectedAssemblee.id, formMembre);
      else await updateMembre(modalMembre.id, formMembre);
      toast(modalMembre === 'create' ? 'Membre ajouté !' : 'Membre mis à jour !');
      setModalMembre(null); loadMembres();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteMembre = async () => {
    if (!confirmDel) return;
    try {
      await deleteMembre(confirmDel.id);
      toast(`${confirmDel.nom} supprimé`); setConfirmDel(null); loadMembres();
    } catch (e) { toast(e.message, 'error'); }
  };

  const membresFiltres = membres.filter(m => {
    const matchStatut = !filterStatut || m.statut_membre === filterStatut;
    const matchSearch = !searchMembre ||
      `${m.nom} ${m.prenoms || ''}`.toLowerCase().includes(searchMembre.toLowerCase());
    return matchStatut && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Sélecteur d'assemblée */}
      <div className="card border border-slate-200">
        <p className="label mb-2">Assemblée concernée</p>
        <select className="input font-bold bg-slate-50 text-sm"
          value={selectedAssemblee?.id || ''}
          onChange={e => {
            const a = assemblees.find(as => String(as.id) === e.target.value);
            setSelectedAssemblee(a || null);
          }}>
          <option value="">-- Sélectionner une assemblée --</option>
          {assemblees.map(a => (
            <option key={a.id} value={a.id}>{a.nom_assemblee} - {a.nom_district}</option>
          ))}
        </select>
      </div>

      {!selectedAssemblee ? (
        <div className="card text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">Sélectionnez une assemblée pour gérer ses membres et son comité</p>
        </div>
      ) : (
        <>
          {/* En-tête assemblée + stats membres */}
          <div className="card bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">{selectedAssemblee.nom_assemblee}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedAssemblee.nom_district}</p>
              </div>
              {membresStats && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-center">
                    <p className="text-xl font-black text-blue-700">{membresStats.total}</p>
                    <p className="text-[10px] font-extrabold text-slate-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-emerald-600">{membresStats.actifs}</p>
                    <p className="text-[10px] font-extrabold text-slate-500">Actifs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-blue-500">{membresStats.hommes}</p>
                    <p className="text-[10px] font-extrabold text-slate-500">Hommes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-pink-500">{membresStats.femmes}</p>
                    <p className="text-[10px] font-extrabold text-slate-500">Femmes</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sous-onglets */}
          <div className="flex gap-2">
            {[
              { id: 'comite', label: `Comité (${comite.length})` },
              { id: 'membres', label: `Membres (${membres.length})` },
            ].map(st => (
              <button key={st.id} onClick={() => setSubTab(st.id)}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  subTab === st.id
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {st.label}
              </button>
            ))}
          </div>

          {/* ── COMITE ── */}
          {subTab === 'comite' && (
            <div className="card-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="section-title">Comité de l'Assemblée</p>
                <button onClick={() => { setFormComite(INIT_COMITE); setModalComite('create'); }}
                  className="btn-primary gap-1.5 text-xs py-2 px-3">
                  <Plus size={13} /> Ajouter
                </button>
              </div>
              {comite.length === 0 ? (
                <p className="text-center text-slate-400 py-4 font-semibold text-xs">
                  Aucun membre dans le comité
                </p>
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
                          <td className="table-td"><span className="inline-flex px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-black">{m.fonction}</span></td>
                          <td className="table-td text-slate-500">{m.contact || '-'}</td>
                          <td className="table-td text-slate-400 font-mono">{m.date_entree_fonction ? new Date(m.date_entree_fonction).toLocaleDateString('fr-FR') : '-'}</td>
                          <td className="table-td">
                            <div className="flex items-center gap-1">
                              <ActionBtn icon={Pencil} title="Modifier" color="blue"
                                onClick={() => { setFormComite({ fonction: m.fonction, nom: m.nom, prenoms: m.prenoms || '', contact: m.contact || '', date_entree_fonction: m.date_entree_fonction?.split('T')[0] || '' }); setModalComite(m); }} />
                              <ActionBtn icon={Trash2} title="Supprimer" color="red"
                                onClick={() => deleteComiteItem(m.id, m.nom)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── MEMBRES ── */}
          {subTab === 'membres' && (
            <div className="card-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="section-title">Membres de l'Assemblée</p>
                <button onClick={() => { setFormMembre(INIT_MEMBRE); setModalMembre('create'); }}
                  className="btn-primary gap-1.5 text-xs py-2 px-3">
                  <UserPlus size={13} /> Ajouter un membre
                </button>
              </div>

              {/* Filtres membres */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input text-xs py-2 pl-8 w-44" placeholder="Rechercher..."
                    value={searchMembre} onChange={e => setSearchMembre(e.target.value)} />
                </div>
                <select className="input text-xs py-2 font-bold bg-white w-36"
                  value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
                  <option value="">Tous statuts</option>
                  <option>Actif</option>
                  <option>Inactif</option>
                  <option>Visiteur</option>
                </select>
                <span className="text-xs font-extrabold text-slate-400">{membresFiltres.length} membre{membresFiltres.length > 1 ? 's' : ''}</span>
              </div>

              {membres.length === 0 && (
                <p className="text-center text-slate-400 py-2 font-semibold text-sm">
                  Aucun membre enregistré - cliquez sur "+ Ajouter un membre"
                </p>
              )}

              {/* Tableau membres */}
              {membresFiltres.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Nom - Prénoms', 'Sexe', 'Contact', 'Type', 'Statut', ''].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-extrabold text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {membresFiltres.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5">
                            <p className="font-extrabold text-slate-900">{m.nom}</p>
                            <p className="text-slate-500">{m.prenoms || '-'}</p>
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-600">
                            {m.sexe === 'M' ? 'M' : m.sexe === 'F' ? 'F' : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">{m.contact || '-'}</td>
                          <td className="px-3 py-2.5">
                            <span className="badge bg-blue-50 text-blue-800 border border-blue-200 text-[10px]">{m.type_membre}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`badge text-[10px] ${
                              m.statut_membre === 'Actif' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              m.statut_membre === 'Visiteur' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>{m.statut_membre}</span>
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <ActionBtn icon={Pencil} title="Modifier" color="blue" onClick={() => {
                                setFormMembre({
                                  nom: m.nom, prenoms: m.prenoms || '', sexe: m.sexe || '',
                                  date_naissance: m.date_naissance?.split('T')[0] || '',
                                  contact: m.contact || '',
                                  statut_membre: m.statut_membre || 'Actif',
                                  type_membre: m.type_membre || 'Membre',
                                  date_salut: m.date_salut?.split('T')[0] || '',
                                  date_bapteme: m.date_bapteme?.split('T')[0] || '',
                                  division_ga: m.division_ga || '',
                                  situation_matrimoniale: m.situation_matrimoniale || '',
                                  nbre_enfants: m.nbre_enfants || 0,
                                  conjoint_sauve: m.conjoint_sauve || 'Non',
                                  quartier: m.quartier || '',
                                  activite_assemblee: m.activite_assemblee || '',
                                  profession: m.profession || '',
                                  assiduite: m.assiduite || 'Moyen',
                                  actif_liberalites: m.actif_liberalites || 'Non',
                                  date_entree_assemblee: m.date_entree_assemblee?.split('T')[0] || '',
                                  date_mutation: m.date_mutation?.split('T')[0] || '',
                                  ancienne_assemblee: m.ancienne_assemblee || '',
                                  notes: m.notes || '',
                                });
                                setModalMembre(m);
                              }} />
                              <ActionBtn icon={Trash2} title="Supprimer" color="red"
                                onClick={() => setConfirmDel(m)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modalComite && (
        <Modal title={modalComite === 'create' ? 'Ajouter au Comité' : `Modifier - ${modalComite.nom}`}
          onClose={() => setModalComite(null)}>
          <form onSubmit={saveComite} className="space-y-3">
            <div>
              <label className="label">Fonction *</label>
              <select className="input text-xs bg-white font-bold" value={formComite.fonction}
                onChange={e => setFormComite(p => ({ ...p, fonction: e.target.value }))} required>
                {FONCTIONS_COMITE.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom *</label>
                <input className="input text-xs" placeholder="Nom" value={formComite.nom}
                  onChange={e => setFormComite(p => ({ ...p, nom: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Prénoms</label>
                <input className="input text-xs" placeholder="Prénoms" value={formComite.prenoms}
                  onChange={e => setFormComite(p => ({ ...p, prenoms: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Contact (téléphone)</label>
              <input className="input text-xs" placeholder="+228 90 00 00 00" value={formComite.contact}
                onChange={e => setFormComite(p => ({ ...p, contact: e.target.value }))} />
            </div>
            <div>
              <label className="label">Date d'entrée en fonction</label>
              <input type="date" className="input text-xs" value={formComite.date_entree_fonction || ''}
                onChange={e => setFormComite(p => ({ ...p, date_entree_fonction: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModalComite(null)} className="flex-1 btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {modalComite === 'create' ? 'Ajouter au comité' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalMembre && (
        <Modal title={modalMembre === 'create' ? 'Nouveau Membre' : `Modifier - ${modalMembre.nom}`}
          onClose={() => { setModalMembre(null); setMembreStep(1); }}>
          <div className="flex items-center gap-2 mb-3">
            {['Identité', 'Vie spirituelle', 'Organisation'].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  membreStep === i + 1 ? 'bg-blue-700 text-white' :
                  membreStep > i + 1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  <span className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black border border-current">{i + 1}</span>
                  {label}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>
          <form onSubmit={membreStep < 3 ? (e => { e.preventDefault(); setMembreStep(s => s + 1); }) : saveMembre} className="space-y-2.5">
            {membreStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Nom *</label>
                    <input className="input text-xs" placeholder="ex: KOFI" value={formMembre.nom}
                      onChange={e => setFormMembre(p => ({ ...p, nom: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label text-[10px]">Prénom(s)</label>
                    <input className="input text-xs" placeholder="ex: Jean Paul" value={formMembre.prenoms}
                      onChange={e => setFormMembre(p => ({ ...p, prenoms: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label text-[10px]">Sexe</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.sexe}
                      onChange={e => setFormMembre(p => ({ ...p, sexe: e.target.value }))}>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label text-[10px]">Contact</label>
                    <input className="input text-xs" placeholder="ex: +228 90 00 00 00" value={formMembre.contact}
                      onChange={e => setFormMembre(p => ({ ...p, contact: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Quartier / Localité</label>
                    <input className="input text-xs" placeholder="ex: Agbalépédogan" value={formMembre.quartier}
                      onChange={e => setFormMembre(p => ({ ...p, quartier: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label text-[10px]">Profession</label>
                    <input className="input text-xs" placeholder="ex: Enseignant" value={formMembre.profession}
                      onChange={e => setFormMembre(p => ({ ...p, profession: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            {membreStep === 2 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Date du Salut</label>
                    <input type="date" className="input text-xs" value={formMembre.date_salut}
                      onChange={e => setFormMembre(p => ({ ...p, date_salut: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label text-[10px]">Date du Baptême</label>
                    <input type="date" className="input text-xs" value={formMembre.date_bapteme}
                      onChange={e => setFormMembre(p => ({ ...p, date_bapteme: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Assiduité</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.assiduite}
                      onChange={e => setFormMembre(p => ({ ...p, assiduite: e.target.value }))}>
                      <option>Assidu</option><option>Moyen</option><option>Peu assidu</option><option>Absent</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-[10px]">Actif dans les libertés</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.actif_liberalites}
                      onChange={e => setFormMembre(p => ({ ...p, actif_liberalites: e.target.value }))}>
                      <option>Oui</option><option>Non</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label text-[10px]">Activité dans l'Assemblée</label>
                  <input className="input text-xs" placeholder="ex: Louange, Intercession..." value={formMembre.activite_assemblee}
                    onChange={e => setFormMembre(p => ({ ...p, activite_assemblee: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label text-[10px]">Situation matrimoniale</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.situation_matrimoniale}
                      onChange={e => setFormMembre(p => ({ ...p, situation_matrimoniale: e.target.value }))}>
                      <option value="">- Sélectionner</option>
                      <option>Célibataire</option><option>Marié(e)</option>
                      <option>Veuf / Veuve</option><option>Divorcé(e)</option><option>Séparé(e)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-[10px]">Nbre d'enfants</label>
                    <input type="number" min="0" className="input text-xs" value={formMembre.nbre_enfants}
                      onChange={e => setFormMembre(p => ({ ...p, nbre_enfants: parseInt(e.target.value)||0 }))} />
                  </div>
                  <div>
                    <label className="label text-[10px]">Conjoint sauvé ?</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.conjoint_sauve}
                      onChange={e => setFormMembre(p => ({ ...p, conjoint_sauve: e.target.value }))}>
                      <option>Oui</option><option>Non</option><option>Célibataire</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            {membreStep === 3 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label text-[10px]">Type de membre</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.type_membre}
                      onChange={e => setFormMembre(p => ({ ...p, type_membre: e.target.value }))}>
                      <option>Membre</option><option>Prédicateur</option><option>Pasteur</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-[10px]">Statut</label>
                    <select className="input text-xs bg-white font-bold" value={formMembre.statut_membre}
                      onChange={e => setFormMembre(p => ({ ...p, statut_membre: e.target.value }))}>
                      <option>Actif</option><option>Inactif</option><option>Visiteur</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-[10px]">Divisions (GA)</label>
                    <input className="input text-xs" placeholder="ex: GA Femmes" value={formMembre.division_ga}
                      onChange={e => setFormMembre(p => ({ ...p, division_ga: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label text-[10px]">Date entrée Ass.</label>
                    <input type="date" className="input text-xs" value={formMembre.date_entree_assemblee}
                      onChange={e => setFormMembre(p => ({ ...p, date_entree_assemblee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label text-[10px]">Date mutation</label>
                    <input type="date" className="input text-xs" value={formMembre.date_mutation}
                      onChange={e => setFormMembre(p => ({ ...p, date_mutation: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label text-[10px]">Ancienne assemblée</label>
                    <input className="input text-xs" placeholder="ex: Assemblée Tokoin" value={formMembre.ancienne_assemblee}
                      onChange={e => setFormMembre(p => ({ ...p, ancienne_assemblee: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label text-[10px]">Notes / Observations</label>
                  <textarea className="input text-xs" rows={2} placeholder="ex: Observations diverses..."
                    value={formMembre.notes} onChange={e => setFormMembre(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              {membreStep > 1 && (
                <button type="button" onClick={() => setMembreStep(s => s - 1)} className="btn-secondary text-xs px-4">Précédent</button>
              )}
              <button type="button" onClick={() => { setModalMembre(null); setMembreStep(1); }}
                className={`${membreStep === 1 ? 'flex-1' : ''} btn-secondary text-xs`}>Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary text-xs">
                {saving ? <Loader2 size={13} className="animate-spin" /> :
                  membreStep < 3 ? <ChevronRight size={13} /> : <UserPlus size={13} />}
                {membreStep < 3 ? 'Suivant' : (modalMembre === 'create' ? 'Ajouter le membre' : 'Enregistrer')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation suppression membre */}
      {confirmDel && (
        <Modal title="⚠️ Supprimer ce membre ?" onClose={() => setConfirmDel(null)}>
          <div className="space-y-4">
            <p className="text-rose-800 font-extrabold text-sm">
              Supprimer <span className="text-rose-600">"{confirmDel.nom} {confirmDel.prenoms || ''}"</span> de l'assemblée ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleDeleteMembre}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE - GestionPaysPage
// ══════════════════════════════════════════════════════════════════════════════
export default function GestionPaysPage() {
  const [activeTab, setActiveTab] = useState('pays');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [gererMembresAssemblee, setGererMembresAssemblee] = useState(null);

  const toast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleGererMembres = (assemblee) => {
    setGererMembresAssemblee(assemblee);
    setActiveTab('membres');
  };

  return (
    <div className="p-3 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Gestion Multi-Pays - LWM Afrique</h1>
        <p className="text-slate-500 text-sm font-semibold mt-1">
          Administration des pays, districts, assemblées, comités et membres
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all border-b-2 ${
              activeTab === tab.id
                ? 'bg-blue-700 text-white border-blue-700 shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      {activeTab === 'pays'       && <OngletPays toast={toast} />}
      {activeTab === 'assemblees' && <OngletAssemblees toast={toast} onGererMembres={handleGererMembres} />}
      {activeTab === 'membres'    && <OngletMembres toast={toast} initialAssemblee={gererMembresAssemblee} />}

      {/* Toast */}
      <Toast msg={toastMsg} type={toastType} />
    </div>
  );
}
