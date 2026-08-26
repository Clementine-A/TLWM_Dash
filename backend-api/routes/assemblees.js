const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const { district_id } = req.query;
  try {
    let q = `SELECT a.*, d.nom_district, d.code_district FROM assemblees a JOIN districts d ON a.district_id = d.id`;
    const params = [];
    if (district_id) { q += ` WHERE a.district_id = $1`; params.push(district_id); }
    q += ` ORDER BY a.nom_assemblee ASC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { district_id, code_assemblee, nom_assemblee, type_unite, pasteur_responsable, effectif_base, latitude, longitude } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, pasteur_responsable, effectif_base, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [district_id, code_assemblee, nom_assemblee, type_unite||'Assemblee', pasteur_responsable, effectif_base||0, latitude||null, longitude||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { district_id, code_assemblee, nom_assemblee, type_unite, pasteur_responsable, effectif_base, latitude, longitude } = req.body;
  try {
    const result = await db.query(
      `UPDATE assemblees SET district_id=$1, code_assemblee=$2, nom_assemblee=$3,
       type_unite=$4, pasteur_responsable=$5, effectif_base=$6, latitude=$7, longitude=$8, updated_at=CURRENT_TIMESTAMP
       WHERE id=$9 RETURNING *`,
      [district_id, code_assemblee, nom_assemblee, type_unite||'Assemblee', pasteur_responsable, effectif_base||0, latitude||null, longitude||null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Assemblee non trouvee' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM assemblees WHERE id=$1', [req.params.id]);
    res.json({ message: 'Assemblee supprimee' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;