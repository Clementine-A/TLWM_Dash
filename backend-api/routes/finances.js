const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const ensureFinancesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS finances_assemblee (
      id SERIAL PRIMARY KEY,
      assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
      annee INTEGER NOT NULL, mois VARCHAR(20) NOT NULL,
      offrandes_total NUMERIC(15,2) DEFAULT 0, offrandes_pct_asm NUMERIC(5,2) DEFAULT 100,
      offrandes_pct_dist NUMERIC(5,2) DEFAULT 0, offrandes_pct_coord NUMERIC(5,2) DEFAULT 0,
      offrandes_pct_afrique NUMERIC(5,2) DEFAULT 0,
      dimes_total NUMERIC(15,2) DEFAULT 0, dimes_pct_asm NUMERIC(5,2) DEFAULT 100,
      dimes_pct_dist NUMERIC(5,2) DEFAULT 0, dimes_pct_coord NUMERIC(5,2) DEFAULT 0,
      dimes_pct_afrique NUMERIC(5,2) DEFAULT 0,
      bp_total NUMERIC(15,2) DEFAULT 0, bp_pct_asm NUMERIC(5,2) DEFAULT 100,
      bp_pct_dist NUMERIC(5,2) DEFAULT 0, bp_pct_coord NUMERIC(5,2) DEFAULT 0,
      bp_pct_afrique NUMERIC(5,2) DEFAULT 0,
      dovocoq_total NUMERIC(15,2) DEFAULT 0, dovocoq_pct_asm NUMERIC(5,2) DEFAULT 100,
      dovocoq_pct_dist NUMERIC(5,2) DEFAULT 0, dovocoq_pct_coord NUMERIC(5,2) DEFAULT 0,
      dovocoq_pct_afrique NUMERIC(5,2) DEFAULT 0,
      dons_total NUMERIC(15,2) DEFAULT 0, observations_finances TEXT,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(assemblee_id, annee, mois)
    )`).catch(() => {});
};

router.get('/assemblee', authenticateToken, async (req, res) => {
  const { assemblee_id, annee, mois } = req.query;
  try {
    await ensureFinancesTable();
    let q = `SELECT f.*, a.nom_assemblee FROM finances_assemblee f JOIN assemblees a ON f.assemblee_id=a.id WHERE 1=1`;
    const params = [];
    if (assemblee_id) { params.push(assemblee_id); q += ` AND f.assemblee_id=$${params.length}`; }
    if (annee)        { params.push(annee);         q += ` AND f.annee=$${params.length}`; }
    if (mois)         { params.push(mois);          q += ` AND f.mois=$${params.length}`; }
    q += ` ORDER BY f.annee DESC, f.mois DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/assemblee', authenticateToken, async (req, res) => {
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
        bp_pct_dist=EXCLUDED.bp_pct_dist, bp_pct_coord=EXCLUDED.bp_pct_coord, bp_pct_afrique=EXCLUDED.bp_pct_afrique,
        dovocoq_total=EXCLUDED.dovocoq_total, dovocoq_pct_asm=EXCLUDED.dovocoq_pct_asm,
        dovocoq_pct_dist=EXCLUDED.dovocoq_pct_dist, dovocoq_pct_coord=EXCLUDED.dovocoq_pct_coord,
        dovocoq_pct_afrique=EXCLUDED.dovocoq_pct_afrique,
        dons_total=EXCLUDED.dons_total, observations_finances=EXCLUDED.observations_finances,
        updated_at=CURRENT_TIMESTAMP
      RETURNING *`,
      [assemblee_id, annee, mois,
       offrandes_total||0, offrandes_pct_asm||100, offrandes_pct_dist||0, offrandes_pct_coord||0, offrandes_pct_afrique||0,
       dimes_total||0, dimes_pct_asm||100, dimes_pct_dist||0, dimes_pct_coord||0, dimes_pct_afrique||0,
       bp_total||0, bp_pct_asm||100, bp_pct_dist||0, bp_pct_coord||0, bp_pct_afrique||0,
       dovocoq_total||0, dovocoq_pct_asm||100, dovocoq_pct_dist||0, dovocoq_pct_coord||0, dovocoq_pct_afrique||0,
       dons_total||0, observations_finances||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;