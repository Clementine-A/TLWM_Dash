const fs = require('fs');

// Read DBF to understand the attribute columns of the admin shapefile
function readDbf(filePath) {
  const buf = fs.readFileSync(filePath);
  const numRecords = buf.readUInt32LE(4);
  const headerSize = buf.readUInt16LE(8);
  const recordSize = buf.readUInt16LE(10);

  const fields = [];
  let offset = 32;
  while (buf[offset] !== 0x0D && offset < headerSize) {
    const name = buf.slice(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const type = String.fromCharCode(buf[offset + 11]);
    const length = buf[offset + 16];
    fields.push({ name, type, length });
    offset += 32;
  }

  const records = [];
  let recOffset = headerSize;
  for (let i = 0; i < numRecords; i++) {
    if (recOffset >= buf.length) break;
    recOffset++; // deletion flag
    const record = {};
    for (const field of fields) {
      const raw = buf.slice(recOffset, recOffset + field.length).toString('latin1').trim();
      record[field.name] = (field.type === 'N' || field.type === 'F') ? parseFloat(raw) || 0 : raw;
      recOffset += field.length;
    }
    records.push(record);
  }
  return { fields, records };
}

// Admin3 shapefile
console.log('=== tgo_admin3_em.dbf FIELDS ===');
const admin3 = readDbf('../tgo_admin_boundaries.shp/tgo_admin3_em.dbf');
console.log('Fields:', admin3.fields.map(f => `${f.name}(${f.type}${f.length})`).join(', '));
console.log('Total records:', admin3.records.length);
console.log('Sample records (5):');
admin3.records.slice(0, 5).forEach(r => console.log(' ', JSON.stringify(r)));

// Get unique values for key fields
const uniqueAdm1 = [...new Set(admin3.records.map(r => r.ADM1_EN || r.ADM1 || r.admin1 || r.NAME_1 || r.NAME1 || Object.values(r)[0]))];
console.log('\nUnique first field values (first 20):', uniqueAdm1.slice(0, 20));

// Print all field unique counts
admin3.fields.forEach(f => {
  const vals = [...new Set(admin3.records.map(r => r[f.name]))];
  if (vals.length <= 20) {
    console.log(`\nField "${f.name}" (${vals.length} unique):`, vals.slice(0, 15));
  } else {
    console.log(`\nField "${f.name}": ${vals.length} unique values`);
  }
});
