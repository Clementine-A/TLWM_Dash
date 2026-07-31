/**
 * 1. Regenère assembleesData.json en corrigeant Agou Nyogbo et Klomayondi (coords nulles)
 * 2. Convertit tgo_admin1_em.shp → togo_admin1.geojson
 */
const fs = require('fs');
const xlsx = require('xlsx');

// ══════════════════════════════════════════════════════
// 1. CORRECTION assembleesData.json
// ══════════════════════════════════════════════════════
const wb = xlsx.readFile('../BASE DE DONNEES TLWM.xlsx');
const ws = wb.Sheets['assemblees_locales'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
const [, ...data] = rows;

// Bounding box stricte du Togo (légèrement élargie)
const TOGO_BOUNDS = { latMin: 6.1, latMax: 11.2, lngMin: 0.07, lngMax: 1.82 };

const assemblees = data
  .filter(row => row[0] && row[1])
  .map((row, i) => {
    const lat = Number(row[3]) || null;
    const lng = Number(row[4]) || null;
    const nom = String(row[1]).trim();

    // Valider les coordonnées — si hors Togo → null
    let validLat = lat, validLng = lng;
    if (lat && lng) {
      if (lat < TOGO_BOUNDS.latMin || lat > TOGO_BOUNDS.latMax ||
          lng < TOGO_BOUNDS.lngMin || lng > TOGO_BOUNDS.lngMax) {
        console.warn(`⚠️  Coordonnées hors Togo → nulles : ${nom} (lat:${lat}, lng:${lng})`);
        validLat = null;
        validLng = null;
      }
    }

    return {
      id: i + 1,
      district: String(row[0]).trim(),
      nom,
      effectif: Number(row[2]) || 0,
      lat: validLat,
      lng: validLng,
    };
  });

const invalides = assemblees.filter(a => !a.lat || !a.lng);
console.log(`\n✅ assembleesData.json : ${assemblees.length} assemblées`);
console.log(`   dont ${invalides.length} sans coordonnées valides :`);
invalides.forEach(a => console.log(`   - ${a.nom} (${a.district})`));
fs.writeFileSync('src/data/assembleesData.json', JSON.stringify(assemblees, null, 2));

// ══════════════════════════════════════════════════════
// 2. CONVERSION tgo_admin1_em.shp → GeoJSON
// ══════════════════════════════════════════════════════

function readDbf(filePath) {
  const buf = fs.readFileSync(filePath);
  const numRecords = buf.readUInt32LE(4);
  const headerSize = buf.readUInt16LE(8);
  const fields = [];
  let offset = 32;
  while (buf[offset] !== 0x0D && offset < headerSize - 1) {
    const name = buf.slice(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const type = String.fromCharCode(buf[offset + 11]);
    const length = buf[offset + 16];
    fields.push({ name, type, length });
    offset += 32;
  }
  const recordSize = buf.readUInt16LE(10);
  const records = [];
  let recOffset = headerSize;
  for (let i = 0; i < numRecords; i++) {
    recOffset++;
    const rec = {};
    for (const f of fields) {
      const raw = buf.slice(recOffset, recOffset + f.length).toString('utf8').trim();
      rec[f.name] = (f.type === 'N' || f.type === 'F') ? parseFloat(raw) || 0 : raw;
      recOffset += f.length;
    }
    records.push(rec);
  }
  return records;
}

function readShpPolygons(filePath) {
  const buf = fs.readFileSync(filePath);
  const geometries = [];
  let offset = 100;
  while (offset < buf.length - 8) {
    const contentLen = buf.readInt32BE(offset + 4) * 2;
    offset += 8;
    if (offset + contentLen > buf.length || contentLen <= 0) break;
    const shapeType = buf.readInt32LE(offset);
    if ([5, 15, 25].includes(shapeType)) {
      const numParts  = buf.readInt32LE(offset + 36);
      const numPoints = buf.readInt32LE(offset + 40);
      const partsOff  = offset + 44;
      const ptsOff    = partsOff + numParts * 4;
      const parts = [];
      for (let i = 0; i < numParts; i++) parts.push(buf.readInt32LE(partsOff + i * 4));
      const allPts = [];
      for (let i = 0; i < numPoints; i++) {
        allPts.push([buf.readDoubleLE(ptsOff + i * 16), buf.readDoubleLE(ptsOff + i * 16 + 8)]);
      }
      const rings = [];
      for (let i = 0; i < parts.length; i++) {
        const start = parts[i];
        const end = i + 1 < parts.length ? parts[i + 1] : numPoints;
        rings.push(allPts.slice(start, end));
      }
      geometries.push(rings.length === 1
        ? { type: 'Polygon', coordinates: rings }
        : { type: 'MultiPolygon', coordinates: [rings] });
    } else if (shapeType === 0) {
      geometries.push(null);
    } else {
      geometries.push(null);
    }
    offset += contentLen;
  }
  return geometries;
}

console.log('\n=== Conversion tgo_admin1_em ===');
const base = '../tgo_admin_boundaries.shp/tgo_admin1_em';
const attributes = readDbf(base + '.dbf');
const geometries = readShpPolygons(base + '.shp');
console.log(`  DBF fields: ${Object.keys(attributes[0] || {}).join(', ')}`);
console.log(`  Regions trouvées: ${attributes.length}`);
attributes.forEach(a => console.log(`   - ${a.adm1_name || a.ADM1_NAME || JSON.stringify(a)}`));

const features = geometries.map((geom, i) => ({
  type: 'Feature',
  geometry: geom,
  properties: attributes[i] || {},
}));
fs.writeFileSync('src/data/togo_admin.geojson', JSON.stringify({ type: 'FeatureCollection', features }));
console.log(`✅ togo_admin.geojson (admin1) : ${features.length} régions\n`);

// ══════════════════════════════════════════════════════
// 3. RECALCUL des convex hulls avec les coords corrigées
// ══════════════════════════════════════════════════════

function cross(O, A, B) {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}
function convexHull(points) {
  if (points.length < 3) return [...points, points[0]];
  const sorted = [...points].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop(); upper.pop();
  const hull = [...lower, ...upper];
  hull.push(hull[0]);
  return hull;
}
function bufferPoint(lat, lng, deg = 0.05) {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * 2 * Math.PI;
    pts.push([lng + deg * Math.cos(angle), lat + deg * Math.sin(angle)]);
  }
  return pts;
}

const byDistrict = {};
assemblees.filter(a => a.lat && a.lng).forEach(a => {
  if (!byDistrict[a.district]) byDistrict[a.district] = [];
  byDistrict[a.district].push(a);
});

const hullFeatures = [];
for (const [district, list] of Object.entries(byDistrict)) {
  const allBuffered = list.length === 1
    ? bufferPoint(list[0].lat, list[0].lng, 0.08)
    : list.flatMap(a => bufferPoint(a.lat, a.lng, 0.04));
  const hull = convexHull(allBuffered);
  hullFeatures.push({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [hull] },
    properties: { district, count: list.length, totalEffectif: list.reduce((s, a) => s + (a.effectif || 0), 0) },
  });
}
fs.writeFileSync('src/data/togo_districts_hull.geojson', JSON.stringify({ type: 'FeatureCollection', features: hullFeatures }));
console.log(`✅ togo_districts_hull.geojson recalculé : ${hullFeatures.length} districts\n`);
console.log('🗺️  Tout est prêt !');
