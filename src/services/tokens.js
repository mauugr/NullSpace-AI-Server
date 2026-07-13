import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
export function signUserToken(user,deviceId=null){ return jwt.sign({sub:user.id,role:user.role,deviceId,jti:crypto.randomUUID()},env.jwtSecret,{expiresIn:env.jwtExpiresIn,issuer:'nullspace-ai-server',audience:'nullspace-clients'}); }
export function createDeviceToken(){ return crypto.randomBytes(32).toString('hex'); }
