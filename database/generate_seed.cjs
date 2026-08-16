/**
 * Script d'initialisation et de population de la base PostgreSQL
 * Génère le script SQL d'insertion à partir de assembleesData.json et realData.json
 */

const fs = require('fs');
const path = require('path');

const assembleesPath = path.join(__dirname, '../tlwm-dashboard/src/data/assembleesData.json');
const realDataPath = path.join(__dirname, '../tlwm-dashboard/src/data/realData.json');

const assemblees = JSON.parse(fs.readFileSync(assembleesPath, 'utf8'));
const realData = JSON.parse(fs.readFileSync(realDataPath, 'utf8'));

let sql = `-- ==============================================================================\n`;
sql += `-- SEED DE DONNEES INITIALES (GENERATION AUTOMATIQUE)\n`;
sql += `-- ==============================================================================\n\n`;

// 0. Pays
sql += `-- 0. INSERTION DES PAYS\n`;
sql += `INSERT INTO pays (code_pays, nom_pays) VALUES 
('TG', 'Togo'), ('BJ', 'Bénin'), ('CI', 'Côte d''Ivoire'), ('GH', 'Ghana'), ('BF', 'Burkina Faso')
ON CONFLICT (code_pays) DO NOTHING;\n\n`;

// 1. Districts
const districtSet = new Set();
assemblees.forEach(a => districtSet.add(a.district));
const districts = Array.from(districtSet).sort();

sql += `-- 1. INSERTION DES DISTRICTS\n`;
districts.forEach(d => {
  const code = 'D-' + d.substring(0, 4).toUpperCase();
  const nameEscaped = d.replace(/'/g, "''");
  sql += `INSERT INTO districts (pays_id, code_district, nom_district) 
VALUES ((SELECT id FROM pays WHERE code_pays = 'TG' LIMIT 1), '${code}', '${nameEscaped}') 
ON CONFLICT (code_district) DO NOTHING;\n`;
});
sql += `\n`;

// 2. Assemblées
sql += `-- 2. INSERTION DES ASSEMBLEES\n`;
assemblees.forEach((a, idx) => {
  const code = 'A-' + String(idx + 1).padStart(3, '0');
  const nomEscaped = a.nom.replace(/'/g, "''");
  const distEscaped = a.district.replace(/'/g, "''");
  const lat = a.lat !== null ? a.lat : 'NULL';
  const lng = a.lng !== null ? a.lng : 'NULL';
  
  sql += `INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = '${distEscaped}' LIMIT 1), '${code}', '${nomEscaped}', 'Assemblée', ${a.effectif || 0}, ${lat}, ${lng})
ON CONFLICT (code_assemblee) DO NOTHING;\n`;
});
sql += `\n`;

// 3. Utilisateur Administrateur par défaut
sql += `-- 3. UTILISATEUR ADMIN PAR DEFAUT (mot de passe: admin123)\n`;
sql += `INSERT INTO utilisateurs (nom, email, password_hash, role, pays_id) 
VALUES ('Administrateur National', 'admin@tlwm.tg', '$2b$10$EpRnTzWlqHNP0.fKbX9mvevE4b0qK4z5L5/5x.kKx5L5/5x.kKx5L', 'ADMIN_AFRIQUE', (SELECT id FROM pays WHERE code_pays = 'TG' LIMIT 1))
ON CONFLICT (email) DO NOTHING;\n\n`;

fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql);
console.log('✅ Fichier database/seed.sql généré avec succès !');
