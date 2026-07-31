const xlsx = require('xlsx');
const fs = require('fs');

const wb = xlsx.readFile('../BASE DE DONNEES TLWM.xlsx');
const ws = wb.Sheets['assemblees_locales'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

// headers: ["NON DU DISTRICT","NON DE L'ASSEMBLEE","EFFECTIF ","latitude_y","longitude_X"]
const [header, ...data] = rows;
console.log('Headers:', header);
console.log('Total rows:', data.length);

const assemblees = data
  .filter(row => row[0] && row[1]) // ignore empty rows
  .map((row, i) => ({
    id: i + 1,
    district: String(row[0]).trim(),
    nom: String(row[1]).trim(),
    effectif: Number(row[2]) || 0,
    lat: Number(row[3]) || null,
    lng: Number(row[4]) || null,
  }));

// Stats par district
const byDistrict = {};
assemblees.forEach(a => {
  if (!byDistrict[a.district]) byDistrict[a.district] = [];
  byDistrict[a.district].push(a);
});

console.log('\n=== Districts ===');
Object.entries(byDistrict).forEach(([d, list]) => {
  console.log(`  ${d}: ${list.length} assemblées`);
});

console.log('\n=== Total assemblées:', assemblees.length);
console.log('\n=== Sample data (5 rows):');
assemblees.slice(0, 5).forEach(a => console.log(JSON.stringify(a)));

// Sauvegarder en JSON
const output = JSON.stringify(assemblees, null, 2);
fs.writeFileSync('src/data/assembleesData.json', output);
console.log('\n✅ Fichier src/data/assembleesData.json créé !');
