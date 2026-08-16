// Service API - Toutes les requêtes vers le backend Node.js/Express
const BASE_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('tlwm_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  // Si le token est invalide ou expiré → déconnexion automatique
  if (res.status === 401 || res.status === 403) {
    const msg = data.error || '';
    const isTokenError = msg.includes('invalide') || msg.includes('expiré') ||
                         msg.includes('autorisé') || msg.includes('expired');
    if (isTokenError) {
      localStorage.removeItem('tlwm_token');
      localStorage.removeItem('tlwm_user');
      // Redirection vers login avec message
      window.location.href = '/?session=expired';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
  }

  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

export const register = (data) =>
  request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const getAdminUtilisateurs = (filters = {}) => {
  const q = new URLSearchParams(filters).toString();
  return request(`/admin/utilisateurs${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const createAdminUtilisateur = (data) =>
  request('/admin/utilisateurs', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updateAdminUtilisateur = (id, data) =>
  request(`/admin/utilisateurs/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updateUserStatut = (id, statut, role) =>
  request(`/admin/utilisateurs/${id}/statut`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ statut, role }),
  });

export const resetUserPassword = (id, new_password) =>
  request(`/admin/utilisateurs/${id}/reset-password`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ new_password }),
  });

export const deleteAdminUtilisateur = (id) =>
  request(`/admin/utilisateurs/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Référentiel - Pays ──────────────────────────────────────────────────────
export const getPays = () =>
  request('/referentiel/pays');

export const getPaysStats = () =>
  request('/referentiel/pays-stats');

export const createPays = (data) =>
  request('/referentiel/pays', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updatePays = (id, data) =>
  request(`/referentiel/pays/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });

export const deletePays = (id) =>
  request(`/referentiel/pays/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Référentiel - Districts ─────────────────────────────────────────────────
export const getDistricts = (paysId) =>
  request(`/referentiel/districts${paysId ? `?pays_id=${paysId}` : ''}`, { headers: authHeaders() });

export const createDistrict = (data) =>
  request('/referentiel/districts', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updateDistrict = (id, data) =>
  request(`/referentiel/districts/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });

export const deleteDistrict = (id) =>
  request(`/referentiel/districts/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Référentiel - Assemblées ────────────────────────────────────────────────
export const getAssemblees = (districtId) =>
  request(`/referentiel/assemblees${districtId ? `?district_id=${districtId}` : ''}`, { headers: authHeaders() });

export const createAssemblee = (data) =>
  request('/referentiel/assemblees', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updateAssemblee = (id, data) =>
  request(`/referentiel/assemblees/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });

export const deleteAssemblee = (id) =>
  request(`/referentiel/assemblees/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Comité d'Assemblée ──────────────────────────────────────────────────────
export const getComite = (assembleeId) =>
  request(`/comite/${assembleeId}`, { headers: authHeaders() });

export const addComiteMembre = (assembleeId, data) =>
  request(`/comite/${assembleeId}`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updateComiteMembre = (id, data) =>
  request(`/comite/membre/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });

export const deleteComiteMembre = (id) =>
  request(`/comite/membre/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Membres d'Assemblée ─────────────────────────────────────────────────────
export const getMembres = (assembleeId, filters = {}) => {
  const q = new URLSearchParams(filters).toString();
  return request(`/membres/${assembleeId}${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const getMembresStats = (assembleeId) =>
  request(`/membres/${assembleeId}/stats`, { headers: authHeaders() });

export const addMembre = (assembleeId, data) =>
  request(`/membres/${assembleeId}`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

export const updateMembre = (id, data) =>
  request(`/membres/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });

export const deleteMembre = (id) =>
  request(`/membres/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Rapports Assemblée ──────────────────────────────────────────────────────
export const getRapportsAssemblee = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/rapports/assemblee${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const submitRapportAssemblee = (data) =>
  request('/rapports/assemblee', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

// ─── Activités District ──────────────────────────────────────────────────────
export const getActivitesDistrict = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/activites-district${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const addActiviteDistrict = (data) =>
  request('/activites-district', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

// ─── Activités Nationales (par pays) ─────────────────────────────────────────
export const getActivitesNational = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/activites-national${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const addActiviteNational = (data) =>
  request('/activites-national', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });

// --- Dashboard consolide ---
export const getDashboardStats = (annee) =>
  request(`/dashboard/stats?annee=${annee}`, { headers: authHeaders() });

// --- Activites unifiees (assemblee / district / national) ---
export const getActivites = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/activites${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const addActivite = (data) =>
  request('/activites', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });

export const updateActivite = (id, data) =>
  request(`/activites/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });

export const deleteActivite = (id) =>
  request(`/activites/${id}`, { method: 'DELETE', headers: authHeaders() });

// --- Rapport assemblee etendu (tous champs SYNTHESE) ---
export const submitRapportAssembleeComplet = (data) =>
  request('/rapports/assemblee/complet', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });

export const getRapportsAssembleeHistorique = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/rapports/assemblee/historique${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

// --- Finances assemblee (ventilation) ---
export const getFinancesAssemblee = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/finances/assemblee${q ? `?${q}` : ''}`, { headers: authHeaders() });
};

export const saveFinancesAssemblee = (data) =>
  request('/finances/assemblee', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
