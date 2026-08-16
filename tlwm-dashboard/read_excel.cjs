const xlsx = require('xlsx');

// Lire BASE DE DONNEES TLWM.xlsx
const wb = xlsx.readFile('../BASE DE DONNEES TLWM.xlsx');
console.log('=== SHEETS ===');
console.log(wb.SheetNames);

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`\n=== Sheet: "${name}" (${data.length} rows) ===`);
  // Affiche les 5 premières lignes
  data.slice(0, 5).forEach((row, i) => console.log(`  Row ${i}:`, JSON.stringify(row)));
});
