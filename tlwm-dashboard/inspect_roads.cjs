/**
 * Lit les champs DBF des routes (juste l'entête pour économiser la mémoire)
 * puis converti uniquement les routes principales en GeoJSON
 */
const fs = require('fs');

// ─── DBF Header reader (fields only) ─────────────────────────────────────
function readDbfHeader(filePath) {
  const buf = fs.readFileSync(filePath, { start: 0, end: 500 }); // juste l'entête
  // En fait readFileSync ne supporte pas start/end, on lit tout mais petite portion
  const fullBuf = fs.readFileSync(filePath);
  const numRecords = fullBuf.readUInt32LE(4);
  const headerSize = fullBuf.readUInt16LE(8);
  const recordSize = fullBuf.readUInt16LE(10);
  const fields = [];
  let offset = 32;
  while (fullBuf[offset] !== 0x0D && offset < headerSize - 1) {
    const name = fullBuf.slice(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const type = String.fromCharCode(fullBuf[offset + 11]);
    const length = fullBuf[offset + 16];
    const fieldOffset = fields.reduce((s, f) => s + f.length, 0);
    fields.push({ name, type, length, offset: fieldOffset });
    offset += 32;
  }
  return { numRecords, headerSize, recordSize, fields, buf: fullBuf };
}

// ─── Inspect roads DBF ─────────────────────────────────────────────────────
console.log('=== Roads DBF fields ===');
const { numRecords, headerSize, recordSize, fields, buf } = readDbfHeader('../togo-260722-free.shp/gis_osm_roads_free_1.dbf');
console.log(`Records: ${numRecords}, headerSize: ${headerSize}, recordSize: ${recordSize}`);
console.log('Fields:', fields.map(f => `${f.name}(${f.type}${f.length})`).join(', '));

// Lire 10 premières lignes pour voir les valeurs
console.log('\nSample rows (10):');
let recOffset = headerSize;
const sample = [];
for (let i = 0; i < Math.min(10, numRecords); i++) {
  recOffset++; // deletion flag
  const rec = {};
  for (const f of fields) {
    rec[f.name] = buf.slice(recOffset + f.offset, recOffset + f.offset + f.length).toString('latin1').trim();
  }
  sample.push(rec);
  recOffset += recordSize;
}
sample.forEach(r => console.log(JSON.stringify(r)));

// Trouver le champ de type de route et ses valeurs uniques
const fclassField = fields.find(f => f.name === 'fclass' || f.name === 'type' || f.name === 'highway');
if (fclassField) {
  console.log('\nReading unique values for field:', fclassField.name, '...');
  const uniq = new Set();
  let ro = headerSize;
  for (let i = 0; i < numRecords; i++) {
    ro++;
    const val = buf.slice(ro + fclassField.offset, ro + fclassField.offset + fclassField.length).toString('latin1').trim();
    uniq.add(val);
    ro += recordSize;
  }
  console.log('Unique values:', [...uniq].sort().join(', '));
}
