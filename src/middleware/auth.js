import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';

export async function requireAuth(req,res,next){
  try {
    const header=req.get('authorization') || '';
    const token=header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.ns_token;
    if(!token) return res.status(401).json({success:false,error:'Authentication required'});
    const payload=jwt.verify(token, env.jwtSecret);
    const user=await query('select id,email,name,role,is_active from users where id=$1',[payload.sub]);
    if(!user.rows[0]?.is_active) return res.status(401).json({success:false,error:'Invalid or disabled session'});
    req.user=user.rows[0];
    req.tokenPayload=payload;
    next();
  } catch(e){ return res.status(401).json({success:false,error:'Invalid or expired session'}); }
}
