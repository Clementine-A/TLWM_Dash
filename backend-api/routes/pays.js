const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pays ORDER BY nom_pays ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, COUNT(DISTINCT d.id) AS nb_districts, COUNT(DISTINCT a.id) AS nb_assemblees
      FROM pays p
      LEFT JOIN districts d ON d.pays_id = p.id
      LEFT JOIN assemblees a ON a.district_id = d.id
      GROUP BY p.id ORDER BY p.nom_pays ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, COUNT(DISTINCT d.id) AS nb_districts, COUNT(DISTINCT a.id) AS nb_assemblees
      FROM pays p
      LEFT JOIN districts d ON d.pays_id = p.id
      LEFT JOIN assemblees a ON a.district_id = d.id
      WHERE p.id = $1 GROUP BY p.id`, [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  const { code_pays, nom_pays } = req.body;
  if (!code_pays || !nom_pays) return res.status(400).json({ error: 'code_pays et nom_pays requis' });
  try {
    const result = await db.query(
      `INSERT INTO pays (code_pays, nom_pays) VALUES ($1, $2) RETURNING *`,
      [code_pays.toUpperCase().trim(), nom_pays.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code pays deja utilise' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { code_pays, nom_pays } = req.body;
  try {
    const result = await db.query(
      `UPDATE pays SET code_pays=$1, nom_pays=$2 WHERE id=$3 RETURNING *`,
      [code_pays.toUpperCase().trim(), nom_pays.trim(), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pays non trouve' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM pays WHERE id=$1', [req.params.id]);
    res.json({ message: 'Pays supprime' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;