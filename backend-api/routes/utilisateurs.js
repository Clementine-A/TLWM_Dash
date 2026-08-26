const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
    let query = `SELECT u.id, u.nom, u.email, u.role, u.statut,
       u.pays_id, p.nom_pays, u.district_id, d.nom_district,
       u.assemblee_id, a.nom_assemblee, u.created_at
      FROM utilisateurs u
      LEFT JOIN pays p ON u.pays_id = p.id
      LEFT JOIN districts d ON u.district_id = d.id
      LEFT JOIN assemblees a ON u.assemblee_id = a.id WHERE 1=1`;
    const params = [];
    if (!isAdminAfrique && req.user.pays_id) { params.push(req.user.pays_id); query += ` AND u.pays_id = $${params.length}`; }
    if (req.query.statut) { params.push(req.query.statut); query += ` AND u.statut = $${params.length}`; }
    if (req.query.role)   { params.push(req.query.role);   query += ` AND u.role = $${params.length}`; }
    if (req.query.pays_id){ params.push(req.query.pays_id);query += ` AND u.pays_id = $${params.length}`; }
    query += ` ORDER BY u.created_at DESC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { nom, email, password, role, pays_id, district_id, assemblee_id } = req.body;
  if (!nom || !email || !password || !role) return res.status(400).json({ error: 'Champs requis manquants' });
  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
  if (!isAdminAfrique && String(pays_id) !== String(req.user.pays_id)) return res.status(403).json({ error: 'Hors de votre portee' });
  if (!isAdminAfrique && ['ADMIN_AFRIQUE', 'ADMIN'].includes(role)) return res.status(403).json({ error: 'Impossible de creer un Admin Afrique' });
  try {
    const exists = await db.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Email deja utilise' });
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO utilisateurs (nom, email, password_hash, role, statut, pays_id, district_id, assemblee_id)
       VALUES ($1, $2, $3, $4, 'ACTIF', $5, $6, $7) RETURNING id, nom, email, role, statut, created_at`,
      [nom, email.toLowerCase().trim(), hash, role, pays_id||null, district_id||null, assemblee_id||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { nom, email, role, statut, pays_id, district_id, assemblee_id } = req.body;
  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
  try {
    if (!isAdminAfrique) {
      const check = await db.query('SELECT pays_id FROM utilisateurs WHERE id = $1', [req.params.id]);
      if (!check.rows.length || String(check.rows[0].pays_id) !== String(req.user.pays_id)) return res.status(403).json({ error: 'Acces refuse' });
    }
    const result = await db.query(
      `UPDATE utilisateurs SET nom=$1, email=$2, role=$3, statut=$4, pays_id=$5, district_id=$6, assemblee_id=$7
       WHERE id=$8 RETURNING id, nom, email, role, statut, pays_id, district_id, assemblee_id`,
      [nom, email.toLowerCase().trim(), role, statut, pays_id||null, district_id||null, assemblee_id||null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur non trouve' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/statut', authenticateToken, requireAdmin, async (req, res) => {
  const { statut, role } = req.body;
  if (!['ACTIF', 'EN_ATTENTE', 'INACTIF', 'REJETE'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    const updates = ['statut=$1']; const params = [statut];
    if (role) { params.push(role); updates.push(`role=$${params.length}`); }
    params.push(req.params.id);
    const result = await db.query(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING id, nom, statut, role`, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur non trouve' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6)' });
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(new_password, 10);
    const result = await db.query('UPDATE utilisateurs SET password_hash=$1 WHERE id=$2 RETURNING id, nom', [hash, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur non trouve' });
    res.json({ message: `Mot de passe reinitialise pour ${result.rows[0].nom}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
  try {
    if (!isAdminAfrique) {
      const check = await db.query('SELECT pays_id FROM utilisateurs WHERE id = $1', [req.params.id]);
      if (!check.rows.length || String(check.rows[0].pays_id) !== String(req.user.pays_id)) return res.status(403).json({ error: 'Acces refuse' });
    }
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ error: 'Auto-suppression interdite' });
    await db.query('DELETE FROM utilisateurs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Utilisateur supprime' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;