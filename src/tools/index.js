import { query } from '../database/pool.js';
const registry={
  getDate:{critical:false,run:async()=>({date:new Date().toISOString().slice(0,10)})},
  getTime:{critical:false,run:async()=>({time:new Date().toISOString()})},
  deviceStatus:{critical:false,run:async({userId,deviceId})=>{const r=await query('select id,name,type,os,status,last_seen_at from devices where user_id=$1 and id=$2',[userId,deviceId]);return r.rows[0]||{available:false};}},
  searchMemory:{critical:false,run:async({userId,search=''})=>{const r=await query(`select id,category,key,value,importance,updated_at from memories where user_id=$1 and (key ilike $2 or value::text ilike $2) order by importance desc,updated_at desc limit 20`,[userId,`%${search}%`]);return r.rows;}},
  createNote:{critical:false,run:async({userId,title,content,tags=[],priority='normal'})=>{const r=await query(`insert into notes(user_id,title,content,tags,priority) values($1,$2,$3,$4,$5) returning *`,[userId,title,content,tags,priority]);return r.rows[0];}},
  createTask:{critical:false,run:async({userId,title,description='',dueAt=null,priority='normal'})=>{const r=await query(`insert into tasks(user_id,title,description,due_at,priority,status) values($1,$2,$3,$4,$5,'pending') returning *`,[userId,title,description,dueAt,priority]);return r.rows[0];}}
};
export async function executeTool(name,args,context){
  const tool=registry[name]; if(!tool) throw Object.assign(new Error('Tool is not allowed'),{status:403});
  if(tool.critical && !context.confirmed) throw Object.assign(new Error('Explicit confirmation required'),{status:409});
  return tool.run({...args,...context});
}
export const allowedTools=Object.keys(registry);
