/**
 * 1. Convertit les routes principales (primary/secondary/trunk) → GeoJSON
 * 2. Calcule les enveloppes convexes (convex hull) des districts TLWM
 * Aucune dépendance externe — Node.js pur
 */
const fs = require('fs');

// ══════════════════════════════════════════════════════════════════
// UTILITAIRES DBF + SHP
// ══════════════════════════════════════════════════════════════════

function readDbfFull(filePath) {
  const buf = fs.readFileSync(filePath);
  const numRecords = buf.readUInt32LE(4);
  const headerSize = buf.readUInt16LE(8);
  const recordSize = buf.readUInt16LE(10);
  const fields = [];
  let offset = 32;
  while (buf[offset] !== 0x0D && offset < headerSize - 1) {
    const name = buf.slice(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const type = String.fromCharCode(buf[offset + 11]);
    const length = buf[offset + 16];
    fields.push({ name, type, length });
    offset += 32;
  }
  return { numRecords, headerSize, recordSize, fields, buf };
}

// Lit seulement le champ 'fclass' de chaque enregistrement DBF (rapide)
function readFclassOnly(dbfInfo) {
  const { numRecords, headerSize, recordSize, fields, buf } = dbfInfo;
  const fclassField = fields.find(f => f.name === 'fclass');
  if (!fclassField) {
    console.error('Champ fclass non trouvé! Champs:', fields.map(f => f.name).join(', '));
    return [];
  }
  // Offset du champ fclass dans chaque enregistrement
  let fieldOffset = 1; // 1 pour le flag deletion
  for (const f of fields) {
    if (f.name === fclassField.name) break;
    fieldOffset += f.length;
  }
  const result = [];
  let recOffset = headerSize;
  for (let i = 0; i < numRecords; i++) {
    const val = buf.slice(recOffset + fieldOffset, recOffset + fieldOffset + fclassField.length)
      .toString('ascii').trim();
    result.push(val);
    recOffset += recordSize;
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════
// ROUTES — Conversion shapefile polylines filtrées
// ══════════════════════════════════════════════════════════════════

const ROAD_TYPES_KEEP = new Set([
  'primary', 'primary_link',
  'secondary', 'secondary_link',
  'trunk', 'trunk_link',
]);

function convertRoads() {
  const roadsDir = '../togo-260722-free.shp/';
  const shpPath = roadsDir + 'gis_osm_roads_free_1.shp';
  const dbfPath = roadsDir + 'gis_osm_roads_free_1.dbf';

  console.log('Lecture DBF routes...');
  const dbfInfo = readDbfFull(dbfPath);
  console.log('Champs DBF:', dbfInfo.fields.map(f => f.name).join(', '));

  const fclassList = readFclassOnly(dbfInfo);
  const majorIndices = new Set();
  fclassList.forEach((fc, i) => { if (ROAD_TYPES_KEEP.has(fc)) majorIndices.add(i); });
  console.log(`Routes trouvées: ${fclassList.length} total, ${majorIndices.size} routes principales`);

  // Lecture SHP (Polyline type 3)
  console.log('Lecture SHP routes...');
  const shpBuf = fs.readFileSync(shpPath);
  const features = [];
  let offset = 100;
  let recIdx = 0;

  while (offset < shpBuf.length - 8) {
    const contentLen = shpBuf.readInt32BE(offset + 4) * 2;
    offset += 8;
    if (offset + contentLen > shpBuf.length) break;

    if (majorIndices.has(recIdx)) {
      const shapeType = shpBuf.readInt32LE(offset);
      if (shapeType === 3 || shapeType === 13 || shapeType === 23) {
        const numParts  = shpBuf.readInt32LE(offset + 36);
        const numPoints = shpBuf.readInt32LE(offset + 40);
        const partsOff  = offset + 44;
        const ptsOff    = partsOff + numParts * 4;

        const parts = [];
        for (let i = 0; i < numParts; i++) parts.push(shpBuf.readInt32LE(partsOff + i * 4));

        const allPts = [];
        for (let i = 0; i < numPoints; i++) {
          const x = shpBuf.readDoubleLE(ptsOff + i * 16);
          const y = shpBuf.readDoubleLE(ptsOff + i * 16 + 8);
          allPts.push([x, y]);
        }

        const lines = [];
        for (let i = 0; i < parts.length; i++) {
          const start = parts[i];
          const end = i + 1 < parts.length ? parts[i + 1] : numPoints;
          lines.push(allPts.slice(start, end));
        }

        // Simplification légère : garder 1 point sur 3 pour alléger
        const simplified = lines.map(line =>
          line.filter((_, idx) => idx === 0 || idx === line.length - 1 || idx % 3 === 0)
        );

        features.push({
          type: 'Feature',
          geometry: simplified.length === 1
            ? { type: 'LineString', coordinates: simplified[0] }
            : { type: 'MultiLineString', coordinates: simplified },
          properties: { fclass: fclassList[recIdx] },
        });
      }
    }
    offset += contentLen;
    recIdx++;
  }

  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync('src/data/togo_roads.geojson', JSON.stringify(geojson));
  console.log(`✅ togo_roads.geojson créé : ${features.length} routes\n`);
}

// ══════════════════════════════════════════════════════════════════
// CONVEX HULL des districts TLWM
// ══════════════════════════════════════════════════════════════════

function cross(O, A, B) {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

function convexHull(points) {
  if (points.length < 3) return points.length === 2
    ? [points[0], points[1], points[0]]
    : [points[0], points[0], points[0]];

  const sorted = [...points].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = [...lower, ...upper];
  hull.push(hull[0]); // fermer le polygone
  return hull;
}

// Buffer circulaire autour d'un point (approximation en degrés)
function bufferPoint(lat, lng, deg = 0.05) {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * 2 * Math.PI;
    pts.push([lng + deg * Math.cos(angle), lat + deg * Math.sin(angle)]);
  }
  return pts;
}

function buildDistrictHulls() {
  const assemblees = JSON.parse(fs.readFileSync('src/data/assembleesData.json', 'utf8'));

  // Grouper par district
  const byDistrict = {};
  assemblees.forEach(a => {
    if (!a.lat || !a.lng) return;
    if (!byDistrict[a.district]) byDistrict[a.district] = [];
    byDistrict[a.district].push(a);
  });

  const features = [];
  const totalMembers = {};

  for (const [district, list] of Object.entries(byDistrict)) {
    // Si 1 seul point : buffer circulaire
    let hullPoints;
    if (list.length === 1) {
      hullPoints = bufferPoint(list[0].lat, list[0].lng, 0.08);
    } else {
      // Ajouter un petit buffer autour de chaque point avant convex hull
      const allBuffered = list.flatMap(a => bufferPoint(a.lat, a.lng, 0.04));
      hullPoints = convexHull(allBuffered);
    }

    const members = list.reduce((s, a) => s + (a.effectif || 0), 0);
    totalMembers[district] = members;

    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [hullPoints] },
      properties: {
        district,
        count: list.length,
        totalEffectif: members,
      },
    });
  }

  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync('src/data/togo_districts_hull.geojson', JSON.stringify(geojson));
  console.log(`✅ togo_districts_hull.geojson créé : ${features.length} districts`);
  features.forEach(f => console.log(`   ${f.properties.district}: ${f.properties.count} assemblées, ${f.properties.totalEffectif} membres`));
}

// ══════════════════════════════════════════════════════════════════
// RUN
// ══════════════════════════════════════════════════════════════════
console.log('=== CONVERSION DES DONNÉES CARTOGRAPHIQUES ===\n');

try {
  convertRoads();
} catch (e) {
  console.error('Erreur routes:', e.message);
}

buildDistrictHulls();
console.log('\n🗺️  Terminé !');
