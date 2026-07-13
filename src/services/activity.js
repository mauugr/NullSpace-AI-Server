import { query } from '../database/pool.js';
export async function logActivity({userId=null,action,entityType=null,entityId=null,ip=null,metadata={}}){
  try { await query(`insert into activity_logs(user_id,action,entity_type,entity_id,ip_address,metadata) values($1,$2,$3,$4,$5,$6)`,[userId,action,entityType,entityId,ip,metadata]); }
  catch(e){ console.error('activity log failed',e.message); }
}
