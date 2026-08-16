import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('tlwm_user');
    const savedToken = localStorage.getItem('tlwm_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('tlwm_token', res.token);
    localStorage.setItem('tlwm_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('tlwm_token');
    localStorage.removeItem('tlwm_user');
    setUser(null);
  };

  // Met à jour le profil en session (nom, etc.) sans reconnexion
  const updateUser = (patches) => {
    setUser(prev => {
      const updated = { ...prev, ...patches };
      localStorage.setItem('tlwm_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Hiérarchie des rôles multi-niveaux
  const role = user?.role || '';
  const isSuperAdmin = role === 'ADMIN_AFRIQUE' || role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isAdminPays = role === 'ADMIN_PAYS' || isSuperAdmin;
  const isSuperviseurDistrict = role === 'SUPERVISEUR_DISTRICT' || role === 'SUPERVISEUR' || isAdminPays;
  const isRapporteur = role === 'RAPPORTEUR_ASSEMBLEE' || role === 'RAPPORTEUR' || isSuperviseurDistrict;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      loading,
      isSuperAdmin,
      isAdminPays,
      isSuperviseurDistrict,
      isRapporteur
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
