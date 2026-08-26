const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const RAPPORT_EXTRA_COLS = [
  'assistance_totale INTEGER DEFAULT 0','cultes_tenus INTEGER DEFAULT 0',
  'seminaires_tenus INTEGER DEFAULT 0','formations_tenues INTEGER DEFAULT 0',
  'membres_nouveaux INTEGER DEFAULT 0','membres_transferes_entrants INTEGER DEFAULT 0',
  'membres_transferes_sortants INTEGER DEFAULT 0','membres_decedes INTEGER DEFAULT 0',
  'bp NUMERIC(15,2) DEFAULT 0','dovocoq NUMERIC(15,2) DEFAULT 0',
  'autres_liberalites NUMERIC(15,2) DEFAULT 0','depenses_seminaires NUMERIC(15,2) DEFAULT 0',
  'remontee_district NUMERIC(15,2) DEFAULT 0',
  'reussites TEXT','difficultes TEXT','besoins TEXT','perspectives TEXT'
];

const ensureRapportCols = async () => {
  for (const col of RAPPORT_EXTRA_COLS) {
    await db.query(`ALTER TABLE rapports_assemblee ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
  }
};

// GET rapport simple
router.get('/assemblee', async (req, res) => {
  const { assemblee_id, annee, mois } = req.query;
  try {
    let q = `SELECT r.*, a.nom_assemblee, d.nom_district FROM rapports_assemblee r
             JOIN assemblees a ON r.assemblee_id=a.id JOIN districts d ON a.district_id=d.id WHERE 1=1`;
    const params = [];
    if (assemblee_id) { params.push(assemblee_id); q += ` AND r.assemblee_id=$${params.length}`; }
    if (annee)        { params.push(annee);         q += ` AND r.annee=$${params.length}`; }
    if (mois)         { params.push(mois);          q += ` AND r.mois=$${params.length}`; }
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST rapport simple
router.post('/assemblee', async (req, res) => {
  const {
    assemblee_id, annee, mois,
    sem_assemblees, sem_hors, assistance_cultes, assistance_mission,
    sauves, ajoutes, invites, temoignages,
    membres_actifs, predicateurs, pasteurs,
    offrandes, dimes, depenses_fonctionnement, depenses_mission
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO rapports_assemblee (assemblee_id, annee, mois, sem_assemblees, sem_hors,
       assistance_cultes, assistance_mission, sauves, ajoutes, invites, temoignages,
       membres_actifs, predicateurs, pasteurs, offrandes, dimes,
       depenses_fonctionnement, depenses_mission, statut)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'SOUMIS')
       ON CONFLICT (assemblee_id, annee, mois) DO UPDATE SET
         sem_assemblees=EXCLUDED.sem_assemblees, sem_hors=EXCLUDED.sem_hors,
         assistance_cultes=EXCLUDED.assistance_cultes, assistance_mission=EXCLUDED.assistance_mission,
         sauves=EXCLUDED.sauves, ajoutes=EXCLUDED.ajoutes, invites=EXCLUDED.invites,
         temoignages=EXCLUDED.temoignages, membres_actifs=EXCLUDED.membres_actifs,
         predicateurs=EXCLUDED.predicateurs, pasteurs=EXCLUDED.pasteurs,
         offrandes=EXCLUDED.offrandes, dimes=EXCLUDED.dimes,
         depenses_fonctionnement=EXCLUDED.depenses_fonctionnement,
         depenses_mission=EXCLUDED.depenses_mission, updated_at=CURRENT_TIMESTAMP
       RETURNING *`,
      [assemblee_id, annee, mois, sem_assemblees||0, sem_hors||0,
       assistance_cultes||0, assistance_mission||0, sauves||0, ajoutes||0, invites||0, temoignages||0,
       membres_actifs||0, predicateurs||0, pasteurs||0,
       offrandes||0, dimes||0, depenses_fonctionnement||0, depenses_mission||0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET historique
router.get('/assemblee/historique', authenticateToken, async (req, res) => {
  const { assemblee_id, district_id, pays_id } = req.query;
  try {
    let q = `SELECT r.*, a.nom_assemblee, d.nom_district, p.nom_pays
             FROM rapports_assemblee r
             JOIN assemblees a ON r.assemblee_id=a.id
             JOIN districts d ON a.district_id=d.id
             JOIN pays p ON d.pays_id=p.id WHERE 1=1`;
    const params = [];
    if (assemblee_id) { params.push(assemblee_id); q += ` AND r.assemblee_id=$${params.length}`; }
    if (district_id)  { params.push(district_id);  q += ` AND a.district_id=$${params.length}`; }
    if (pays_id)      { params.push(pays_id);       q += ` AND d.pays_id=$${params.length}`; }
    q += ` ORDER BY r.annee DESC, array_position(ARRAY['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'], r.mois) DESC`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST rapport complet etendu
router.post('/assemblee/complet', authenticateToken, async (req, res) => {
  const {
    assemblee_id, annee, mois,
    assistance_totale, sauves, ajoutes, invites, temoignages,
    sem_assemblees, sem_hors, cultes_tenus, seminaires_tenus, formations_tenues,
    membres_actifs, membres_nouveaux, membres_transferes_entrants,
    membres_transferes_sortants, membres_decedes, pasteurs, predicateurs,
    offrandes, dimes, bp, dovocoq, autres_liberalites,
    depenses_seminaires, depenses_fonctionnement, depenses_mission, remontee_district,
    reussites, difficultes, besoins, perspectives
  } = req.body;
  if (!assemblee_id || !annee || !mois) return res.status(400).json({ error: 'assemblee_id, annee et mois requis' });
  try {
    await ensureRapportCols();
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
      ) VALUES ($1,$2,$3,'SOUMIS',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)
      ON CONFLICT (assemblee_id, annee, mois) DO UPDATE SET
        statut='SOUMIS', assistance_totale=EXCLUDED.assistance_totale,
        sauves=EXCLUDED.sauves, ajoutes=EXCLUDED.ajoutes, invites=EXCLUDED.invites, temoignages=EXCLUDED.temoignages,
        sem_assemblees=EXCLUDED.sem_assemblees, sem_hors=EXCLUDED.sem_hors,
        cultes_tenus=EXCLUDED.cultes_tenus, seminaires_tenus=EXCLUDED.seminaires_tenus,
        formations_tenues=EXCLUDED.formations_tenues,
        membres_actifs=EXCLUDED.membres_actifs, membres_nouveaux=EXCLUDED.membres_nouveaux,
        membres_transferes_entrants=EXCLUDED.membres_transferes_entrants,
        membres_transferes_sortants=EXCLUDED.membres_transferes_sortants,
        membres_decedes=EXCLUDED.membres_decedes, pasteurs=EXCLUDED.pasteurs, predicateurs=EXCLUDED.predicateurs,
        offrandes=EXCLUDED.offrandes, dimes=EXCLUDED.dimes, bp=EXCLUDED.bp, dovocoq=EXCLUDED.dovocoq,
        autres_liberalites=EXCLUDED.autres_liberalites, depenses_seminaires=EXCLUDED.depenses_seminaires,
        depenses_fonctionnement=EXCLUDED.depenses_fonctionnement, depenses_mission=EXCLUDED.depenses_mission,
        remontee_district=EXCLUDED.remontee_district,
        reussites=EXCLUDED.reussites, difficultes=EXCLUDED.difficultes,
        besoins=EXCLUDED.besoins, perspectives=EXCLUDED.perspectives,
        updated_at=CURRENT_TIMESTAMP
      RETURNING *`,
      [assemblee_id, annee, mois,
       assistance_totale||0, sauves||0, ajoutes||0, invites||0, temoignages||0,
       sem_assemblees||0, sem_hors||0, cultes_tenus||0, seminaires_tenus||0, formations_tenues||0,
       membres_actifs||0, membres_nouveaux||0, membres_transferes_entrants||0,
       membres_transferes_sortants||0, membres_decedes||0, pasteurs||0, predicateurs||0,
       offrandes||0, dimes||0, bp||0, dovocoq||0, autres_liberalites||0,
       depenses_seminaires||0, depenses_fonctionnement||0, depenses_mission||0, remontee_district||0,
       reussites||null, difficultes||null, besoins||null, perspectives||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;