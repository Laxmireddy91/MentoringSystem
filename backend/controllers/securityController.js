import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import LoginActivity from "../models/LoginActivity.js";
import AuditLog from "../models/AuditLog.js";
import { sendSecurityEmail } from "../services/emailService.js";

const rawToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const otp = () => String(crypto.randomInt(100000, 1000000));
const safe = (u) => ({ id:u._id, name:u.name, email:u.email, role:u.role, department:u.department||"", phone:u.phone||"", usn:u.usn||"", designation:u.designation||"", semester:u.semester||"", active:u.active, emailVerified:u.emailVerified, twoFactorEnabled:u.twoFactorEnabled });

export async function refresh(req,res){
  try {
    const token=String(req.body?.refreshToken||"");
    if(!token) return res.status(401).json({success:false,message:"Refresh token required"});
    const decoded=jwt.verify(token,process.env.JWT_REFRESH_SECRET||process.env.JWT_SECRET);
    if(decoded.type!=="refresh" || !decoded.id) throw new Error("invalid");
    const user=await User.findById(decoded.id);
    if(!user || !user.active) return res.status(401).json({success:false,message:"Session is no longer valid"});
    const suppliedHash=hashToken(token);
    if(!user.refreshTokenHash || user.refreshTokenHash!==suppliedHash || !user.refreshTokenExpires || user.refreshTokenExpires<=new Date()) return res.status(401).json({success:false,message:"Session is no longer valid"});
    const access=jwt.sign({id:user._id.toString(),role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_ACCESS_EXPIRES||"15m"});
    const rotated=jwt.sign({id:user._id.toString(),role:user.role,type:"refresh"},process.env.JWT_REFRESH_SECRET||process.env.JWT_SECRET,{expiresIn:process.env.JWT_REFRESH_EXPIRES||"30d"});
    user.refreshTokenHash=hashToken(rotated); user.refreshTokenExpires=new Date(Date.now()+30*24*60*60*1000); await user.save();
    return res.json({success:true,token:access,refreshToken:rotated,user:safe(user)});
  } catch { return res.status(401).json({success:false,message:"Invalid or expired refresh token"}); }
}

export async function logout(req,res,next){
  try { req.user.refreshTokenHash=null; req.user.refreshTokenExpires=null; await req.user.save(); return res.json({success:true,message:"Logged out successfully"}); } catch(e){next(e)}
}

export async function hodAccountRecovery(req,res,next){
  try {
    const email=String(req.body?.email||"").trim().toLowerCase();
    const usn=String(req.body?.usn||"").trim().toUpperCase();
    if(!email && !usn) return res.status(400).json({success:false,message:"USN or email is required"});
    const user=await User.findOne(email?{email}:{usn,role:"student"});
    if(!user || user.role!=="student") return res.status(404).json({success:false,message:"Student account not found"});
    const token=rawToken();
    user.passwordResetToken=hashToken(token); user.passwordResetExpires=new Date(Date.now()+30*60*1000); await user.save();
    const maskedUsn=user.usn ? `${user.usn.slice(0,3)}${"*".repeat(Math.max(0,user.usn.length-5))}${user.usn.slice(-2)}` : "not available";
    await sendSecurityEmail({to:user.email,subject:"Smart Mentoring System account recovery",text:`Your registered USN is ${user.usn || "not available"}. A secure password reset was initiated by your HOD. Reset token: ${token}. It expires in 30 minutes.`});
    await writeAudit({actor:req.user._id,action:"ACCOUNT_RECOVERY",targetType:"User",targetId:user._id,description:"HOD initiated student account recovery",ipAddress:req.ip});
    return res.json({success:true,message:"Recovery instructions sent to the registered student email",maskedUsn,developmentToken:process.env.NODE_ENV!=="production"?token:undefined});
  } catch(e){next(e)}
}

export async function forgotPassword(req,res,next){
  try {
    const email=String(req.body?.email||"").trim().toLowerCase();
    if(!email) return res.status(400).json({success:false,message:"Email is required"});
    const user=await User.findOne({email});
    // Do not disclose account existence.
    if(!user) return res.json({success:true,message:"If the account exists, a reset link has been sent."});
    const token=rawToken();
    user.passwordResetToken=hashToken(token);
    user.passwordResetExpires=new Date(Date.now()+30*60*1000);
    await user.save();
    const url=`${process.env.CLIENT_URL||"http://localhost:5173"}/reset-password?token=${token}`;
    await sendSecurityEmail({to:user.email,subject:"Smart Mentoring System password reset",text:`Reset your password: ${url}\nThis link expires in 30 minutes.`});
    return res.json({success:true,message:"If the account exists, a reset link has been sent.",developmentToken:process.env.NODE_ENV!=="production"?token:undefined});
  } catch(e){next(e)}
}

export async function resetPassword(req,res,next){
  try {
    const token=String(req.body?.token||"");
    const password=String(req.body?.password||"");
    if(password.length<8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/.test(password)) return res.status(400).json({success:false,message:"Password must contain uppercase, lowercase, number, special character and be at least 8 characters"});
    const user=await User.findOne({passwordResetToken:hashToken(token),passwordResetExpires:{$gt:new Date()}});
    if(!user) return res.status(400).json({success:false,message:"Invalid or expired reset token"});
    user.password=await bcrypt.hash(password,12); user.passwordResetToken=null; user.passwordResetExpires=null; user.failedLoginAttempts=0; user.lockedUntil=null; user.refreshTokenHash=null; user.refreshTokenExpires=null;
    await user.save();
    return res.json({success:true,message:"Password reset successfully"});
  } catch(e){next(e)}
}

export async function verifyEmail(req,res,next){
  try {
    const token=String(req.query.token||req.body?.token||"");
    const user=await User.findOne({emailVerificationToken:hashToken(token),emailVerificationExpires:{$gt:new Date()}});
    if(!user) return res.status(400).json({success:false,message:"Invalid or expired verification token"});
    user.emailVerified=true; user.emailVerificationToken=null; user.emailVerificationExpires=null; await user.save();
    return res.json({success:true,message:"Email verified successfully"});
  } catch(e){next(e)}
}

export async function resendVerification(req,res,next){
  try {
    const email=String(req.body?.email||"").trim().toLowerCase();
    const user=await User.findOne({email});
    if(!user || user.emailVerified) return res.json({success:true,message:"If verification is required, a new link has been sent."});
    const token=rawToken(); user.emailVerificationToken=hashToken(token); user.emailVerificationExpires=new Date(Date.now()+24*60*60*1000); await user.save();
    const url=`${process.env.CLIENT_URL||"http://localhost:5173"}/verify-email?token=${token}`;
    await sendSecurityEmail({to:user.email,subject:"Verify your Smart Mentoring System account",text:`Verify your account: ${url}\nThis link expires in 24 hours.`});
    return res.json({success:true,message:"Verification link sent",developmentToken:process.env.NODE_ENV!=="production"?token:undefined});
  } catch(e){next(e)}
}

export async function loginActivity(req,res,next){
  try { const rows=await LoginActivity.find({user:req.user._id}).sort({loginAt:-1}).limit(5).lean(); return res.json({success:true,activities:rows}); } catch(e){next(e)}
}

export async function auditLogs(req,res,next){
  try { const rows=await AuditLog.find({}).sort({createdAt:-1}).limit(100).populate("actor","name email role").lean(); return res.json({success:true,logs:rows}); } catch(e){next(e)}
}

export async function setup2FA(req,res,next){
  try { const code=otp(); req.user.twoFactorCode=code; req.user.twoFactorExpires=new Date(Date.now()+10*60*1000); await req.user.save(); await sendSecurityEmail({to:req.user.email,subject:"Smart Mentoring System 2FA code",text:`Your OTP is ${code}. It expires in 10 minutes.`}); return res.json({success:true,message:"OTP sent to your email",developmentCode:process.env.NODE_ENV!=="production" && !process.env.SMTP_HOST?code:undefined}); } catch(e){next(e)}
}

export async function verify2FA(req,res,next){
  try { const code=String(req.body?.code||""); if(!req.user.twoFactorCodeHash || !req.user.twoFactorExpires || req.user.twoFactorExpires<new Date()) return res.status(400).json({success:false,message:"Invalid or expired OTP"}); if(hashToken(code)!==req.user.twoFactorCodeHash) return res.status(400).json({success:false,message:"Invalid or expired OTP"}); req.user.twoFactorEnabled=true; req.user.twoFactorCodeHash=null; req.user.twoFactorAttempts=0; req.user.twoFactorExpires=null; await req.user.save(); return res.json({success:true,message:"Two-factor authentication enabled"}); } catch(e){next(e)}
}

export async function disable2FA(req,res,next){
  try { req.user.twoFactorEnabled=false; req.user.twoFactorCodeHash=null; req.user.twoFactorAttempts=0; req.user.twoFactorExpires=null; await req.user.save(); return res.json({success:true,message:"Two-factor authentication disabled"}); } catch(e){next(e)}
}

export async function writeAudit({actor,action,targetType,targetId,description,ipAddress}){ try { await AuditLog.create({actor,action,targetType,targetId,description,ipAddress}); } catch(e){ console.error("Audit log failure",e); } }
