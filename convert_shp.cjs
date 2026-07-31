/**
 * Reads a .shp + .dbf file and outputs GeoJSON
 * No external dependencies — pure Node.js binary parsing
 * Shapefile spec: https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf
 */
const fs = require('fs');
const path = require('path');

// ─── DBF Reader ────────────────────────────────────────────────────────────
function readDbf(filePath) {
  const buf = fs.readFileSync(filePath);
  const numRecords = buf.readUInt32LE(4);
  const headerSize = buf.readUInt16LE(8);
  const recordSize = buf.readUInt16LE(10);

  const fields = [];
  let offset = 32;
  while (buf[offset] !== 0x0D) {
    const name = buf.slice(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const type = String.fromCharCode(buf[offset + 11]);
    const length = buf[offset + 16];
    fields.push({ name, type, length });
    offset += 32;
  }

  const records = [];
  let recOffset = headerSize;
  for (let i = 0; i < numRecords; i++) {
    recOffset++; // deletion flag
    const record = {};
    for (const field of fields) {
      const raw = buf.slice(recOffset, recOffset + field.length).toString('ascii').trim();
      record[field.name] = (field.type === 'N' || field.type === 'F') ? parseFloat(raw) || 0 : raw;
      recOffset += field.length;
    }
    records.push(record);
  }
  return records;
}

// ─── SHP Polygon/MultiPolygon Reader ───────────────────────────────────────
function readShp(filePath) {
  const buf = fs.readFileSync(filePath);
  const fileLength = buf.readInt32BE(6) * 2;
  const shapeType = buf.readInt32LE(32);
  console.log(`  SHP: ${filePath}, fileLength=${fileLength}, shapeType=${shapeType}`);

  const geometries = [];
  let offset = 100;

  while (offset < buf.length) {
    if (offset + 8 > buf.length) break;
    const recNum = buf.readInt32BE(offset);
    const contentLen = buf.readInt32BE(offset + 4) * 2;
    offset += 8;

    if (offset + contentLen > buf.length) break;
    const recShapeType = buf.readInt32LE(offset);

    if (recShapeType === 0) { // Null shape
      geometries.push(null);
      offset += contentLen;
      continue;
    }

    // Shape types 3=Polyline, 5=Polygon, 15=PolygonZ, 25=PolygonM
    if ([3, 5, 15, 25].includes(recShapeType)) {
      // bbox: 4 doubles (32 bytes)
      const numParts  = buf.readInt32LE(offset + 36);
      const numPoints = buf.readInt32LE(offset + 40);
      const partsOffset = offset + 44;
      const pointsOffset = partsOffset + numParts * 4;

      const parts = [];
      for (let i = 0; i < numParts; i++) {
        parts.push(buf.readInt32LE(partsOffset + i * 4));
      }

      const allPoints = [];
      for (let i = 0; i < numPoints; i++) {
        const x = buf.readDoubleLE(pointsOffset + i * 16);
        const y = buf.readDoubleLE(pointsOffset + i * 16 + 8);
        allPoints.push([x, y]);
      }

      // Split into rings
      const rings = [];
      for (let i = 0; i < parts.length; i++) {
        const start = parts[i];
        const end = i + 1 < parts.length ? parts[i + 1] : numPoints;
        rings.push(allPoints.slice(start, end));
      }

      if (recShapeType === 3) {
        geometries.push(rings.length === 1
          ? { type: 'LineString', coordinates: rings[0] }
          : { type: 'MultiLineString', coordinates: rings });
      } else {
        geometries.push(rings.length === 1
          ? { type: 'Polygon', coordinates: rings }
          : { type: 'MultiPolygon', coordinates: [rings] });
      }
    } else {
      geometries.push(null);
    }
    offset += contentLen;
  }
  return geometries;
}

// ─── Convert SHP + DBF → GeoJSON ──────────────────────────────────────────
function shpToGeoJSON(shpPath, dbfPath, outPath) {
  console.log(`\nConverting: ${path.basename(shpPath)}`);
  const geometries = readShp(shpPath);
  const attributes = dbfPath ? readDbf(dbfPath) : [];

  const features = geometries.map((geom, i) => ({
    type: 'Feature',
    geometry: geom,
    properties: attributes[i] || {},
  }));

  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync(outPath, JSON.stringify(geojson));
  console.log(`  ✅ ${features.length} features → ${outPath}`);
  return features.length;
}

// ─── Run ───────────────────────────────────────────────────────────────────
const base = '../tgo_admin_boundaries.shp/tgo_admin3_em';
shpToGeoJSON(
  base + '.shp',
  base + '.dbf',
  'src/data/togo_admin.geojson'
);

console.log('\n🗺️  Done!');
