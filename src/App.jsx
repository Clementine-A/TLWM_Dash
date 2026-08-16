import { useEffect, lazy, Suspense } from 'react';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import useStore from './store/useStore';
import 'leaflet/dist/leaflet.css';

const MapPage = lazy(() => import('./pages/MapPage'));

function App() {
  const { theme, sidebarOpen, currentPage } = useStore();

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-navy-900' : 'bg-[#f0f4f8]'}`}>
      {/* Sidebar — always visible */}
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '260px' : '68px' }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {currentPage === 'map' ? <MapPage /> : <Dashboard />}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
