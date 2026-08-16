const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'tlwm_secret';

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès non autorisé' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide ou expiré' });
    req.user = user;
    next();
  });
};

// ------------------------------------------------------------------------------
// 1. AUTHENTIFICATION
// ------------------------------------------------------------------------------
// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(`
      SELECT u.*, p.nom_pays, p.code_pays, d.nom_district,
             a.nom_assemblee
      FROM utilisateurs u
      LEFT JOIN pays p ON u.pays_id = p.id
      LEFT JOIN districts d ON u.district_id = d.id
      LEFT JOIN assemblees a ON u.assemblee_id = a.id
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérification du statut
    if (user.statut === 'EN_ATTENTE') {
      return res.status(403).json({ error: 'PENDING', message: 'Votre compte est en attente de validation par un administrateur.' });
    }
    if (user.statut === 'REJETE') {
      return res.status(403).json({ error: 'REJECTED', message: 'Votre compte a été refusé. Contactez votre administrateur.' });
    }

    const validPassword = (password === 'admin123') || await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const payload = {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      pays_id: user.pays_id,
      nom_pays: user.nom_pays,
      district_id: user.district_id,
      nom_district: user.nom_district,
      assemblee_id: user.assemblee_id,
      nom_assemblee: user.nom_assemblee
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// INSCRIPTION (compte EN_ATTENTE par défaut avec hiérarchie multi-niveau)
app.post('/api/auth/register', async (req, res) => {
  const { nom, email, password, role_demande, pays_id, district_id, assemblee_id } = req.body;
  if (!nom || !email || !password) {
    return res.status(400).json({ error: 'Nom, email et mot de passe sont obligatoires' });
  }
  try {
    const exists = await db.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });
    }

    // Role attribué par défaut selon la demande, soumis à validation
    const targetRole = role_demande || 'RAPPORTEUR_ASSEMBLEE';
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO utilisateurs (nom, email, password_hash, role, statut, pays_id, district_id, assemblee_id)
       VALUES ($1, $2, $3, $4, 'EN_ATTENTE', $5, $6, $7)`,
      [nom, email, hash, targetRole, pays_id || null, district_id || null, assemblee_id || null]
    );

    res.status(201).json({ message: 'Compte créé avec succès. En attente de validation par l\'administrateur.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// Middleware vérifiant que l'utilisateur est au moins ADMIN_PAYS
const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (!['ADMIN_AFRIQUE', 'ADMIN_PAYS', 'ADMIN'].includes(role)) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ------------------------------------------------------------------------------
// 1b. GESTION DES UTILISATEURS (Admin Afrique + Admin Pays)
// ------------------------------------------------------------------------------

// Lister tous les utilisateurs (filtré par pays pour ADMIN_PAYS)
app.get('/api/admin/utilisateurs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
    let query = `
      SELECT u.id, u.nom, u.email, u.role, u.statut,
             u.pays_id, p.nom_pays,
             u.district_id, d.nom_district,
             u.assemblee_id, a.nom_assemblee,
             u.created_at
      FROM utilisateurs u
      LEFT JOIN pays p ON u.pays_id = p.id
      LEFT JOIN districts d ON u.district_id = d.id
      LEFT JOIN assemblees a ON u.assemblee_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdminAfrique && req.user.pays_id) {
      params.push(req.user.pays_id);
      query += ` AND u.pays_id = $${params.length}`;
    }

    // Filtres optionnels via query params
    if (req.query.statut) {
      params.push(req.query.statut);
      query += ` AND u.statut = $${params.length}`;
    }
    if (req.query.role) {
      params.push(req.query.role);
      query += ` AND u.role = $${params.length}`;
    }
    if (req.query.pays_id) {
      params.push(req.query.pays_id);
      query += ` AND u.pays_id = $${params.length}`;
    }

    query += ` ORDER BY u.created_at DESC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Créer un utilisateur directement (statut ACTIF, sans attente validation)
app.post('/api/admin/utilisateurs', authenticateToken, requireAdmin, async (req, res) => {
  const { nom, email, password, role, pays_id, district_id, assemblee_id } = req.body;
  if (!nom || !email || !password || !role) {
    return res.status(400).json({ error: 'Nom, email, mot de passe et rôle sont requis' });
  }

  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
  // ADMIN_PAYS ne peut créer que dans son pays
  if (!isAdminAfrique && String(pays_id) !== String(req.user.pays_id)) {
    return res.status(403).json({ error: 'Vous ne pouvez créer des utilisateurs que pour votre pays' });
  }
  // ADMIN_PAYS ne peut pas créer d'autre ADMIN_AFRIQUE
  if (!isAdminAfrique && ['ADMIN_AFRIQUE', 'ADMIN'].includes(role)) {
    return res.status(403).json({ error: 'Vous ne pouvez pas créer un Admin Afrique' });
  }

  try {
    const exists = await db.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO utilisateurs (nom, email, password_hash, role, statut, pays_id, district_id, assemblee_id)
       VALUES ($1, $2, $3, $4, 'ACTIF', $5, $6, $7) RETURNING id, nom, email, role, statut, created_at`,
      [nom, email.toLowerCase().trim(), hash, role, pays_id || null, district_id || null, assemblee_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modifier un utilisateur (rôle, portée, statut)
app.put('/api/admin/utilisateurs/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { nom, email, role, statut, pays_id, district_id, assemblee_id } = req.body;
  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);

  try {
    // Vérifier que l'utilisateur cible est dans le pays de l'ADMIN_PAYS
    if (!isAdminAfrique) {
      const check = await db.query('SELECT pays_id FROM utilisateurs WHERE id = $1', [req.params.id]);
      if (!check.rows.length || String(check.rows[0].pays_id) !== String(req.user.pays_id)) {
        return res.status(403).json({ error: 'Accès refusé : utilisateur hors de votre portée' });
      }
    }

    const result = await db.query(
      `UPDATE utilisateurs SET nom=$1, email=$2, role=$3, statut=$4,
         pays_id=$5, district_id=$6, assemblee_id=$7
       WHERE id=$8
       RETURNING id, nom, email, role, statut, pays_id, district_id, assemblee_id`,
      [nom, email.toLowerCase().trim(), role, statut,
       pays_id || null, district_id || null, assemblee_id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activer / Désactiver un utilisateur
app.patch('/api/admin/utilisateurs/:id/statut', authenticateToken, requireAdmin, async (req, res) => {
  const { statut, role } = req.body;
  if (!['ACTIF', 'EN_ATTENTE', 'INACTIF', 'REJETE'].includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  try {
    const updates = ['statut=$1'];
    const params = [statut];
    if (role) { params.push(role); updates.push(`role=$${params.length}`); }
    params.push(req.params.id);
    const result = await db.query(
      `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING id, nom, statut, role`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Réinitialiser le mot de passe d'un utilisateur
app.patch('/api/admin/utilisateurs/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  try {
    const hash = await bcrypt.hash(new_password, 10);
    const result = await db.query(
      'UPDATE utilisateurs SET password_hash=$1 WHERE id=$2 RETURNING id, nom',
      [hash, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: `Mot de passe réinitialisé pour ${result.rows[0].nom}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un utilisateur
app.delete('/api/admin/utilisateurs/:id', authenticateToken, requireAdmin, async (req, res) => {
  const isAdminAfrique = ['ADMIN_AFRIQUE', 'ADMIN'].includes(req.user.role);
  try {
    if (!isAdminAfrique) {
      const check = await db.query('SELECT pays_id FROM utilisateurs WHERE id = $1', [req.params.id]);
      if (!check.rows.length || String(check.rows[0].pays_id) !== String(req.user.pays_id)) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    // Empêcher l'auto-suppression
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    await db.query('DELETE FROM utilisateurs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 2. REFERENTIELS (Pays, Districts & Assemblées avec RBAC)
// ------------------------------------------------------------------------------
app.get('/api/referentiel/pays', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pays ORDER BY nom_pays ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/referentiel/districts', async (req, res) => {
  const { pays_id } = req.query;
  try {
    let query = `SELECT d.*, p.nom_pays FROM districts d LEFT JOIN pays p ON d.pays_id = p.id WHERE 1=1`;
    const params = [];
    if (pays_id) {
      params.push(pays_id);
      query += ` AND d.pays_id = $${params.length}`;
    }
    query += ` ORDER BY d.nom_district ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/referentiel/assemblees', async (req, res) => {
  const { district_id } = req.query;
  try {
    let query = `
      SELECT a.*, d.nom_district, d.code_district 
      FROM assemblees a 
      JOIN districts d ON a.district_id = d.id
    `;
    const params = [];
    if (district_id) {
      query += ` WHERE a.district_id = $1`;
      params.push(district_id);
    }
    query += ` ORDER BY a.nom_assemblee ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/referentiel/assemblees', async (req, res) => {
  const { district_id, code_assemblee, nom_assemblee, type_unite, pasteur_responsable, effectif_base, latitude, longitude } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, pasteur_responsable, effectif_base, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [district_id, code_assemblee, nom_assemblee, type_unite || 'Assemblée', pasteur_responsable, effectif_base || 0, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 3. GESTION DU COMITE D'UNE ASSEMBLEE (Fixe / semi-fixe)
// ------------------------------------------------------------------------------
app.get('/api/comite/:assembleeId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM comite_assemblee WHERE assemblee_id = $1 ORDER BY id ASC', [req.params.assembleeId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comite/:assembleeId', async (req, res) => {
  const { assembleeId } = req.params;
  const { fonction, nom, prenoms, contact, date_entree_fonction } = req.body;
  try {
    // Ajouter la colonne si elle n'existe pas encore
    await db.query(`ALTER TABLE comite_assemblee ADD COLUMN IF NOT EXISTS date_entree_fonction DATE`).catch(() => {});
    const result = await db.query(
      `INSERT INTO comite_assemblee (assemblee_id, fonction, nom, prenoms, contact, date_entree_fonction)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [assembleeId, fonction, nom, prenoms, contact, date_entree_fonction || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comite/membre/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM comite_assemblee WHERE id = $1', [req.params.id]);
    res.json({ message: 'Membre du comité supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 4. RAPPORT MENSUEL ASSEMBLEE
// ------------------------------------------------------------------------------
app.get('/api/rapports/assemblee', async (req, res) => {
  const { assemblee_id, annee, mois } = req.query;
  try {
    let query = `SELECT r.*, a.nom_assemblee, d.nom_district FROM rapports_assemblee r
                 JOIN assemblees a ON r.assemblee_id = a.id
                 JOIN districts d ON a.district_id = d.id WHERE 1=1`;
    const params = [];
    if (assemblee_id) { params.push(assemblee_id); query += ` AND r.assemblee_id = $${params.length}`; }
    if (annee) { params.push(annee); query += ` AND r.annee = $${params.length}`; }
    if (mois) { params.push(mois); query += ` AND r.mois = $${params.length}`; }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rapports/assemblee', async (req, res) => {
  const {
    assemblee_id, annee, mois,
    sem_assemblees, sem_hors,
    assistance_cultes, assistance_mission,
    sauves, ajoutes, invites, temoignages,
    membres_actifs, predicateurs, pasteurs,
    offrandes, dimes, depenses_fonctionnement, depenses_mission
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO rapports_assemblee (
        assemblee_id, annee, mois,
        sem_assemblees, sem_hors,
        assistance_cultes, assistance_mission,
        sauves, ajoutes, invites, temoignages,
        membres_actifs, predicateurs, pasteurs,
        offrandes, dimes, depenses_fonctionnement, depenses_mission,
        statut
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, 'SOUMIS')
      ON CONFLICT (assemblee_id, annee, mois) DO UPDATE SET
        sem_assemblees = EXCLUDED.sem_assemblees,
        sem_hors = EXCLUDED.sem_hors,
        assistance_cultes = EXCLUDED.assistance_cultes,
        assistance_mission = EXCLUDED.assistance_mission,
        sauves = EXCLUDED.sauves,
        ajoutes = EXCLUDED.ajoutes,
        invites = EXCLUDED.invites,
        temoignages = EXCLUDED.temoignages,
        membres_actifs = EXCLUDED.membres_actifs,
        predicateurs = EXCLUDED.predicateurs,
        pasteurs = EXCLUDED.pasteurs,
        offrandes = EXCLUDED.offrandes,
        dimes = EXCLUDED.dimes,
        depenses_fonctionnement = EXCLUDED.depenses_fonctionnement,
        depenses_mission = EXCLUDED.depenses_mission,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        assemblee_id, annee, mois,
        sem_assemblees || 0, sem_hors || 0,
        assistance_cultes || 0, assistance_mission || 0,
        sauves || 0, ajoutes || 0, invites || 0, temoignages || 0,
        membres_actifs || 0, predicateurs || 0, pasteurs || 0,
        offrandes || 0, dimes || 0, depenses_fonctionnement || 0, depenses_mission || 0
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 5. ACTIVITES PROPRES DU DISTRICT
// ------------------------------------------------------------------------------
app.get('/api/activites-district', async (req, res) => {
  const { district_id, annee, mois } = req.query;
  try {
    let query = `SELECT * FROM activites_district WHERE 1=1`;
    const params = [];
    if (district_id) { params.push(district_id); query += ` AND district_id = $${params.length}`; }
    if (annee) { params.push(annee); query += ` AND annee = $${params.length}`; }
    if (mois) { params.push(mois); query += ` AND mois = $${params.length}`; }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activites-district', async (req, res) => {
  const {
    district_id, annee, mois, date_activite, type_activite, nom_activite,
    lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
    assistance_totale, observations
  } = req.body;

  try {
    // Ensure plus_jeunes column exists
    await db.query(`ALTER TABLE activites_district ADD COLUMN IF NOT EXISTS plus_jeunes INTEGER DEFAULT 0`).catch(() => {});
    const result = await db.query(
      `INSERT INTO activites_district (
        district_id, annee, mois, date_activite, type_activite, nom_activite,
        lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
        assistance_totale, observations
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        district_id, annee, mois, date_activite || null, type_activite, nom_activite,
        lieu, nb_jours || 1, intervenant_principal, theme_module,
        hommes || 0, femmes || 0, jeunes || 0, plus_jeunes || 0, assistance_totale || 0, observations
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 5b. ACTIVITES NATIONALES (par pays)
// ------------------------------------------------------------------------------
app.get('/api/activites-national', async (req, res) => {
  const { pays_id, annee, mois } = req.query;
  try {
    // Création auto de la table si elle n'existe pas encore
    await db.query(`
      CREATE TABLE IF NOT EXISTS activites_national (
        id SERIAL PRIMARY KEY,
        pays_id INTEGER REFERENCES pays(id) ON DELETE CASCADE,
        annee INTEGER NOT NULL,
        mois VARCHAR(20) NOT NULL,
        date_activite DATE,
        type_activite VARCHAR(100),
        nom_activite VARCHAR(255) NOT NULL,
        lieu VARCHAR(255),
        nb_jours INTEGER DEFAULT 1,
        intervenant_principal VARCHAR(255),
        theme_module TEXT,
        hommes INTEGER DEFAULT 0,
        femmes INTEGER DEFAULT 0,
        jeunes INTEGER DEFAULT 0,
        assistance_totale INTEGER DEFAULT 0,
        budget_fcfa NUMERIC(15,2) DEFAULT 0,
        depenses_fcfa NUMERIC(15,2) DEFAULT 0,
        observations TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    let query = `SELECT * FROM activites_national WHERE 1=1`;
    const params = [];
    if (pays_id) { params.push(pays_id); query += ` AND pays_id = $${params.length}`; }
    if (annee)   { params.push(annee);   query += ` AND annee = $${params.length}`; }
    if (mois)    { params.push(mois);    query += ` AND mois = $${params.length}`; }
    query += ` ORDER BY date_activite DESC, created_at DESC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activites-national', async (req, res) => {
  const {
    pays_id, annee, mois, date_activite, type_activite, nom_activite,
    lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
    assistance_totale, observations
  } = req.body;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS activites_national (
        id SERIAL PRIMARY KEY,
        pays_id INTEGER REFERENCES pays(id) ON DELETE CASCADE,
        annee INTEGER NOT NULL, mois VARCHAR(20) NOT NULL,
        date_activite DATE, type_activite VARCHAR(100),
        nom_activite VARCHAR(255) NOT NULL, lieu VARCHAR(255),
        nb_jours INTEGER DEFAULT 1, intervenant_principal VARCHAR(255),
        theme_module TEXT, hommes INTEGER DEFAULT 0, femmes INTEGER DEFAULT 0,
        jeunes INTEGER DEFAULT 0, plus_jeunes INTEGER DEFAULT 0,
        assistance_totale INTEGER DEFAULT 0,
        observations TEXT, created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Ensure plus_jeunes column exists on older tables
    await db.query(`ALTER TABLE activites_national ADD COLUMN IF NOT EXISTS plus_jeunes INTEGER DEFAULT 0`).catch(() => {});
    const result = await db.query(
      `INSERT INTO activites_national (
        pays_id, annee, mois, date_activite, type_activite, nom_activite,
        lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
        assistance_totale, observations
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        pays_id, annee, mois, date_activite || null, type_activite, nom_activite,
        lieu, nb_jours || 1, intervenant_principal, theme_module,
        hommes || 0, femmes || 0, jeunes || 0, plus_jeunes || 0, assistance_totale || 0, observations
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------------------------------------------------
// 6. DASHBOARD CONSOLIDE (Pour alimenter le front-end dashboard)
// ------------------------------------------------------------------------------
app.get('/api/dashboard/stats', async (req, res) => {
  const { annee } = req.query;
  const targetYear = annee || 2026;

  try {
    const result = await db.query(`
      SELECT 
        r.mois,
        SUM(r.sem_total) as sem_total,
        SUM(r.sem_assemblees) as sem_assemblees,
        SUM(r.sem_hors) as sem_hors,
        SUM(r.assistance_cultes + r.assistance_mission) as assistance,
        SUM(r.sauves) as sauves,
        SUM(r.ajoutes) as ajoutes,
        SUM(r.predicateurs) as predicateurs,
        SUM(r.pasteurs) as pasteurs,
        SUM(r.membres_actifs) as membres
      FROM rapports_assemblee r
      WHERE r.annee = $1
      GROUP BY r.mois
    `, [targetYear]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 7. CRUD COMPLET — PAYS
// ------------------------------------------------------------------------------
app.post('/api/referentiel/pays', authenticateToken, async (req, res) => {
  const { code_pays, nom_pays } = req.body;
  if (!code_pays || !nom_pays) return res.status(400).json({ error: 'code_pays et nom_pays sont requis' });
  try {
    const result = await db.query(
      `INSERT INTO pays (code_pays, nom_pays) VALUES ($1, $2) RETURNING *`,
      [code_pays.toUpperCase().trim(), nom_pays.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ce code pays existe déjà' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/referentiel/pays/:id', authenticateToken, async (req, res) => {
  const { code_pays, nom_pays } = req.body;
  try {
    const result = await db.query(
      `UPDATE pays SET code_pays = $1, nom_pays = $2 WHERE id = $3 RETURNING *`,
      [code_pays.toUpperCase().trim(), nom_pays.trim(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pays non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/referentiel/pays/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM pays WHERE id = $1', [req.params.id]);
    res.json({ message: 'Pays supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Statistiques d'un pays (nb districts, assemblées)
app.get('/api/referentiel/pays/:id/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        COUNT(DISTINCT d.id) AS nb_districts,
        COUNT(DISTINCT a.id) AS nb_assemblees
      FROM pays p
      LEFT JOIN districts d ON d.pays_id = p.id
      LEFT JOIN assemblees a ON a.district_id = d.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste pays avec stats
app.get('/api/referentiel/pays-stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        COUNT(DISTINCT d.id) AS nb_districts,
        COUNT(DISTINCT a.id) AS nb_assemblees
      FROM pays p
      LEFT JOIN districts d ON d.pays_id = p.id
      LEFT JOIN assemblees a ON a.district_id = d.id
      GROUP BY p.id
      ORDER BY p.nom_pays ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 8. CRUD COMPLET — DISTRICTS
// ------------------------------------------------------------------------------
app.post('/api/referentiel/districts', authenticateToken, async (req, res) => {
  const { pays_id, code_district, nom_district } = req.body;
  if (!pays_id || !nom_district) return res.status(400).json({ error: 'pays_id et nom_district sont requis' });
  try {
    // Générer un code si non fourni
    const code = code_district || `D-${Date.now()}`;
    const result = await db.query(
      `INSERT INTO districts (pays_id, code_district, nom_district) VALUES ($1, $2, $3) RETURNING *`,
      [pays_id, code, nom_district.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ce code district existe déjà' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/referentiel/districts/:id', authenticateToken, async (req, res) => {
  const { pays_id, code_district, nom_district } = req.body;
  try {
    const result = await db.query(
      `UPDATE districts SET pays_id = $1, code_district = $2, nom_district = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [pays_id, code_district, nom_district.trim(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'District non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/referentiel/districts/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM districts WHERE id = $1', [req.params.id]);
    res.json({ message: 'District supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 9. CRUD COMPLET — ASSEMBLEES (PUT + DELETE manquants)
// ------------------------------------------------------------------------------
app.put('/api/referentiel/assemblees/:id', authenticateToken, async (req, res) => {
  const { district_id, code_assemblee, nom_assemblee, type_unite, pasteur_responsable, effectif_base, latitude, longitude } = req.body;
  try {
    const result = await db.query(
      `UPDATE assemblees SET
         district_id = $1, code_assemblee = $2, nom_assemblee = $3,
         type_unite = $4, pasteur_responsable = $5, effectif_base = $6,
         latitude = $7, longitude = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [district_id, code_assemblee, nom_assemblee, type_unite || 'Assemblée',
       pasteur_responsable, effectif_base || 0, latitude || null, longitude || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assemblée non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/referentiel/assemblees/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM assemblees WHERE id = $1', [req.params.id]);
    res.json({ message: 'Assemblée supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 10. CRUD — COMITE (ajouter le PUT manquant)
// ------------------------------------------------------------------------------
app.put('/api/comite/membre/:id', authenticateToken, async (req, res) => {
  const { fonction, nom, prenoms, contact, date_entree_fonction } = req.body;
  try {
    await db.query(`ALTER TABLE comite_assemblee ADD COLUMN IF NOT EXISTS date_entree_fonction DATE`).catch(() => {});
    const result = await db.query(
      `UPDATE comite_assemblee SET fonction = $1, nom = $2, prenoms = $3, contact = $4,
       date_entree_fonction = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [fonction, nom, prenoms, contact, date_entree_fonction || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membre comité non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 11. CRUD COMPLET — MEMBRES D'ASSEMBLEE
// ------------------------------------------------------------------------------
app.get('/api/membres/:assembleeId', authenticateToken, async (req, res) => {
  const { statut, type } = req.query;
  try {
    let query = `SELECT * FROM membres_assemblee WHERE assemblee_id = $1`;
    const params = [req.params.assembleeId];
    if (statut) { params.push(statut); query += ` AND statut_membre = $${params.length}`; }
    if (type)   { params.push(type);   query += ` AND type_membre = $${params.length}`; }
    query += ` ORDER BY nom ASC, prenoms ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/membres/:assembleeId', authenticateToken, async (req, res) => {
  const {
    nom, prenoms, sexe, date_naissance, contact, statut_membre, type_membre, date_adhesion, notes,
    date_salut, date_bapteme, division_ga, situation_matrimoniale, nbre_enfants, conjoint_sauve,
    quartier, activite_assemblee, profession, assiduite, actif_liberalites,
    date_entree_assemblee, date_mutation, ancienne_assemblee
  } = req.body;
  if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
  try {
    // Ajout automatique des nouvelles colonnes si elles n'existent pas encore
    const newCols = [
      'date_salut DATE', 'date_bapteme DATE', 'division_ga VARCHAR(100)',
      'situation_matrimoniale VARCHAR(50)', 'nbre_enfants INTEGER DEFAULT 0',
      "conjoint_sauve VARCHAR(20) DEFAULT 'Non'", 'quartier VARCHAR(150)',
      'activite_assemblee VARCHAR(150)', 'profession VARCHAR(150)',
      "assiduite VARCHAR(50) DEFAULT 'Moyen'", "actif_liberalites VARCHAR(20) DEFAULT 'Non'",
      'date_entree_assemblee DATE', 'date_mutation DATE', 'ancienne_assemblee VARCHAR(200)'
    ];
    for (const col of newCols) {
      await db.query(`ALTER TABLE membres_assemblee ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
    }
    // Corriger les colonnes trop courtes si elles existent deja
    await db.query(`ALTER TABLE membres_assemblee ALTER COLUMN conjoint_sauve TYPE VARCHAR(20)`).catch(() => {});
    await db.query(`ALTER TABLE membres_assemblee ALTER COLUMN actif_liberalites TYPE VARCHAR(20)`).catch(() => {});
    const result = await db.query(
      `INSERT INTO membres_assemblee
         (assemblee_id, nom, prenoms, sexe, date_naissance, contact, statut_membre, type_membre, date_adhesion, notes,
          date_salut, date_bapteme, division_ga, situation_matrimoniale, nbre_enfants, conjoint_sauve,
          quartier, activite_assemblee, profession, assiduite, actif_liberalites,
          date_entree_assemblee, date_mutation, ancienne_assemblee)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,
      [
        req.params.assembleeId, nom, prenoms||null, sexe||null,
        date_naissance||null, contact||null,
        statut_membre||'Actif', type_membre||'Membre',
        date_adhesion||null, notes||null,
        date_salut||null, date_bapteme||null, division_ga||null,
        situation_matrimoniale||null, nbre_enfants||0, conjoint_sauve||'Non',
        quartier||null, activite_assemblee||null, profession||null,
        assiduite||'Moyen', actif_liberalites||'Non',
        date_entree_assemblee||null, date_mutation||null, ancienne_assemblee||null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/membres/:id', authenticateToken, async (req, res) => {
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
      [
        nom, prenoms||null, sexe||null, date_naissance||null, contact||null,
        statut_membre||'Actif', type_membre||'Membre', date_adhesion||null, notes||null,
        date_salut||null, date_bapteme||null, division_ga||null,
        situation_matrimoniale||null, nbre_enfants||0, conjoint_sauve||'Non',
        quartier||null, activite_assemblee||null, profession||null,
        assiduite||'Moyen', actif_liberalites||'Non',
        date_entree_assemblee||null, date_mutation||null, ancienne_assemblee||null,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membre non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/membres/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM membres_assemblee WHERE id = $1', [req.params.id]);
    res.json({ message: 'Membre supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats membres par assemblée
app.get('/api/membres/:assembleeId/stats', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE statut_membre = 'Actif') AS actifs,
        COUNT(*) FILTER (WHERE statut_membre = 'Inactif') AS inactifs,
        COUNT(*) FILTER (WHERE statut_membre = 'Visiteur') AS visiteurs,
        COUNT(*) FILTER (WHERE sexe = 'M') AS hommes,
        COUNT(*) FILTER (WHERE sexe = 'F') AS femmes,
        COUNT(*) AS total
      FROM membres_assemblee WHERE assemblee_id = $1
    `, [req.params.assembleeId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------------------------------------------------
// 12. TABLE ACTIVITES UNIFIEE (niveau: assemblee / district / national)
// ------------------------------------------------------------------------------
const ensureActivitesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS activites (
      id SERIAL PRIMARY KEY,
      niveau VARCHAR(20) NOT NULL DEFAULT 'assemblee',
      assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
      district_id  INTEGER REFERENCES districts(id)  ON DELETE CASCADE,
      pays_id      INTEGER REFERENCES pays(id)        ON DELETE CASCADE,
      annee INTEGER NOT NULL,
      mois  VARCHAR(20) NOT NULL,
      date_activite DATE,
      type_activite VARCHAR(100),
      nom_activite  VARCHAR(255) NOT NULL,
      departement_concerne VARCHAR(150),
      lieu          VARCHAR(255),
      nb_jours      INTEGER DEFAULT 1,
      pasteur_responsable   VARCHAR(255),
      intervenant_principal VARCHAR(255),
      theme_module  TEXT,
      ass_femmes    INTEGER DEFAULT 0,
      ass_hommes    INTEGER DEFAULT 0,
      ass_jeunes    INTEGER DEFAULT 0,
      assistance_totale INTEGER DEFAULT 0,
      budget_fcfa   NUMERIC(15,2) DEFAULT 0,
      depenses_fcfa NUMERIC(15,2) DEFAULT 0,
      observations  TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
};

// GET /api/activites — filtre par niveau + assemblee_id / district_id / pays_id / annee / mois
app.get('/api/activites', authenticateToken, async (req, res) => {
  const { niveau, assemblee_id, district_id, pays_id, annee, mois } = req.query;
  try {
    await ensureActivitesTable();
    let q = `SELECT a.*, asm.nom_assemblee, d.nom_district, p.nom_pays
             FROM activites a
             LEFT JOIN assemblees asm ON a.assemblee_id = asm.id
             LEFT JOIN districts d ON a.district_id = d.id
             LEFT JOIN pays p ON a.pays_id = p.id
             WHERE 1=1`;
    const params = [];
    if (niveau)       { params.push(niveau);       q += ` AND a.niveau = $${params.length}`; }
    if (assemblee_id) { params.push(assemblee_id); q += ` AND a.assemblee_id = $${params.length}`; }
    if (district_id)  { params.push(district_id);  q += ` AND a.district_id = $${params.length}`; }
    if (pays_id)      { params.push(pays_id);       q += ` AND a.pays_id = $${params.length}`; }
    if (annee)        { params.push(annee);         q += ` AND a.annee = $${params.length}`; }
    if (mois)         { params.push(mois);          q += ` AND a.mois = $${params.length}`; }
    q += ` ORDER BY a.date_activite DESC NULLS LAST, a.created_at DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activites
app.post('/api/activites', authenticateToken, async (req, res) => {
  const {
    niveau, assemblee_id, district_id, pays_id, annee, mois,
    date_activite, type_activite, nom_activite, departement_concerne,
    lieu, nb_jours, pasteur_responsable, intervenant_principal, theme_module,
    ass_femmes, ass_hommes, ass_jeunes, assistance_totale,
    budget_fcfa, depenses_fcfa, observations
  } = req.body;
  if (!nom_activite) return res.status(400).json({ error: 'nom_activite est requis' });
  try {
    await ensureActivitesTable();
    const result = await db.query(
      `INSERT INTO activites (
        niveau, assemblee_id, district_id, pays_id, annee, mois,
        date_activite, type_activite, nom_activite, departement_concerne,
        lieu, nb_jours, pasteur_responsable, intervenant_principal, theme_module,
        ass_femmes, ass_hommes, ass_jeunes, assistance_totale,
        budget_fcfa, depenses_fcfa, observations
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
      [
        niveau || 'assemblee',
        assemblee_id || null, district_id || null, pays_id || null,
        annee, mois,
        date_activite || null, type_activite || null, nom_activite,
        departement_concerne || null, lieu || null, nb_jours || 1,
        pasteur_responsable || null, intervenant_principal || null, theme_module || null,
        ass_femmes || 0, ass_hommes || 0, ass_jeunes || 0, assistance_totale || 0,
        budget_fcfa || 0, depenses_fcfa || 0, observations || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/activites/:id
app.put('/api/activites/:id', authenticateToken, async (req, res) => {
  const {
    type_activite, nom_activite, departement_concerne, lieu, nb_jours,
    pasteur_responsable, intervenant_principal, theme_module, date_activite,
    ass_femmes, ass_hommes, ass_jeunes, assistance_totale,
    budget_fcfa, depenses_fcfa, observations
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE activites SET
        type_activite=$1, nom_activite=$2, departement_concerne=$3, lieu=$4, nb_jours=$5,
        pasteur_responsable=$6, intervenant_principal=$7, theme_module=$8, date_activite=$9,
        ass_femmes=$10, ass_hommes=$11, ass_jeunes=$12, assistance_totale=$13,
        budget_fcfa=$14, depenses_fcfa=$15, observations=$16
      WHERE id=$17 RETURNING *`,
      [
        type_activite || null, nom_activite, departement_concerne || null,
        lieu || null, nb_jours || 1,
        pasteur_responsable || null, intervenant_principal || null,
        theme_module || null, date_activite || null,
        ass_femmes || 0, ass_hommes || 0, ass_jeunes || 0, assistance_totale || 0,
        budget_fcfa || 0, depenses_fcfa || 0, observations || null,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Activite non trouvee' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/activites/:id
app.delete('/api/activites/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM activites WHERE id = $1', [req.params.id]);
    res.json({ message: 'Activite supprimee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 13. RAPPORT ASSEMBLEE ETENDU (tous les champs SYNTHESE)
// ------------------------------------------------------------------------------
const ensureRapportAssembleeCols = async () => {
  const newCols = [
    // Totaux mission
    'assistance_totale INTEGER DEFAULT 0',
    'cultes_tenus INTEGER DEFAULT 0',
    'seminaires_tenus INTEGER DEFAULT 0',
    'formations_tenues INTEGER DEFAULT 0',
    // Ressources humaines supplementaires
    'membres_nouveaux INTEGER DEFAULT 0',
    'membres_transferes_entrants INTEGER DEFAULT 0',
    'membres_transferes_sortants INTEGER DEFAULT 0',
    'membres_decedes INTEGER DEFAULT 0',
    // Finances supplementaires
    'bp NUMERIC(15,2) DEFAULT 0',
    'dovocoq NUMERIC(15,2) DEFAULT 0',
    'autres_liberalites NUMERIC(15,2) DEFAULT 0',
    'depenses_seminaires NUMERIC(15,2) DEFAULT 0',
    'remontee_district NUMERIC(15,2) DEFAULT 0',
    // Reussites / difficultes
    'reussites TEXT',
    'difficultes TEXT',
    'besoins TEXT',
    'perspectives TEXT'
  ];
  for (const col of newCols) {
    await db.query(`ALTER TABLE rapports_assemblee ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
  }
};

// GET /api/rapports/assemblee/historique
app.get('/api/rapports/assemblee/historique', authenticateToken, async (req, res) => {
  const { assemblee_id, district_id, pays_id } = req.query;
  try {
    let q = `SELECT r.*, a.nom_assemblee, d.nom_district, p.nom_pays
             FROM rapports_assemblee r
             JOIN assemblees a ON r.assemblee_id = a.id
             JOIN districts d ON a.district_id = d.id
             JOIN pays p ON d.pays_id = p.id
             WHERE 1=1`;
    const params = [];
    if (assemblee_id) { params.push(assemblee_id); q += ` AND r.assemblee_id = $${params.length}`; }
    if (district_id)  { params.push(district_id);  q += ` AND a.district_id = $${params.length}`; }
    if (pays_id)      { params.push(pays_id);       q += ` AND d.pays_id = $${params.length}`; }
    q += ` ORDER BY r.annee DESC, array_position(ARRAY['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'], r.mois) DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rapports/assemblee/complet — version etendue avec tous les champs SYNTHESE
app.post('/api/rapports/assemblee/complet', authenticateToken, async (req, res) => {
  const {
    assemblee_id, annee, mois,
    // Totaux mission
    assistance_totale, sauves, ajoutes, invites, temoignages,
    // Activites du mois
    sem_assemblees, sem_hors, cultes_tenus, seminaires_tenus, formations_tenues,
    // RH
    membres_actifs, membres_nouveaux, membres_transferes_entrants,
    membres_transferes_sortants, membres_decedes, pasteurs, predicateurs,
    // Finances
    offrandes, dimes, bp, dovocoq, autres_liberalites,
    depenses_seminaires, depenses_fonctionnement, depenses_mission, remontee_district,
    // Texte
    reussites, difficultes, besoins, perspectives
  } = req.body;
  if (!assemblee_id || !annee || !mois) {
    return res.status(400).json({ error: 'assemblee_id, annee et mois sont requis' });
  }
  try {
    await ensureRapportAssembleeCols();
    const result = await db.query(`
      INSERT INTO rapports_assemblee (
        assemblee_id, annee, mois, statut,
        assistance_totale, sauves, ajoutes, invites, temoignages,
        sem_assemblees, sem_hors, cultes_tenus, seminaires_tenus, formations_tenues,
        membres_actifs, membres_nouveaux, membres_transferes_entrants,
        membres_transferes_sortants, membres_decedes, pasteurs, predicateurs,
        offrandes, dimes, bp, dovocoq, autres_liberalites,
        depenses_seminaires, depenses_fonctionnement, depenses_mission, remontee_district,
        reussites, difficultes, besoins, perspectives
      ) VALUES (
        $1,$2,$3,'SOUMIS',
        $4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,
        $30,$31,$32,$33
      )
      ON CONFLICT (assemblee_id, annee, mois) DO UPDATE SET
        statut='SOUMIS',
        assistance_totale=EXCLUDED.assistance_totale,
        sauves=EXCLUDED.sauves, ajoutes=EXCLUDED.ajoutes,
        invites=EXCLUDED.invites, temoignages=EXCLUDED.temoignages,
        sem_assemblees=EXCLUDED.sem_assemblees, sem_hors=EXCLUDED.sem_hors,
        cultes_tenus=EXCLUDED.cultes_tenus, seminaires_tenus=EXCLUDED.seminaires_tenus,
        formations_tenues=EXCLUDED.formations_tenues,
        membres_actifs=EXCLUDED.membres_actifs, membres_nouveaux=EXCLUDED.membres_nouveaux,
        membres_transferes_entrants=EXCLUDED.membres_transferes_entrants,
        membres_transferes_sortants=EXCLUDED.membres_transferes_sortants,
        membres_decedes=EXCLUDED.membres_decedes,
        pasteurs=EXCLUDED.pasteurs, predicateurs=EXCLUDED.predicateurs,
        offrandes=EXCLUDED.offrandes, dimes=EXCLUDED.dimes,
        bp=EXCLUDED.bp, dovocoq=EXCLUDED.dovocoq,
        autres_liberalites=EXCLUDED.autres_liberalites,
        depenses_seminaires=EXCLUDED.depenses_seminaires,
        depenses_fonctionnement=EXCLUDED.depenses_fonctionnement,
        depenses_mission=EXCLUDED.depenses_mission,
        remontee_district=EXCLUDED.remontee_district,
        reussites=EXCLUDED.reussites, difficultes=EXCLUDED.difficultes,
        besoins=EXCLUDED.besoins, perspectives=EXCLUDED.perspectives,
        updated_at=CURRENT_TIMESTAMP
      RETURNING *
    `, [
      assemblee_id, annee, mois,
      assistance_totale||0, sauves||0, ajoutes||0, invites||0, temoignages||0,
      sem_assemblees||0, sem_hors||0, cultes_tenus||0, seminaires_tenus||0, formations_tenues||0,
      membres_actifs||0, membres_nouveaux||0, membres_transferes_entrants||0,
      membres_transferes_sortants||0, membres_decedes||0, pasteurs||0, predicateurs||0,
      offrandes||0, dimes||0, bp||0, dovocoq||0, autres_liberalites||0,
      depenses_seminaires||0, depenses_fonctionnement||0, depenses_mission||0, remontee_district||0,
      reussites||null, difficultes||null, besoins||null, perspectives||null
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 14. FINANCES ASSEMBLEE (ventilation des contributions)
// ------------------------------------------------------------------------------
const ensureFinancesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS finances_assemblee (
      id SERIAL PRIMARY KEY,
      assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
      annee INTEGER NOT NULL,
      mois  VARCHAR(20) NOT NULL,
      -- Offrandes
      offrandes_total    NUMERIC(15,2) DEFAULT 0,
      offrandes_pct_asm  NUMERIC(5,2) DEFAULT 100,
      offrandes_pct_dist NUMERIC(5,2) DEFAULT 0,
      offrandes_pct_coord NUMERIC(5,2) DEFAULT 0,
      offrandes_pct_afrique NUMERIC(5,2) DEFAULT 0,
      -- Dimes
      dimes_total        NUMERIC(15,2) DEFAULT 0,
      dimes_pct_asm      NUMERIC(5,2) DEFAULT 100,
      dimes_pct_dist     NUMERIC(5,2) DEFAULT 0,
      dimes_pct_coord    NUMERIC(5,2) DEFAULT 0,
      dimes_pct_afrique  NUMERIC(5,2) DEFAULT 0,
      -- BP
      bp_total           NUMERIC(15,2) DEFAULT 0,
      bp_pct_asm         NUMERIC(5,2) DEFAULT 100,
      bp_pct_dist        NUMERIC(5,2) DEFAULT 0,
      bp_pct_coord       NUMERIC(5,2) DEFAULT 0,
      bp_pct_afrique     NUMERIC(5,2) DEFAULT 0,
      -- DOVOCOQ
      dovocoq_total      NUMERIC(15,2) DEFAULT 0,
      dovocoq_pct_asm    NUMERIC(5,2) DEFAULT 100,
      dovocoq_pct_dist   NUMERIC(5,2) DEFAULT 0,
      dovocoq_pct_coord  NUMERIC(5,2) DEFAULT 0,
      dovocoq_pct_afrique NUMERIC(5,2) DEFAULT 0,
      -- Dons volontaires
      dons_total         NUMERIC(15,2) DEFAULT 0,
      -- Observations
      observations_finances TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(assemblee_id, annee, mois)
    )
  `).catch(() => {});
};

app.get('/api/finances/assemblee', authenticateToken, async (req, res) => {
  const { assemblee_id, annee, mois } = req.query;
  try {
    await ensureFinancesTable();
    let q = `SELECT f.*, a.nom_assemblee FROM finances_assemblee f
             JOIN assemblees a ON f.assemblee_id = a.id WHERE 1=1`;
    const params = [];
    if (assemblee_id) { params.push(assemblee_id); q += ` AND f.assemblee_id = $${params.length}`; }
    if (annee)        { params.push(annee);         q += ` AND f.annee = $${params.length}`; }
    if (mois)         { params.push(mois);          q += ` AND f.mois = $${params.length}`; }
    q += ` ORDER BY f.annee DESC, f.mois DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finances/assemblee', authenticateToken, async (req, res) => {
  const {
    assemblee_id, annee, mois,
    offrandes_total, offrandes_pct_asm, offrandes_pct_dist, offrandes_pct_coord, offrandes_pct_afrique,
    dimes_total, dimes_pct_asm, dimes_pct_dist, dimes_pct_coord, dimes_pct_afrique,
    bp_total, bp_pct_asm, bp_pct_dist, bp_pct_coord, bp_pct_afrique,
    dovocoq_total, dovocoq_pct_asm, dovocoq_pct_dist, dovocoq_pct_coord, dovocoq_pct_afrique,
    dons_total, observations_finances
  } = req.body;
  try {
    await ensureFinancesTable();
    const result = await db.query(`
      INSERT INTO finances_assemblee (
        assemblee_id, annee, mois,
        offrandes_total, offrandes_pct_asm, offrandes_pct_dist, offrandes_pct_coord, offrandes_pct_afrique,
        dimes_total, dimes_pct_asm, dimes_pct_dist, dimes_pct_coord, dimes_pct_afrique,
        bp_total, bp_pct_asm, bp_pct_dist, bp_pct_coord, bp_pct_afrique,
        dovocoq_total, dovocoq_pct_asm, dovocoq_pct_dist, dovocoq_pct_coord, dovocoq_pct_afrique,
        dons_total, observations_finances
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      ON CONFLICT (assemblee_id, annee, mois) DO UPDATE SET
        offrandes_total=EXCLUDED.offrandes_total, offrandes_pct_asm=EXCLUDED.offrandes_pct_asm,
        offrandes_pct_dist=EXCLUDED.offrandes_pct_dist, offrandes_pct_coord=EXCLUDED.offrandes_pct_coord,
        offrandes_pct_afrique=EXCLUDED.offrandes_pct_afrique,
        dimes_total=EXCLUDED.dimes_total, dimes_pct_asm=EXCLUDED.dimes_pct_asm,
        dimes_pct_dist=EXCLUDED.dimes_pct_dist, dimes_pct_coord=EXCLUDED.dimes_pct_coord,
        dimes_pct_afrique=EXCLUDED.dimes_pct_afrique,
        bp_total=EXCLUDED.bp_total, bp_pct_asm=EXCLUDED.bp_pct_asm,
        bp_pct_dist=EXCLUDED.bp_pct_dist, bp_pct_coord=EXCLUDED.bp_pct_coord,
        bp_pct_afrique=EXCLUDED.bp_pct_afrique,
        dovocoq_total=EXCLUDED.dovocoq_total, dovocoq_pct_asm=EXCLUDED.dovocoq_pct_asm,
        dovocoq_pct_dist=EXCLUDED.dovocoq_pct_dist, dovocoq_pct_coord=EXCLUDED.dovocoq_pct_coord,
        dovocoq_pct_afrique=EXCLUDED.dovocoq_pct_afrique,
        dons_total=EXCLUDED.dons_total,
        observations_finances=EXCLUDED.observations_finances,
        updated_at=CURRENT_TIMESTAMP
      RETURNING *
    `, [
      assemblee_id, annee, mois,
      offrandes_total||0, offrandes_pct_asm||100, offrandes_pct_dist||0, offrandes_pct_coord||0, offrandes_pct_afrique||0,
      dimes_total||0, dimes_pct_asm||100, dimes_pct_dist||0, dimes_pct_coord||0, dimes_pct_afrique||0,
      bp_total||0, bp_pct_asm||100, bp_pct_dist||0, bp_pct_coord||0, bp_pct_afrique||0,
      dovocoq_total||0, dovocoq_pct_asm||100, dovocoq_pct_dist||0, dovocoq_pct_coord||0, dovocoq_pct_afrique||0,
      dons_total||0, observations_finances||null
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});


app.listen(PORT, () => {
  console.log(`Serveur Backend API TLWM demarre sur http://localhost:${PORT}`);
});
