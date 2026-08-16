import { create } from 'zustand';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tlwm-theme');
    if (saved) return saved;
  }
  return 'dark';
};

const useStore = create((set) => ({
  selectedMonths: [],   // tableau pour multi-sélection
  selectedYear: 2024,
  selectedDistrict: null,

  // Navigation
  currentPage: 'dashboard', // 'dashboard' | 'map'
  setPage: (page) => set({ currentPage: page }),

  // Theme
  theme: getInitialTheme(),
  sidebarOpen: true,

  // Ajoute ou retire un mois du tableau
  toggleMonth: (month) =>
    set((state) => {
      const exists = state.selectedMonths.includes(month);
      return {
        selectedMonths: exists
          ? state.selectedMonths.filter((m) => m !== month)
          : [...state.selectedMonths, month],
      };
    }),

  // Vide la sélection de mois
  clearMonths: () => set({ selectedMonths: [] }),

  // Rétrocompatibilité : setMonth accepte null (= vider) ou une string
  setMonth: (month) =>
    set(month === null
      ? { selectedMonths: [] }
      : (state) => ({ selectedMonths: [month] })),

  setYear: (year) => set({ selectedYear: year, selectedMonths: [] }),
  setDistrict: (district) => set({ selectedDistrict: district }),
  resetFilters: () => set({ selectedMonths: [], selectedDistrict: null }),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tlwm-theme', next);
      return { theme: next };
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

export default useStore;
