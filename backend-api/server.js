require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares globaux ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
const activitesRouter = require('./routes/activites');

app.use('/api/auth',                   require('./routes/auth'));
app.use('/api/admin/utilisateurs',     require('./routes/utilisateurs'));
app.use('/api/referentiel/pays',       require('./routes/pays'));
app.use('/api/referentiel/districts',  require('./routes/districts'));
app.use('/api/referentiel/assemblees', require('./routes/assemblees'));
app.use('/api/comite',                 require('./routes/comite'));
app.use('/api/rapports',               require('./routes/rapports'));
app.use('/api/membres',                require('./routes/membres'));
app.use('/api/activites',              activitesRouter);
app.use('/api/dashboard',              require('./routes/dashboard'));
app.use('/api/finances',               require('./routes/finances'));

// ── Legacy aliases (conserves pour compatibilite frontend) ───────────────────
// /api/referentiel/pays-stats → /api/referentiel/pays/stats
const paysRouter = require('./routes/pays');
app.get('/api/referentiel/pays-stats',      (req, res, next) => { req.url = '/stats'; paysRouter(req, res, next); });
app.get('/api/referentiel/pays/:id/stats',  (req, res, next) => { req.url = `/${req.params.id}/stats`; paysRouter(req, res, next); });

// /api/activites-district → GET /district, POST /district dans activitesRouter
app.get('/api/activites-district',  (req, res, next) => { req.url = '/district';  activitesRouter(req, res, next); });
app.post('/api/activites-district', (req, res, next) => { req.url = '/district';  activitesRouter(req, res, next); });
app.get('/api/activites-national',  (req, res, next) => { req.url = '/national';  activitesRouter(req, res, next); });
app.post('/api/activites-national', (req, res, next) => { req.url = '/national';  activitesRouter(req, res, next); });

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── Demarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Serveur Backend API TLWM demarre sur http://localhost:${PORT}`);
});