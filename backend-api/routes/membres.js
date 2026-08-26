const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const NEW_COLS = [
  'date_salut DATE','date_bapteme DATE','division_ga VARCHAR(100)',
  'situation_matrimoniale VARCHAR(50)','nbre_enfants INTEGER DEFAULT 0',
  "conjoint_sauve VARCHAR(20) DEFAULT 'Non'",'quartier VARCHAR(150)',
  'activite_assemblee VARCHAR(150)','profession VARCHAR(150)',
  "assiduite VARCHAR(50) DEFAULT 'Moyen'","actif_liberalites VARCHAR(20) DEFAULT 'Non'",
  'date_entree_assemblee DATE','date_mutation DATE','ancienne_assemblee VARCHAR(200)'
];

const ensureMembresCols = async () => {
  for (const col of NEW_COLS) {
    await db.query(`ALTER TABLE membres_assemblee ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
  }
  await db.query(`ALTER TABLE membres_assemblee ALTER COLUMN conjoint_sauve TYPE VARCHAR(20)`).catch(() => {});
  await db.query(`ALTER TABLE membres_assemblee ALTER COLUMN actif_liberalites TYPE VARCHAR(20)`).catch(() => {});
};

router.get('/:assembleeId', authenticateToken, async (req, res) => {
  const { statut, type } = req.query;
  try {
    let q = `SELECT * FROM membres_assemblee WHERE assemblee_id=$1`;
    const params = [req.params.assembleeId];
    if (statut) { params.push(statut); q += ` AND statut_membre=$${params.length}`; }
    if (type)   { params.push(type);   q += ` AND type_membre=$${params.length}`; }
    q += ` ORDER BY nom ASC, prenoms ASC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:assembleeId/stats', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE statut_membre='Actif') AS actifs,
        COUNT(*) FILTER (WHERE statut_membre='Inactif') AS inactifs,
        COUNT(*) FILTER (WHERE statut_membre='Visiteur') AS visiteurs,
        COUNT(*) FILTER (WHERE sexe='M') AS hommes,
        COUNT(*) FILTER (WHERE sexe='F') AS femmes,
        COUNT(*) AS total
      FROM membres_assemblee WHERE assemblee_id=$1`, [req.params.assembleeId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:assembleeId', authenticateToken, async (req, res) => {
  const {
    nom, prenoms, sexe, date_naissance, contact, statut_membre, type_membre, date_adhesion, notes,
    date_salut, date_bapteme, division_ga, situation_matrimoniale, nbre_enfants, conjoint_sauve,
    quartier, activite_assemblee, profession, assiduite, actif_liberalites,
    date_entree_assemblee, date_mutation, ancienne_assemblee
  } = req.body;
  if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
  try {
    await ensureMembresCols();
    const result = await db.query(
      `INSERT INTO membres_assemblee
         (assemblee_id, nom, prenoms, sexe, date_naissance, contact, statut_membre, type_membre, date_adhesion, notes,
          date_salut, date_bapteme, division_ga, situation_matrimoniale, nbre_enfants, conjoint_sauve,
          quartier, activite_assemblee, profession, assiduite, actif_liberalites,
          date_entree_assemblee, date_mutation, ancienne_assemblee)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,
      [req.params.assembleeId, nom, prenoms||null, sexe||null, date_naissance||null, contact||null,
       statut_membre||'Actif', type_membre||'Membre', date_adhesion||null, notes||null,
       date_salut||null, date_bapteme||null, division_ga||null,
       situation_matrimoniale||null, nbre_enfants||0, conjoint_sauve||'Non',
       quartier||null, activite_assemblee||null, profession||null,
       assiduite||'Moyen', actif_liberalites||'Non',
       date_entree_assemblee||null, date_mutation||null, ancienne_assemblee||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const {
    nom, prenoms, sexe, date_naissance, contact, statut_membre, type_membre, date_adhesion, notes,
    date_salut, date_bapteme, division_ga, situation_matrimoniale, nbre_enfants, conjoint_sauve,
    quartier, activite_assemblee, profession, assiduite, actif_liberalites,
    date_entree_assemblee, date_mutation, ancienne_assemblee
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE membres_assemblee SET
         nom=$1, prenoms=$2, sexe=$3, date_naissance=$4, contact=$5,
         statut_membre=$6, type_membre=$7, date_adhesion=$8, notes=$9,
         date_salut=$10, date_bapteme=$11, division_ga=$12,
         situation_matrimoniale=$13, nbre_enfants=$14, conjoint_sauve=$15,
         quartier=$16, activite_assemblee=$17, profession=$18,
         assiduite=$19, actif_liberalites=$20,
         date_entree_assemblee=$21, date_mutation=$22, ancienne_assemblee=$23,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$24 RETURNING *`,
      [nom, prenoms||null, sexe||null, date_naissance||null, contact||null,
       statut_membre||'Actif', type_membre||'Membre', date_adhesion||null, notes||null,
       date_salut||null, date_bapteme||null, division_ga||null,
       situation_matrimoniale||null, nbre_enfants||0, conjoint_sauve||'Non',
       quartier||null, activite_assemblee||null, profession||null,
       assiduite||'Moyen', actif_liberalites||'Non',
       date_entree_assemblee||null, date_mutation||null, ancienne_assemblee||null,
       req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Membre non trouve' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM membres_assemblee WHERE id=$1', [req.params.id]);
    res.json({ message: 'Membre supprime' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;