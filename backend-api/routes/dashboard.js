const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/stats', async (req, res) => {
  const targetYear = req.query.annee || 2026;
  try {
    const result = await db.query(`
      SELECT r.mois,
        SUM(r.sem_total) as sem_total, SUM(r.sem_assemblees) as sem_assemblees,
        SUM(r.sem_hors) as sem_hors,
        SUM(r.assistance_cultes + r.assistance_mission) as assistance,
        SUM(r.sauves) as sauves, SUM(r.ajoutes) as ajoutes,
        SUM(r.predicateurs) as predicateurs, SUM(r.pasteurs) as pasteurs,
        SUM(r.membres_actifs) as membres
      FROM rapports_assemblee r WHERE r.annee=$1 GROUP BY r.mois`, [targetYear]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;