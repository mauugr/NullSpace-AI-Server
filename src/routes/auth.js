import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../database/pool.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { signUserToken, createDeviceToken } from '../services/tokens.js';
import { logActivity } from '../services/activity.js';
const router=Router();
const device=z.object({deviceId:z.string().uuid().optional(),deviceName:z.string().min(1).max(100).default('Web device'),deviceType:z.string().max(40).default('browser'),os:z.string().max(80).default('unknown')});
router.post('/register',validate(z.object({name:z.string().min(2).max(100),email:z.string().email(),password:z.string().min(10).max(128)}).merge(device)),async(req,res)=>{
  const {name,email,password,deviceName,deviceType,os}=req.body;
  const exists=await query('select 1 from users where lower(email)=lower($1)',[email]); if(exists.rowCount) return res.status(409).json({success:false,error:'Email already registered'});
  const hash=await bcrypt.hash(password,12); const u=await query(`insert into users(name,email,password_hash) values($1,lower($2),$3) returning id,name,email,role`,[name,email,hash]);
  const dt=createDeviceToken(); const d=await query(`insert into devices(user_id,name,type,os,status,device_token,last_seen_at,ip_address) values($1,$2,$3,$4,'online',$5,now(),$6) returning id`,[u.rows[0].id,deviceName,deviceType,os,dt,req.ip]);
  const token=signUserToken(u.rows[0],d.rows[0].id); await logActivity({userId:u.rows[0].id,action:'auth.register',ip:req.ip});
  res.status(201).json({success:true,token,user:u.rows[0],deviceId:d.rows[0].id,deviceToken:dt});
});
router.post('/login',validate(z.object({email:z.string().email(),password:z.string().min(1),deviceName:z.string().max(100).default('Web device'),deviceType:z.string().max(40).default('browser'),os:z.string().max(80).default('unknown')})),async(req,res)=>{
  const u=await query('select * from users where lower(email)=lower($1)',[req.body.email]); const user=u.rows[0];
  if(!user || !await bcrypt.compare(req.body.password,user.password_hash)) return res.status(401).json({success:false,error:'Invalid credentials'});
  const dt=createDeviceToken(); const d=await query(`insert into devices(user_id,name,type,os,status,device_token,last_seen_at,ip_address) values($1,$2,$3,$4,'online',$5,now(),$6) returning id`,[user.id,req.body.deviceName,req.body.deviceType,req.body.os,dt,req.ip]);
  const safe={id:user.id,name:user.name,email:user.email,role:user.role}; const token=signUserToken(safe,d.rows[0].id); await logActivity({userId:user.id,action:'auth.login',ip:req.ip});
  res.json({success:true,token,user:safe,deviceId:d.rows[0].id,deviceToken:dt});
});
router.get('/me',requireAuth,(req,res)=>res.json({success:true,user:req.user,deviceId:req.tokenPayload.deviceId}));
router.post('/logout',requireAuth,async(req,res)=>{if(req.tokenPayload.deviceId) await query(`update devices set status='offline',last_seen_at=now() where id=$1 and user_id=$2`,[req.tokenPayload.deviceId,req.user.id]); await logActivity({userId:req.user.id,action:'auth.logout',ip:req.ip}); res.json({success:true});});
export default router;
