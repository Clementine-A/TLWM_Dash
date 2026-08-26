const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const { pays_id } = req.query;
  try {
    let q = `SELECT d.*, p.nom_pays FROM districts d LEFT JOIN pays p ON d.pays_id = p.id WHERE 1=1`;
    const params = [];
    if (pays_id) { params.push(pays_id); q += ` AND d.pays_id = $${params.length}`; }
    q += ` ORDER BY d.nom_district ASC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  const { pays_id, code_district, nom_district } = req.body;
  if (!pays_id || !nom_district) return res.status(400).json({ error: 'pays_id et nom_district requis' });
  try {
    const code = code_district || `D-${Date.now()}`;
    const result = await db.query(
      `INSERT INTO districts (pays_id, code_district, nom_district) VALUES ($1, $2, $3) RETURNING *`,
      [pays_id, code, nom_district.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code district deja utilise' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { pays_id, code_district, nom_district } = req.body;
  try {
    const result = await db.query(
      `UPDATE districts SET pays_id=$1, code_district=$2, nom_district=$3, updated_at=CURRENT_TIMESTAMP
       WHERE id=$4 RETURNING *`,
      [pays_id, code_district, nom_district.trim(), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'District non trouve' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM districts WHERE id=$1', [req.params.id]);
    res.json({ message: 'District supprime' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;