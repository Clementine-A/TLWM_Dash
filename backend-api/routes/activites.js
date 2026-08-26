const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Table unifiee
const ensureActivitesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS activites (
      id SERIAL PRIMARY KEY,
      niveau VARCHAR(20) NOT NULL DEFAULT 'assemblee',
      assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
      district_id  INTEGER REFERENCES districts(id)  ON DELETE CASCADE,
      pays_id      INTEGER REFERENCES pays(id)        ON DELETE CASCADE,
      annee INTEGER NOT NULL, mois VARCHAR(20) NOT NULL,
      date_activite DATE, type_activite VARCHAR(100),
      nom_activite VARCHAR(255) NOT NULL,
      departement_concerne VARCHAR(150), lieu VARCHAR(255),
      nb_jours INTEGER DEFAULT 1,
      pasteur_responsable VARCHAR(255), intervenant_principal VARCHAR(255),
      theme_module TEXT,
      ass_femmes INTEGER DEFAULT 0, ass_hommes INTEGER DEFAULT 0,
      ass_jeunes INTEGER DEFAULT 0, assistance_totale INTEGER DEFAULT 0,
      budget_fcfa NUMERIC(15,2) DEFAULT 0, depenses_fcfa NUMERIC(15,2) DEFAULT 0,
      observations TEXT, created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
};

// Activites unifiees
router.get('/', authenticateToken, async (req, res) => {
  const { niveau, assemblee_id, district_id, pays_id, annee, mois } = req.query;
  try {
    await ensureActivitesTable();
    let q = `SELECT a.*, asm.nom_assemblee, d.nom_district, p.nom_pays
             FROM activites a
             LEFT JOIN assemblees asm ON a.assemblee_id=asm.id
             LEFT JOIN districts d ON a.district_id=d.id
             LEFT JOIN pays p ON a.pays_id=p.id WHERE 1=1`;
    const params = [];
    if (niveau)       { params.push(niveau);       q += ` AND a.niveau=$${params.length}`; }
    if (assemblee_id) { params.push(assemblee_id); q += ` AND a.assemblee_id=$${params.length}`; }
    if (district_id)  { params.push(district_id);  q += ` AND a.district_id=$${params.length}`; }
    if (pays_id)      { params.push(pays_id);       q += ` AND a.pays_id=$${params.length}`; }
    if (annee)        { params.push(annee);         q += ` AND a.annee=$${params.length}`; }
    if (mois)         { params.push(mois);          q += ` AND a.mois=$${params.length}`; }
    q += ` ORDER BY a.date_activite DESC NULLS LAST, a.created_at DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  const {
    niveau, assemblee_id, district_id, pays_id, annee, mois,
    date_activite, type_activite, nom_activite, departement_concerne,
    lieu, nb_jours, pasteur_responsable, intervenant_principal, theme_module,
    ass_femmes, ass_hommes, ass_jeunes, assistance_totale,
    budget_fcfa, depenses_fcfa, observations
  } = req.body;
  if (!nom_activite) return res.status(400).json({ error: 'nom_activite requis' });
  try {
    await ensureActivitesTable();
    const result = await db.query(
      `INSERT INTO activites (niveau, assemblee_id, district_id, pays_id, annee, mois,
       date_activite, type_activite, nom_activite, departement_concerne,
       lieu, nb_jours, pasteur_responsable, intervenant_principal, theme_module,
       ass_femmes, ass_hommes, ass_jeunes, assistance_totale,
       budget_fcfa, depenses_fcfa, observations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [niveau||'assemblee', assemblee_id||null, district_id||null, pays_id||null, annee, mois,
       date_activite||null, type_activite||null, nom_activite,
       departement_concerne||null, lieu||null, nb_jours||1,
       pasteur_responsable||null, intervenant_principal||null, theme_module||null,
       ass_femmes||0, ass_hommes||0, ass_jeunes||0, assistance_totale||0,
       budget_fcfa||0, depenses_fcfa||0, observations||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const {
    type_activite, nom_activite, departement_concerne, lieu, nb_jours,
    pasteur_responsable, intervenant_principal, theme_module, date_activite,
    ass_femmes, ass_hommes, ass_jeunes, assistance_totale,
    budget_fcfa, depenses_fcfa, observations
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE activites SET type_activite=$1, nom_activite=$2, departement_concerne=$3, lieu=$4, nb_jours=$5,
       pasteur_responsable=$6, intervenant_principal=$7, theme_module=$8, date_activite=$9,
       ass_femmes=$10, ass_hommes=$11, ass_jeunes=$12, assistance_totale=$13,
       budget_fcfa=$14, depenses_fcfa=$15, observations=$16
       WHERE id=$17 RETURNING *`,
      [type_activite||null, nom_activite, departement_concerne||null, lieu||null, nb_jours||1,
       pasteur_responsable||null, intervenant_principal||null, theme_module||null, date_activite||null,
       ass_femmes||0, ass_hommes||0, ass_jeunes||0, assistance_totale||0,
       budget_fcfa||0, depenses_fcfa||0, observations||null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Activite non trouvee' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM activites WHERE id=$1', [req.params.id]);
    res.json({ message: 'Activite supprimee' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Activites District
router.get('/district', async (req, res) => {
  const { district_id, annee, mois } = req.query;
  try {
    let q = `SELECT * FROM activites_district WHERE 1=1`;
    const params = [];
    if (district_id) { params.push(district_id); q += ` AND district_id=$${params.length}`; }
    if (annee)       { params.push(annee);        q += ` AND annee=$${params.length}`; }
    if (mois)        { params.push(mois);         q += ` AND mois=$${params.length}`; }
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/district', async (req, res) => {
  const { district_id, annee, mois, date_activite, type_activite, nom_activite,
    lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
    assistance_totale, observations } = req.body;
  try {
    await db.query(`ALTER TABLE activites_district ADD COLUMN IF NOT EXISTS plus_jeunes INTEGER DEFAULT 0`).catch(() => {});
    const result = await db.query(
      `INSERT INTO activites_district (district_id, annee, mois, date_activite, type_activite, nom_activite,
       lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
       assistance_totale, observations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [district_id, annee, mois, date_activite||null, type_activite, nom_activite,
       lieu, nb_jours||1, intervenant_principal, theme_module,
       hommes||0, femmes||0, jeunes||0, plus_jeunes||0, assistance_totale||0, observations]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Activites National
router.get('/national', async (req, res) => {
  const { pays_id, annee, mois } = req.query;
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS activites_national (
      id SERIAL PRIMARY KEY, pays_id INTEGER REFERENCES pays(id) ON DELETE CASCADE,
      annee INTEGER NOT NULL, mois VARCHAR(20) NOT NULL, date_activite DATE,
      type_activite VARCHAR(100), nom_activite VARCHAR(255) NOT NULL, lieu VARCHAR(255),
      nb_jours INTEGER DEFAULT 1, intervenant_principal VARCHAR(255), theme_module TEXT,
      hommes INTEGER DEFAULT 0, femmes INTEGER DEFAULT 0, jeunes INTEGER DEFAULT 0,
      plus_jeunes INTEGER DEFAULT 0, assistance_totale INTEGER DEFAULT 0,
      observations TEXT, created_at TIMESTAMP DEFAULT NOW())`).catch(() => {});
    let q = `SELECT * FROM activites_national WHERE 1=1`;
    const params = [];
    if (pays_id) { params.push(pays_id); q += ` AND pays_id=$${params.length}`; }
    if (annee)   { params.push(annee);   q += ` AND annee=$${params.length}`; }
    if (mois)    { params.push(mois);    q += ` AND mois=$${params.length}`; }
    q += ` ORDER BY date_activite DESC, created_at DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/national', async (req, res) => {
  const { pays_id, annee, mois, date_activite, type_activite, nom_activite,
    lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
    assistance_totale, observations } = req.body;
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS activites_national (
      id SERIAL PRIMARY KEY, pays_id INTEGER REFERENCES pays(id) ON DELETE CASCADE,
      annee INTEGER NOT NULL, mois VARCHAR(20) NOT NULL, date_activite DATE,
      type_activite VARCHAR(100), nom_activite VARCHAR(255) NOT NULL, lieu VARCHAR(255),
      nb_jours INTEGER DEFAULT 1, intervenant_principal VARCHAR(255), theme_module TEXT,
      hommes INTEGER DEFAULT 0, femmes INTEGER DEFAULT 0, jeunes INTEGER DEFAULT 0,
      plus_jeunes INTEGER DEFAULT 0, assistance_totale INTEGER DEFAULT 0,
      observations TEXT, created_at TIMESTAMP DEFAULT NOW())`).catch(() => {});
    await db.query(`ALTER TABLE activites_national ADD COLUMN IF NOT EXISTS plus_jeunes INTEGER DEFAULT 0`).catch(() => {});
    const result = await db.query(
      `INSERT INTO activites_national (pays_id, annee, mois, date_activite, type_activite, nom_activite,
       lieu, nb_jours, intervenant_principal, theme_module, hommes, femmes, jeunes, plus_jeunes,
       assistance_totale, observations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [pays_id, annee, mois, date_activite||null, type_activite, nom_activite,
       lieu, nb_jours||1, intervenant_principal, theme_module,
       hommes||0, femmes||0, jeunes||0, plus_jeunes||0, assistance_totale||0, observations]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;