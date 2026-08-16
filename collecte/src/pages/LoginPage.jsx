import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister, getPays, getDistricts } from '../api';
import { LogIn, UserPlus, Mail, Lock, User, Building2, Eye, EyeOff, CheckCircle, Clock, AlertCircle, ArrowLeft, Globe, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'pending' | 'success'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listePays, setListePays] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    nom: '',
    email: '',
    password: '',
    confirm: '',
    role_demande: 'RAPPORTEUR_ASSEMBLEE',
    pays_id: '',
    district_id: ''
  });

  // Détection de session expirée
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setSessionExpired(true);
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    getPays()
      .then(p => {
        setListePays(p);
        const togo = p.find(item => item.code_pays === 'TG');
        if (togo) {
          setRegisterForm(f => ({ ...f, pays_id: String(togo.id) }));
          getDistricts(togo.id).then(setDistricts).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handlePaysChange = (paysId) => {
    setRegisterForm(p => ({ ...p, pays_id: paysId, district_id: '' }));
    if (paysId) {
      getDistricts(paysId).then(setDistricts).catch(() => {});
    } else {
      setDistricts([]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      if (err.message === 'PENDING') {
        setMode('pending');
      } else {
        setError(err.message || 'Identifiants incorrects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (registerForm.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await apiRegister({
        nom: registerForm.nom,
        email: registerForm.email,
        password: registerForm.password,
        role_demande: registerForm.role_demande,
        pays_id: registerForm.pays_id || undefined,
        district_id: registerForm.district_id || undefined,
      });
      setMode('success');
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-100 font-sans">

      {/* ── PANNEAU GAUCHE - Branding LWM ── */}
      <div
        className="hidden lg:flex lg:w-1/2 h-full relative flex-col justify-between items-center text-center px-10 py-4 overflow-hidden select-none"
        style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0F3866 40%, #155293 75%, #1E6BB8 100%)' }}
      >
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url(/login_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center space-y-4 pt-2">
          {/* Logo + Nom en ligne */}
          <div className="w-full flex items-center justify-center gap-4 text-left">
            <div className="w-14 h-14 rounded-lg bg-white p-1 shadow-md flex items-center justify-center border-2 border-blue-200/60 shrink-0">
              <img src="/lwm.jpg" alt="Logo LWM" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-wide leading-tight">LIFE WORD MISSION</p>
              <p className="text-amber-300 text-xs font-black tracking-widest uppercase">TLWM - TOGO</p>
            </div>
          </div>

          {/* Message de bienvenue */}
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black text-white leading-tight mb-2 tracking-tight">
              Bienvenue sur<br />
              <span className="text-blue-300">la plateforme</span><br />
              des données LWM
            </h1>
            <div className="w-12 h-1 bg-amber-400/80 rounded-full mb-3" />
            <p className="text-blue-100 text-sm leading-relaxed font-medium text-center">
              Plateforme officielle de collecte, suivi et analyse des activités missionnaires et financières de LWM Afrique.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 w-full pt-1">
            {[{ val: '7', label: 'Pays' }, { val: '13', label: 'Districts' }, { val: '129', label: 'Assemblées' }].map(({ val, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-md rounded-lg py-3 px-2 text-center border border-white/15 shadow-sm">
                <p className="text-white text-2xl font-black">{val}</p>
                <p className="text-blue-200 text-[10px] font-extrabold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full text-center">
          <p className="text-blue-200/80 text-[11px] font-medium">
            © 2026 Life Word Mission - Système de Collecte & Administration
          </p>
        </div>
      </div>

      {/* ── PANNEAU DROIT - Formulaire ── */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center px-6 py-3 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md my-auto">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-6 justify-center">
            <img src="/lwm.jpg" alt="Logo LWM" className="w-12 h-12 object-contain rounded-xl shadow-md border border-slate-200 shrink-0" />
            <div className="text-left">
              <p className="font-black text-slate-900 text-base leading-tight">LIFE WORD MISSION</p>
              <p className="text-blue-700 text-xs font-black uppercase tracking-wider">TLWM - TOGO</p>
            </div>
          </div>

          {/* ══ CONNEXION ══ */}
          {mode === 'login' && (
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">Connexion</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Saisissez vos identifiants pour accéder à l'interface</p>
              </div>

              {/* Bannière session expirée */}
              {sessionExpired && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-lg p-3.5 mb-5 text-amber-800 text-xs font-bold">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-black">Session expirée</p>
                    <p className="font-semibold mt-0.5 text-amber-700">Votre session a expiré (durée max : 24h). Reconnectez-vous pour continuer.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-lg p-3.5 mb-5 text-rose-700 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Adresse email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="votre.email@tlwm.tg"
                      value={loginForm.email}
                      onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                      className="input pl-11 py-3 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Mot de passe</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      className="input pl-11 pr-11 py-3 text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-700/25 text-sm">
                  {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <LogIn size={18} />}
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-slate-600 text-sm font-medium">
                  Pas encore de compte ?{' '}
                  <button onClick={() => { setMode('register'); setError(''); }} className="text-blue-700 font-extrabold hover:underline">
                    Demander un accès
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ══ INSCRIPTION ══ */}
          {mode === 'register' && (
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { setMode('login'); setError(''); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <ArrowLeft size={18} className="text-slate-600" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Demander un accès</h2>
                  <p className="text-slate-500 text-xs font-semibold">Validation par l'administrateur requise</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-blue-900 text-xs font-semibold">
                <Clock size={14} className="shrink-0 mt-0.5 text-blue-600" />
                <span>Après inscription, un administrateur validera votre profil avant accès.</span>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-3 text-rose-700 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-2.5">
                {/* Nom */}
                <div>
                  <label className="label">Nom complet *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Pasteur Jean Dupont"
                      value={registerForm.nom}
                      onChange={e => setRegisterForm(p => ({ ...p, nom: e.target.value }))}
                      className="input pl-10 py-2 text-xs font-bold" required />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="label">Adresse email *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" placeholder="votre.email@tlwm.tg"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                      className="input pl-10 py-2 text-xs font-bold" required />
                  </div>
                </div>

                {/* Pays + Niveau */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Pays *</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select value={registerForm.pays_id}
                        onChange={e => handlePaysChange(e.target.value)}
                        className="input pl-8 py-2 text-xs font-bold bg-white appearance-none" required>
                        <option value="">-- Sélectionner --</option>
                        {listePays.map(p => <option key={p.id} value={p.id}>{p.nom_pays}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Niveau d'accès *</label>
                    <select value={registerForm.role_demande}
                      onChange={e => setRegisterForm(p => ({ ...p, role_demande: e.target.value }))}
                      className="input py-2 text-xs font-bold bg-white appearance-none" required>
                      <option value="RAPPORTEUR_ASSEMBLEE">Rapporteur Assemblée</option>
                      <option value="SUPERVISEUR_DISTRICT">🏛️ Superviseur District</option>
                      <option value="ADMIN_PAYS">🌍 Admin National</option>
                      <option value="ADMIN_AFRIQUE">Admin Afrique</option>
                    </select>
                  </div>
                </div>

                {/* District (conditionnel) */}
                {(registerForm.role_demande === 'SUPERVISEUR_DISTRICT' || registerForm.role_demande === 'RAPPORTEUR_ASSEMBLEE') && (
                  <div>
                    <label className="label">District rattaché</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select value={registerForm.district_id}
                        onChange={e => setRegisterForm(p => ({ ...p, district_id: e.target.value }))}
                        className="input pl-8 py-2 text-xs font-bold bg-white appearance-none">
                        <option value="">-- Sélectionner le district --</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.nom_district}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Mots de passe */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Mot de passe *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="••••••"
                        value={registerForm.password}
                        onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                        className="input pl-8 py-2 text-xs font-bold" required minLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Confirmer *</label>
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••"
                      value={registerForm.confirm}
                      onChange={e => setRegisterForm(p => ({ ...p, confirm: e.target.value }))}
                      className="input px-3 py-2 text-xs font-bold" required />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500">
                  <input type="checkbox" className="rounded" onChange={() => setShowPassword(v => !v)} />
                  Afficher les mots de passe
                </label>

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-700/25 text-xs">
                  {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UserPlus size={15} />}
                  {loading ? 'Soumission...' : 'Créer mon compte'}
                </button>
              </form>
            </div>
          )}

          {/* ══ SUCCÈS ══ */}
          {mode === 'success' && (
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Demande envoyée !</h2>
              <p className="text-slate-600 text-xs mb-5 leading-relaxed font-medium">
                Votre demande a été transmise avec succès. En attente de validation par l'administration LWM.
              </p>
              <button onClick={() => setMode('login')} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-xs">
                Retour à la connexion
              </button>
            </div>
          )}

          {/* ══ EN ATTENTE ══ */}
          {mode === 'pending' && (
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Clock size={32} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Compte en attente</h2>
              <p className="text-slate-600 text-xs mb-5 leading-relaxed font-medium">
                Votre compte est en cours d'examen par l'administrateur. Réessayez plus tard.
              </p>
              <button onClick={() => setMode('login')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                <ArrowLeft size={15} /> Retour
              </button>
            </div>
          )}

          <p className="text-center text-[11px] font-semibold text-slate-400 mt-4">
            Life Word Mission - Afrique · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
