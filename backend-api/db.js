const { Pool } = require('pg');
require('dotenv').config();

// Si DATABASE_URL est defini (Neon / Render / Railway), on l'utilise directement
// Sinon on utilise les variables individuelles (local)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'tlwm_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      ssl: false
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log(' Connecté à la base de données PostgreSQL');
});

pool.on('error', (err) => {
  console.error(' Erreur inattendue sur la base PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
