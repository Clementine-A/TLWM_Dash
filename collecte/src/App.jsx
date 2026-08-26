import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RapportAssembleePage from './pages/RapportAssembleePage';
import RapportDistrictPage from './pages/RapportDistrictPage';
import RapportNationalPage from './pages/RapportNationalPage';
import GestionPaysPage from './pages/GestionPaysPage';
import GestionUtilisateursPage from './pages/GestionUtilisateursPage';
import {
  LayoutDashboard, Building2, ClipboardList,
  Globe, LogOut, ChevronLeft, ChevronRight, UserCheck, MapPin, Users, BookOpen
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Hiérarchie des rôles (du plus élevé au plus bas) :
//   ADMIN_AFRIQUE  → Accès tout : tous les pays, districts, assemblées
//   ADMIN_PAYS     → Accès à son pays : tous ses districts et assemblées
//   SUPERVISEUR_DISTRICT → Accès à son district et ses assemblées
//   RAPPORTEUR_ASSEMBLEE → Saisie uniquement pour son assemblée
// ──────────────────────────────────────────────────────────────────────────────

const ALL_ROLES = ['ADMIN_AFRIQUE', 'ADMIN_PAYS', 'SUPERVISEUR_DISTRICT', 'RAPPORTEUR_ASSEMBLEE', 'ADMIN', 'SUPERVISEUR', 'RAPPORTEUR'];
const HIGH_ROLES = ['ADMIN_AFRIQUE', 'ADMIN_PAYS', 'ADMIN'];
const MID_ROLES = ['ADMIN_AFRIQUE', 'ADMIN_PAYS', 'SUPERVISEUR_DISTRICT', 'ADMIN', 'SUPERVISEUR'];

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    roles: MID_ROLES,
    desc: 'Vue consolidée nationale'
  },
  {
    id: 'pays',
    label: 'Gestion des Pays',
    icon: Globe,
    roles: ['ADMIN_AFRIQUE', 'ADMIN'],
    desc: 'Multi-pays Afrique'
  },
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    icon: Users,
    roles: ['ADMIN_AFRIQUE', 'ADMIN_PAYS', 'ADMIN'],
    desc: 'Comptes & accès'
  },
  {
    id: 'rapport-assemblee',
    label: 'Rapport Assemblée',
    icon: Building2,
    roles: ALL_ROLES,
    desc: 'Saisie mensuelle locale'
  },
  {
    id: 'rapport-district',
    label: 'Rapport District',
    icon: ClipboardList,
    roles: MID_ROLES,
    desc: 'Activités du district'
  },
  {
    id: 'rapport-national',
    label: 'Rapport National',
    icon: BookOpen,
    roles: HIGH_ROLES,
    desc: 'Activités par pays'
  },
];

const ROLE_LABELS = {
  ADMIN_AFRIQUE:        { label: 'Admin Afrique',        color: 'bg-amber-400/20 text-amber-300 border border-amber-400/40' },
  ADMIN_PAYS:           { label: 'Admin National',       color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
  SUPERVISEUR_DISTRICT: { label: 'Superviseur District', color: 'bg-blue-400/20 text-blue-300 border border-blue-400/30' },
  RAPPORTEUR_ASSEMBLEE: { label: 'Rapporteur Assemblée', color: 'bg-slate-600/60 text-slate-300 border border-slate-500/50' },
  // Rétrocompatibilité
  ADMIN:      { label: 'Admin Afrique',        color: 'bg-amber-400/20 text-amber-300 border border-amber-400/40' },
  SUPERVISEUR:{ label: 'Superviseur District', color: 'bg-blue-400/20 text-blue-300 border border-blue-400/30' },
  RAPPORTEUR: { label: 'Rapporteur Assemblée', color: 'bg-slate-600/60 text-slate-300 border border-slate-500/50' },
};

// GestionPaysPage est importé depuis son fichier dédié

// ──────────────────────────────────────────────────────────────────────────────
// Layout principal de l'application (après connexion)
// ──────────────────────────────────────────────────────────────────────────────
function AppLayout() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || '';

  // Filtrer le menu selon le rôle de l'utilisateur connecté
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role));
  const currentPage = visibleNav.find(n => n.id === activePage) ? activePage : visibleNav[0]?.id;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':         return <AdminDashboardPage />;
      case 'pays':              return <GestionPaysPage />;
      case 'utilisateurs':      return <GestionUtilisateursPage />;
      case 'rapport-assemblee': return <RapportAssembleePage />;
      case 'rapport-district':  return <RapportDistrictPage />;
      case 'rapport-national':  return <RapportNationalPage />;
      default:                  return <AdminDashboardPage />;
    }
  };

  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.RAPPORTEUR;

  // Contexte de portée affiché dans l'en-tête selon le rôle
  const scopeLabel = () => {
    if (role === 'ADMIN_AFRIQUE' || role === 'ADMIN') return 'Afrique - Tous pays';
    if (role === 'ADMIN_PAYS') return user?.nom_pays || 'National';
    if (role === 'SUPERVISEUR_DISTRICT' || role === 'SUPERVISEUR') return `District - ${user?.nom_district || 'Mon district'}`;
    return `Assemblée - ${user?.nom_assemblee || 'Mon assemblée'}`;
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans text-slate-900">

      {/* ── Sidebar Bleu Marine Solide (#0A2540) ── */}
      <aside className={`flex flex-col transition-all duration-300 shadow-xl z-30 bg-[#0A2540] ${collapsed ? 'w-20' : 'w-64'}`}>

        {/* En-tête : Logo + Titre */}
        <div className="flex items-center gap-3.5 px-4 py-5 border-b border-[#163D66]">
          <div className="w-11 h-11 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
            <img src="/lwm.jpg" alt="Logo LWM" className="w-full h-full object-contain rounded-xl" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-black text-white text-sm leading-tight tracking-tight">LIFE WORD MISSION</p>
              <p className="text-amber-300/90 text-[10px] font-black uppercase tracking-widest">Plateforme Afrique</p>
            </div>
          )}
        </div>

        {/* Contexte de portée de l'utilisateur */}
        {!collapsed && (
          <div className="px-4 py-2.5 bg-[#0D2D4E] border-b border-[#163D66]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Portée d'accès</p>
            <p className="text-xs font-extrabold text-amber-300 truncate">🌐 {scopeLabel()}</p>
          </div>
        )}

        {/* Navigation principale - espacement réduit */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                title={collapsed ? item.label : ''}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-extrabold transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-300 border-l-4 border-amber-400 border-y border-r border-amber-400/30'
                    : 'text-slate-300 hover:bg-[#12365F] hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <item.icon size={17} className={`shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-white'}`} />
                {!collapsed && (
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs leading-tight">{item.label}</p>
                    {!isActive && <p className="text-[10px] text-slate-500 group-hover:text-slate-300 truncate leading-tight">{item.desc}</p>}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pied : Déconnexion seulement */}
        <div className="border-t border-[#163D66] p-2 bg-[#0A2540]">
          <button
            onClick={logout}
            title="Déconnexion"
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-extrabold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center justify-center py-1.5 text-slate-500 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>

      {/* ── Zone Contenu ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Bandeau supérieur */}
        <header className="bg-[#0A2540] px-6 py-3.5 shadow-md flex items-center justify-between border-b border-[#163D66] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-black text-amber-300/90 uppercase tracking-widest">Plateforme Multi-Pays - Life Word Mission</p>
              <h2 className="text-base font-black text-white tracking-tight">
                {currentPage === 'dashboard'         && 'Tableau de Bord'}
                {currentPage === 'pays'              && 'Gestion des Pays'}
                {currentPage === 'utilisateurs'      && 'Gestion des Utilisateurs'}
                {currentPage === 'rapport-assemblee'  && 'Rapport Assemblée'}
                {currentPage === 'rapport-district'   && 'Rapport District'}
                {currentPage === 'rapport-national'   && 'Rapport National'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#12365F] border border-blue-900/60 px-3 py-1.5 rounded-xl text-xs font-black text-white">
              <UserCheck size={14} className="text-amber-300" />
              <span className="text-xs">{user?.nom}</span>
            </div>
            <span className={`badge text-[10px] px-2.5 py-1 ${roleInfo.color}`}>{roleInfo.label}</span>
          </div>
        </header>

        {/* Corps de la page */}
        <main className="flex-1 overflow-y-auto p-5 bg-[#F1F5F9]">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Racine de l'application
// ──────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-amber-300 text-base font-extrabold tracking-wide">Chargement de la plateforme TLWM...</p>
        </div>
      </div>
    );
  }

  return user ? <AppLayout /> : <LoginPage />;
}

export default App;
