import React, { useState, useEffect } from 'react';
import { Users, Building2, Plus, Trash2, Search, BookOpen } from 'lucide-react';
import { getDistricts, getAssemblees, createAssemblee, getComite, addComiteMembre, deleteComiteMembre } from '../api';

const FONCTIONS_COMITE = [
  'Pasteur principal', 'Pasteur secondaire', 'Les conseillers',
  'Secrétaire principal(e)', 'Porte parole Famille',
  'Trésorier(ère)', 'Responsable Jeunesse', 'Évangéliste',
];

export default function ReferentielPage() {
  const [activeTab, setActiveTab] = useState('assemblees');
  const [districts, setDistricts] = useState([]);
  const [assemblees, setAssemblees] = useState([]);
  const [selectedAssemblee, setSelectedAssemblee] = useState(null);
  const [comite, setComite] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddAssemblee, setShowAddAssemblee] = useState(false);
  const [showAddMembre, setShowAddMembre] = useState(false);

  // Form state
  const [asmForm, setAsmForm] = useState({ nom_assemblee: '', district_id: '', type_unite: 'Assemblée', pasteur_responsable: '', effectif_base: '' });
  const [membreForm, setMembreForm] = useState({ fonction: 'Pasteur principal', nom: '', prenoms: '', contact: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAssemblee) loadComite(selectedAssemblee.id);
  }, [selectedAssemblee]);

  async function loadData() {
    setLoading(true);
    try {
      const [d, a] = await Promise.all([getDistricts(), getAssemblees()]);
      setDistricts(d);
      setAssemblees(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadComite(assembleeId) {
    try {
      const c = await getComite(assembleeId);
      setComite(c);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddAssemblee(e) {
    e.preventDefault();
    try {
      await createAssemblee({ ...asmForm, effectif_base: parseInt(asmForm.effectif_base) || 0 });
      setShowAddAssemblee(false);
      setAsmForm({ nom_assemblee: '', district_id: '', type_unite: 'Assemblée', pasteur_responsable: '', effectif_base: '' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddMembre(e) {
    e.preventDefault();
    if (!selectedAssemblee) return;
    try {
      await addComiteMembre(selectedAssemblee.id, membreForm);
      setShowAddMembre(false);
      setMembreForm({ fonction: 'Pasteur principal', nom: '', prenoms: '', contact: '' });
      await loadComite(selectedAssemblee.id);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteMembre(id) {
    if (!confirm('Supprimer ce membre du comité ?')) return;
    try {
      await deleteComiteMembre(id);
      await loadComite(selectedAssemblee.id);
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredAssemblees = assemblees.filter(a => {
    const matchSearch = a.nom_assemblee?.toLowerCase().includes(search.toLowerCase());
    const matchDistrict = filterDistrict ? String(a.district_id) === String(filterDistrict) : true;
    return matchSearch && matchDistrict;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestion du Référentiel</h1>
          <p className="text-slate-600 text-sm font-bold mt-0.5">Districts, Assemblées, Cellules et Comités locaux</p>
        </div>
        <button onClick={() => setShowAddAssemblee(true)} className="btn-primary">
          <Plus size={18} /> Nouvelle assemblée
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b-2 border-slate-300">
        {[{ id: 'assemblees', label: 'Assemblées & Cellules', icon: Building2 },
          { id: 'comite', label: 'Comités de Structure', icon: Users }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-3 text-sm font-black border-b-4 transition-all -mb-0.5
              ${activeTab === tab.id ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB : ASSEMBLEES ── */}
      {activeTab === 'assemblees' && (
        <div className="card space-y-4">
          {/* Filtres */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-10 text-sm" placeholder="Rechercher une assemblée par nom..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-56 text-sm font-bold bg-slate-50" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
              <option value="">Tous les districts</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Nom de l\'Assemblée', 'Type', 'District', 'Pasteur Responsable', 'Effectif Base'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssemblees.length === 0 ? (
                  <tr><td colSpan={5} className="table-td text-center text-slate-500 py-2 font-bold">Aucune assemblée trouvée</td></tr>
                ) : filteredAssemblees.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-black text-slate-900">{a.nom_assemblee}</td>
                    <td className="table-td">
                      <span className={`badge ${a.type_unite === 'Cellule' ? 'bg-purple-100 text-purple-900 border border-purple-300 font-black' : 'bg-blue-100 text-blue-900 border border-blue-300 font-black'}`}>
                        {a.type_unite}
                      </span>
                    </td>
                    <td className="table-td font-bold text-slate-700">{a.nom_district}</td>
                    <td className="table-td text-slate-800 font-bold">{a.pasteur_responsable || '-'}</td>
                    <td className="table-td font-black text-emerald-800">{a.effectif_base || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs font-black text-slate-600">{filteredAssemblees.length} unités répertoriées</p>
        </div>
      )}

      {/* ── TAB : COMITES ── */}
      {activeTab === 'comite' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Colonne 1 : Sélection assemblée */}
          <div className="card col-span-1 space-y-2 overflow-y-auto max-h-[65vh]">
            <p className="card-title">Sélectionner une Assemblée</p>
            {assemblees.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAssemblee(a)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${selectedAssemblee?.id === a.id ? 'bg-blue-50 border-blue-600 text-blue-950 font-black shadow-sm' : 'border-slate-200 text-slate-800 hover:bg-slate-50 font-bold'}`}
              >
                <p className="font-black truncate">{a.nom_assemblee}</p>
                <p className="text-xs text-slate-600 font-bold">{a.nom_district}</p>
              </button>
            ))}
          </div>

          {/* Colonne 2&3 : Comité */}
          <div className="card col-span-2">
            {!selectedAssemblee ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <BookOpen size={40} className="mb-3 opacity-30 text-slate-400" />
                <p className="font-extrabold text-slate-700">Choisissez une assemblée dans la liste à gauche</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200">
                  <div>
                    <h3 className="font-black text-xl text-slate-900">{selectedAssemblee.nom_assemblee}</h3>
                    <p className="text-xs font-black text-blue-800">District {selectedAssemblee.nom_district}</p>
                  </div>
                  <button onClick={() => setShowAddMembre(true)} className="btn-primary text-sm">
                    <Plus size={16} /> Membre de comité
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Fonction', 'Nom', 'Prénoms', 'Contact', 'Action'].map(h => <th key={h} className="table-th">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {comite.length === 0 ? (
                        <tr><td colSpan={5} className="table-td text-center text-slate-500 py-2 font-bold">Aucun membre enregistré dans le comité de cette assemblée</td></tr>
                      ) : comite.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="table-td font-black text-blue-900">{m.fonction}</td>
                          <td className="table-td font-black text-slate-900">{m.nom}</td>
                          <td className="table-td text-slate-800 font-bold">{m.prenoms}</td>
                          <td className="table-td text-slate-700 font-mono text-xs font-bold">{m.contact || '-'}</td>
                          <td className="table-td">
                            <button onClick={() => handleDeleteMembre(m.id)} className="btn-danger text-xs px-2.5 py-1">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL : Ajouter Assemblée ── */}
      {showAddAssemblee && (
        <Modal title="Nouvelle Assemblée ou Cellule" onClose={() => setShowAddAssemblee(false)}>
          <form onSubmit={handleAddAssemblee} className="space-y-4">
            <div>
              <label className="label">Nom de l'assemblée / cellule *</label>
              <input className="input" value={asmForm.nom_assemblee} onChange={e => setAsmForm(p => ({ ...p, nom_assemblee: e.target.value }))} required />
            </div>
            <div>
              <label className="label">District rattaché *</label>
              <select className="input font-bold bg-slate-50" value={asmForm.district_id} onChange={e => setAsmForm(p => ({ ...p, district_id: e.target.value }))} required>
                <option value="">-- Sélectionner --</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type d'unité</label>
                <select className="input font-bold bg-slate-50" value={asmForm.type_unite} onChange={e => setAsmForm(p => ({ ...p, type_unite: e.target.value }))}>
                  <option>Assemblée</option>
                  <option>Cellule</option>
                </select>
              </div>
              <div>
                <label className="label">Effectif de base</label>
                <input type="number" className="input" value={asmForm.effectif_base} onChange={e => setAsmForm(p => ({ ...p, effectif_base: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Pasteur / Responsable principal</label>
              <input className="input" value={asmForm.pasteur_responsable} onChange={e => setAsmForm(p => ({ ...p, pasteur_responsable: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-3">
              <button type="submit" className="btn-primary flex-1 justify-center">Enregistrer l'unité</button>
              <button type="button" onClick={() => setShowAddAssemblee(false)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL : Ajouter Membre Comité ── */}
      {showAddMembre && (
        <Modal title="Ajouter un membre au comité" onClose={() => setShowAddMembre(false)}>
          <form onSubmit={handleAddMembre} className="space-y-4">
            <div>
              <label className="label">Fonction dans le comité *</label>
              <select className="input font-bold bg-slate-50" value={membreForm.fonction} onChange={e => setMembreForm(p => ({ ...p, fonction: e.target.value }))}>
                {FONCTIONS_COMITE.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom *</label>
                <input className="input" value={membreForm.nom} onChange={e => setMembreForm(p => ({ ...p, nom: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Prénoms</label>
                <input className="input" value={membreForm.prenoms} onChange={e => setMembreForm(p => ({ ...p, prenoms: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Contact (Téléphone)</label>
              <input className="input" value={membreForm.contact} onChange={e => setMembreForm(p => ({ ...p, contact: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-3">
              <button type="submit" className="btn-primary flex-1 justify-center">Ajouter le membre</button>
              <button type="button" onClick={() => setShowAddMembre(false)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-5 border-b-2 border-slate-200 bg-slate-50">
          <h3 className="font-black text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl font-bold leading-none">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
