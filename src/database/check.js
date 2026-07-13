import { query, pool } from './pool.js';
try { const r=await query('select now() as now'); console.log('Database OK:', r.rows[0].now); }
finally { await pool.end(); }
