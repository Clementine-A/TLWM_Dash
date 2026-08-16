import React, { useState, useMemo, useEffect } from 'react';
import {
  MapContainer, TileLayer, GeoJSON, CircleMarker,
  Popup, ZoomControl, useMap, Tooltip,
} from 'react-leaflet';
import {
  Map, Users, Building2, Filter, Layers, Eye, EyeOff, ChevronDown,
} from 'lucide-react';
import useStore from '../store/useStore';
import assembleesData from '../data/assembleesData.json';
import togoAdmin from '../data/togo_admin.geojson';
import togoRoads from '../data/togo_roads.geojson';
import togoDistrictsHull from '../data/togo_districts_hull.geojson';

// ─── Fix icônes Leaflet (Vite) ─────────────────────────────────────────────
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Couleurs des 5 régions du Togo ───────────────────────────────────────
const REGION_COLORS = {
  'Savanes':  { fill: '#f97316', stroke: '#ea580c' },
  'Kara':     { fill: '#8b5cf6', stroke: '#7c3aed' },
  'Centrale': { fill: '#3b82f6', stroke: '#2563eb' },
  'Plateaux': { fill: '#10b981', stroke: '#059669' },
  'Maritime': { fill: '#f43f5e', stroke: '#e11d48' },
};

// ─── Couleurs des districts TLWM ──────────────────────────────────────────
const DISTRICT_COLORS = {
  BASSAR:           '#f59e0b',
  BERCEAU:          '#06b6d4',
  BINAH:            '#8b5cf6',
  CENTRAL:          '#10b981',
  CENTRALE:         '#10b981',
  GAME:             '#f43f5e',
  KARA:             '#3b82f6',
  'KARA-SOKODE':    '#6366f1',
  LITTORAL:         '#ec4899',
  'PLATEAUX-EST':   '#84cc16',
  'PLATEAUX-OUEST': '#22d3ee',
  SAVANES:          '#fb923c',
  YOTO:             '#a78bfa',
};
const getDistrictColor = (d) => DISTRICT_COLORS[d] || '#94a3b8';

// ─── Adapter Togo bounds ───────────────────────────────────────────────────
function FitTogo() {
  const map = useMap();
  useEffect(() => { map.fitBounds([[6.0, -0.1], [11.2, 1.8]]); }, [map]);
  return null;
}

// ─── MapPage ───────────────────────────────────────────────────────────────
const MapPage = () => {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [showRegions,      setShowRegions]      = useState(true);
  const [showRoads,        setShowRoads]        = useState(true);
  const [showDistrictHull, setShowDistrictHull] = useState(true);
  const [showPoints,       setShowPoints]       = useState(true);
  const [selectedAssemblee, setSelectedAssemblee] = useState(null);

  // Districts uniques pour le filtre
  const districts = useMemo(() => {
    const set = new Set(assembleesData.map(a => a.district));
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() =>
    selectedDistrict === 'ALL'
      ? assembleesData
      : assembleesData.filter(a => a.district === selectedDistrict),
    [selectedDistrict]
  );

  const totalEffectif = useMemo(() =>
    filtered.reduce((s, a) => s + (a.effectif || 0), 0), [filtered]);

  // Style régions admin (coloré par adm1_name)
  const regionStyle = (feature) => {
    const regionName = feature.properties?.adm1_name || '';
    const c = REGION_COLORS[regionName] || { fill: '#64748b', stroke: '#475569' };
    return {
      color:       isDark ? c.stroke : c.stroke,
      weight:      0.5,
      fillColor:   c.fill,
      fillOpacity: isDark ? 0.18 : 0.15,
      opacity:     0.7,
    };
  };

  // Style routes
  const roadStyle = (feature) => {
    const fc = feature.properties?.fclass || '';
    const isPrimary = fc === 'primary' || fc === 'primary_link' || fc === 'trunk' || fc === 'trunk_link';
    return {
      color:   isDark ? (isPrimary ? '#fbbf24' : '#94a3b8') : (isPrimary ? '#d97706' : '#64748b'),
      weight:  isPrimary ? 2 : 1,
      opacity: isPrimary ? 0.8 : 0.4,
    };
  };

  // Style hulls districts
  const hullStyle = (feature) => {
    const d = feature.properties?.district || '';
    const color = getDistrictColor(d);
    const isSelected = selectedDistrict === d;
    return {
      color,
      weight:      isSelected ? 2.5 : 1.5,
      fillColor:   color,
      fillOpacity: isSelected ? 0.12 : 0.07,
      opacity:     isSelected ? 1 : 0.7,
      dashArray:   '5, 5',
    };
  };

  // Tile layer (CartoDB adapté au thème)
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // Filtrer les hulls si district sélectionné
  const filteredHulls = useMemo(() => ({
    ...togoDistrictsHull,
    features: selectedDistrict === 'ALL'
      ? togoDistrictsHull.features
      : togoDistrictsHull.features.filter(f =>
          f.properties.district === selectedDistrict ||
          (selectedDistrict === 'CENTRAL' && f.properties.district === 'CENTRALE')
        ),
  }), [selectedDistrict]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 flex flex-col ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>

      {/* ── Top Bar ── */}
      <header className={`sticky top-0 z-[1000] border-b backdrop-blur-md
        ${isDark ? 'border-slate-800/80 bg-navy-900/95' : 'border-slate-200/80 bg-white/90 shadow-sm'}`}
      >
        <div className="px-5 py-2.5 flex items-center gap-3 flex-wrap">
          {/* Titre */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className={`p-1.5 rounded-xl ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <Map size={16} />
            </div>
            <div>
              <h2 className={`text-base font-extrabold leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Carte des Assemblées — Togo
              </h2>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {filtered.length} assemblées · {totalEffectif.toLocaleString('fr-FR')} membres
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Toggles couches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Couches :
            </span>
            {[
              { key: 'regions',  label: 'Régions',  val: showRegions,      set: setShowRegions },
              { key: 'roads',    label: 'Routes',   val: showRoads,        set: setShowRoads },
              { key: 'districts',label: 'Districts',val: showDistrictHull, set: setShowDistrictHull },
              { key: 'points',   label: 'Assemblées',val: showPoints,      set: setShowPoints },
            ].map(({ key, label, val, set }) => (
              <button
                key={key}
                onClick={() => set(v => !v)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all
                  ${val
                    ? isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
              >
                {val ? <Eye size={10} /> : <EyeOff size={10} />}
                {label}
              </button>
            ))}
          </div>

          {/* Filtre district */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={e => { setSelectedDistrict(e.target.value); setSelectedAssemblee(null); }}
              className={`text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 border outline-none cursor-pointer appearance-none
                ${isDark ? 'bg-navy-800 text-white border-slate-700 focus:border-emerald-500' : 'bg-white text-slate-800 border-slate-200 focus:border-emerald-400'}`}
            >
              {districts.map(d => (
                <option key={d} value={d}>{d === 'ALL' ? '🗺️ Tous les districts' : d}</option>
              ))}
            </select>
            <ChevronDown size={11} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
        </div>
      </header>

      {/* ── Layout : Carte + Panneau ── */}
      <div className="flex flex-1" style={{ height: 'calc(100vh - 53px)' }}>

        {/* ── Carte Leaflet ── */}
        <div className="flex-1 relative">
          <MapContainer
            center={[8.5, 0.9]}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <FitTogo />
            <ZoomControl position="bottomright" />

            {/* Fond de carte */}
            <TileLayer
              url={tileUrl}
              attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
            />

            {/* Couche 1 — Régions colorées (admin3 coloré par adm1_name) */}
            {showRegions && (
              <GeoJSON
                key={`regions-${isDark}-${selectedDistrict}`}
                data={togoAdmin}
                style={regionStyle}
              />
            )}

            {/* Couche 2 — Routes principales */}
            {showRoads && (
              <GeoJSON
                key={`roads-${isDark}`}
                data={togoRoads}
                style={roadStyle}
              />
            )}

            {/* Couche 3 — Enveloppes convexes des districts TLWM */}
            {showDistrictHull && (
              <GeoJSON
                key={`hulls-${selectedDistrict}`}
                data={filteredHulls}
                style={hullStyle}
                onEachFeature={(feature, layer) => {
                  layer.bindTooltip(
                    `<b>${feature.properties.district}</b><br/>${feature.properties.count} assemblées`,
                    { permanent: false, direction: 'center', className: 'district-tooltip' }
                  );
                }}
              />
            )}

            {/* Couche 4 — Points des assemblées */}
            {showPoints && filtered.map(a => {
              if (!a.lat || !a.lng) return null;
              const color = getDistrictColor(a.district);
              const isSelected = selectedAssemblee?.id === a.id;
              const radius = Math.max(5, Math.min(14, 5 + Math.sqrt(a.effectif || 10) * 0.55));

              return (
                <CircleMarker
                  key={a.id}
                  center={[a.lat, a.lng]}
                  radius={isSelected ? radius + 3 : radius}
                  pathOptions={{
                    color:       isSelected ? '#fff' : color,
                    weight:      isSelected ? 2.5 : 1.5,
                    fillColor:   color,
                    fillOpacity: isSelected ? 1 : 0.88,
                  }}
                  eventHandlers={{ click: () => setSelectedAssemblee(a) }}
                >
                  <Popup maxWidth={220}>
                    <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 170 }}>
                      <p style={{ fontWeight: 800, fontSize: 13, color, marginBottom: 2 }}>{a.nom}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>District {a.district}</p>
                      <div style={{
                        background: isDark ? '#1e293b' : '#f8fafc',
                        borderRadius: 8, padding: '6px 10px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>Effectif</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                          {a.effectif || '—'} membres
                        </span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Légende régions (superposée sur la carte) */}
          {showRegions && (
            <div className={`absolute bottom-10 left-3 z-[500] rounded-xl px-3 py-2.5 shadow-2xl border
              ${isDark ? 'bg-navy-900/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}
            >
              <p className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Régions du Togo
              </p>
              {Object.entries(REGION_COLORS).map(([region, c]) => (
                <div key={region} className="flex items-center gap-1.5 py-0.5">
                  <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c.fill, flexShrink: 0 }} />
                  <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{region}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Panneau latéral ── */}
        <aside className={`w-64 flex flex-col overflow-hidden border-l flex-shrink-0
          ${isDark ? 'bg-navy-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
          {/* Stats */}
          <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <p className={`text-[9px] uppercase tracking-widest font-bold mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Statistiques</p>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Assemblées" value={filtered.length} icon={Building2}
                color={isDark ? 'text-emerald-400' : 'text-emerald-600'}
                bg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'} />
              <MiniStat label="Membres" value={totalEffectif.toLocaleString('fr-FR')} icon={Users}
                color={isDark ? 'text-cyan-400' : 'text-cyan-600'}
                bg={isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'} />
            </div>
          </div>

          {/* Légende districts */}
          <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Districts TLWM</p>
            <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
              {Object.entries(DISTRICT_COLORS)
                .filter(([d]) => d !== 'CENTRALE' && d !== 'KARA-SOKODE')
                .map(([district, color]) => {
                  const count = assembleesData.filter(a =>
                    a.district === district || (district === 'CENTRAL' && a.district === 'CENTRALE')
                  ).length;
                  const isActive = selectedDistrict === district;
                  return (
                    <button
                      key={district}
                      onClick={() => setSelectedDistrict(d => d === district ? 'ALL' : district)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all
                        ${isActive
                          ? isDark ? 'bg-slate-700/60' : 'bg-slate-100'
                          : 'hover:bg-slate-500/10'}`}
                    >
                      <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      <span className={`text-[11px] font-medium flex-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{district}</span>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Liste assemblées */}
          <div className="flex-1 overflow-y-auto">
            <div className={`px-3 pt-3 pb-1.5 sticky top-0 z-10 ${isDark ? 'bg-navy-900' : 'bg-white'}`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Assemblées ({filtered.length})
              </p>
            </div>
            <div className="px-2 pb-3 space-y-0.5">
              {filtered.map(a => {
                const isActive = selectedAssemblee?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAssemblee(a.id === selectedAssemblee?.id ? null : a)}
                    className={`w-full text-left rounded-xl px-2.5 py-2 transition-all border
                      ${isActive
                        ? isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-300'
                        : isDark ? 'border-transparent hover:bg-slate-800/60' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        backgroundColor: getDistrictColor(a.district),
                        flexShrink: 0, marginTop: 4,
                      }} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{a.nom}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {a.district} · {a.effectif || 0} mbr
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indication taille markers */}
          <div className={`p-3 border-t text-[10px] ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-100 text-slate-400'}`}>
            📍 Taille ∝ effectif de l'assemblée
          </div>
        </aside>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, icon: Icon, color, bg }) => (
  <div className={`rounded-xl p-2.5 ${bg}`}>
    <Icon size={13} className={`${color} mb-1`} />
    <p className={`text-base font-extrabold ${color} leading-none`}>{value}</p>
    <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
  </div>
);

export default MapPage;
