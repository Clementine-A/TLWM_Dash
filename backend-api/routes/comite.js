const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/:assembleeId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM comite_assemblee WHERE assemblee_id=$1 ORDER BY id ASC', [req.params.assembleeId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:assembleeId', async (req, res) => {
  const { fonction, nom, prenoms, contact, date_entree_fonction } = req.body;
  try {
    await db.query(`ALTER TABLE comite_assemblee ADD COLUMN IF NOT EXISTS date_entree_fonction DATE`).catch(() => {});
    const result = await db.query(
      `INSERT INTO comite_assemblee (assemblee_id, fonction, nom, prenoms, contact, date_entree_fonction)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.assembleeId, fonction, nom, prenoms, contact, date_entree_fonction||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/membre/:id', authenticateToken, async (req, res) => {
  const { fonction, nom, prenoms, contact, date_entree_fonction } = req.body;
  try {
    await db.query(`ALTER TABLE comite_assemblee ADD COLUMN IF NOT EXISTS date_entree_fonction DATE`).catch(() => {});
    const result = await db.query(
      `UPDATE comite_assemblee SET fonction=$1, nom=$2, prenoms=$3, contact=$4,
       date_entree_fonction=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *`,
      [fonction, nom, prenoms, contact, date_entree_fonction||null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Membre comite non trouve' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/membre/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM comite_assemblee WHERE id=$1', [req.params.id]);
    res.json({ message: 'Membre du comite supprime' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;