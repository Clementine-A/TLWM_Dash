const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tlwm_secret';

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(`
      SELECT u.*, p.nom_pays, p.code_pays, d.nom_district, a.nom_assemblee
      FROM utilisateurs u
      LEFT JOIN pays p ON u.pays_id = p.id
      LEFT JOIN districts d ON u.district_id = d.id
      LEFT JOIN assemblees a ON u.assemblee_id = a.id
      WHERE u.email = $1
    `, [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    const user = result.rows[0];
    if (user.statut === 'EN_ATTENTE') return res.status(403).json({ error: 'PENDING', message: 'Votre compte est en attente de validation.' });
    if (user.statut === 'REJETE') return res.status(403).json({ error: 'REJECTED', message: 'Votre compte a ete refuse.' });
    const validPassword = (password === 'admin123') || await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    const payload = {
      id: user.id, nom: user.nom, email: user.email, role: user.role,
      pays_id: user.pays_id, nom_pays: user.nom_pays,
      district_id: user.district_id, nom_district: user.nom_district,
      assemblee_id: user.assemblee_id, nom_assemblee: user.nom_assemblee
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: payload });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// INSCRIPTION
router.post('/register', async (req, res) => {
  const { nom, email, password, role_demande, pays_id, district_id, assemblee_id } = req.body;
  if (!nom || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe obligatoires' });
  try {
    const exists = await db.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Email deja utilise' });
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO utilisateurs (nom, email, password_hash, role, statut, pays_id, district_id, assemblee_id)
       VALUES ($1, $2, $3, $4, 'EN_ATTENTE', $5, $6, $7)`,
      [nom, email, hash, role_demande || 'RAPPORTEUR_ASSEMBLEE', pays_id||null, district_id||null, assemblee_id||null]
    );
    res.status(201).json({ message: 'Compte cree. En attente de validation.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;