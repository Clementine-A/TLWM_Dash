const xlsx = require('xlsx');
const fs = require('fs');

function analyzeExcel(filePath, label) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📂 ${label}: ${filePath}`);
  console.log('═'.repeat(60));
  
  const wb = xlsx.readFile(filePath);
  console.log(`Feuilles (${wb.SheetNames.length}): ${wb.SheetNames.join(', ')}`);
  
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`\n  📄 Feuille: "${sheetName}" — ${data.length} lignes`);
    // Print first 6 rows
    data.slice(0, 8).forEach((row, i) => {
      const nonEmpty = row.filter(c => c !== '');
      if (nonEmpty.length > 0) console.log(`    L${i}: ${JSON.stringify(row.slice(0, 15))}`);
    });
    // Print a middle row if sheet is long
    if (data.length > 10) {
      const mid = data[10];
      if (mid && mid.filter(c => c !== '').length > 0)
        console.log(`    L10: ${JSON.stringify(mid.slice(0, 15))}`);
    }
  });
}

// Assemblee V1
analyzeExcel('./format/Assembles_Fomat_Donnees_LWM_V1.xlsx', 'ASSEMBLÉE V1');

// District V1
analyzeExcel('./format/District_Format_Donnees_LWM_V1.xlsx', 'DISTRICT V1');

// District V111 (plus complet)
analyzeExcel('./format/District_Fomat_Donnees_LWM_V111.xlsx', 'DISTRICT V111');
