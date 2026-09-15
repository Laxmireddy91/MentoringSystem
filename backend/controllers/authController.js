import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import LoginActivity from "../models/LoginActivity.js";
import { sendSecurityEmail } from "../services/emailService.js";

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || "",
  phone: user.phone || "",
  usn: user.usn || "",
  designation: user.designation || "",
  semester: user.semester || "",
  active: user.active,
  emailVerified: user.emailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
});

const accessTokenFor = (user) => jwt.sign({ id:user._id.toString(), role:user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" });
const refreshTokenFor = (user) => jwt.sign({ id:user._id.toString(), role:user.role, type:"refresh" }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d" });
const randomToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");
const otp = () => String(crypto.randomInt(100000, 1000000));
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

export async function register(req,res,next){
  let createdUser=null;
  try {
    const {name,email,password,role="student",department,phone,usn,semester}=req.body;
    const normalizedRole=String(role).trim().toLowerCase();
    if(!strongPassword.test(password||"")) return res.status(400).json({success:false,message:"Password must contain 8+ characters with uppercase, lowercase, number and special character"});
    const normalizedEmail=String(email).trim().toLowerCase();
    const normalizedUSN=String(usn||"").trim().toUpperCase();
    if(normalizedRole==="student"&&!normalizedUSN) return res.status(400).json({success:false,message:"USN is required for students"});
    if(await User.findOne({email:normalizedEmail})) return res.status(409).json({success:false,message:"Email already registered"});
    if(normalizedRole==="student"&&await Student.findOne({usn:normalizedUSN})) return res.status(409).json({success:false,message:`USN ${normalizedUSN} is already registered`});
    createdUser=await User.create({name:String(name).trim(),email:normalizedEmail,password:await bcrypt.hash(password,12),role:normalizedRole,department:department||"Computer Science & Engineering",phone:phone||"",usn:normalizedUSN,designation:normalizedRole,semester:semester||"",active:true,emailVerified:process.env.REQUIRE_EMAIL_VERIFICATION!=="true"});
    if(normalizedRole==="student") await Student.create({name:createdUser.name,usn:normalizedUSN,dept:createdUser.department,year:"3rd Year",mentor:"",phone:createdUser.phone,subjects:[],cie1:0,cie2:0,cie3:0,final:0,set:0,total:0,grade:"",backlog:0,marksUpdatedBy:"",user:createdUser._id});
    if(normalizedRole==="mentor") await Mentor.create({mentorId:`M${Date.now().toString().slice(-5)}`,name:createdUser.name,students:0,performance:0,lastActive:new Date().toISOString().slice(0,10),status:"Active",email:normalizedEmail,user:createdUser._id});
    let verificationToken;
    if(process.env.REQUIRE_EMAIL_VERIFICATION==="true") {
      verificationToken=randomToken(); createdUser.emailVerificationToken=hashToken(verificationToken); createdUser.emailVerificationExpires=new Date(Date.now()+24*60*60*1000); await createdUser.save();
      const url=`${process.env.CLIENT_URL||"http://localhost:5173"}/verify-email?token=${verificationToken}`;
      await sendSecurityEmail({to:createdUser.email,subject:"Verify your Smart Mentoring System account",text:`Verify your account: ${url}\nThis link expires in 24 hours.`});
      return res.status(201).json({success:true,message:"Registration successful. Please verify your email before logging in.",user:safeUser(createdUser),developmentToken:process.env.NODE_ENV!=="production"?verificationToken:undefined});
    }
    const token=accessTokenFor(createdUser), refreshToken=refreshTokenFor(createdUser);
    createdUser.refreshTokenHash=hashToken(refreshToken);
    createdUser.refreshTokenExpires=new Date(Date.now()+30*24*60*60*1000);
    await createdUser.save();
    return res.status(201).json({success:true,message:"Registration successful",token,refreshToken,user:safeUser(createdUser)});
  } catch(error){
    if(createdUser?._id) { try { await User.findByIdAndDelete(createdUser._id); } catch {} }
    if(error.code===11000) return res.status(409).json({success:false,message:"Email or USN already exists"});
    next(error);
  }
}

export async function login(req,res,next){
  try {
    const {email,password,role,loginMethod="direct"}=req.body;
    const normalizedEmail=String(email).trim().toLowerCase(), normalizedRole=String(role).trim().toLowerCase();
    const user=await User.findOne({email:normalizedEmail});
    const fail=async()=>{ if(user){ user.failedLoginAttempts=(user.failedLoginAttempts||0)+1; if(user.failedLoginAttempts>=5){user.lockedUntil=new Date(Date.now()+15*60*1000);user.failedLoginAttempts=0;} await user.save(); await LoginActivity.create({user:user._id,ipAddress:req.ip,userAgent:req.get("user-agent")||"",device:req.get("user-agent")||"",success:false}); } return res.status(401).json({success:false,message:"Invalid email or password"}); };
    if(!user) return fail();
    if(user.lockedUntil && user.lockedUntil>new Date()) return res.status(423).json({success:false,message:"Account temporarily locked. Please try again later."});
    if(!user.active) return res.status(403).json({success:false,message:"Account is inactive"});
    if(!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION==="true") return res.status(403).json({success:false,message:"Please verify your email before logging in"});
    if(!(await bcrypt.compare(password,user.password))) return fail();
    if(user.role!==normalizedRole) return res.status(401).json({success:false,message:`This account is registered as ${user.role}. Please select the ${user.role} role.`});
    user.failedLoginAttempts=0; user.lockedUntil=null; await user.save();
    await LoginActivity.create({user:user._id,ipAddress:req.ip,userAgent:req.get("user-agent")||"",device:req.get("user-agent")||"",success:true});
    if(loginMethod === "otp" && ["student","mentor","hod"].includes(user.role)){
      user.twoFactorEnabled=true;
      const challenge=jwt.sign({id:user._id.toString(),type:"2fa"},process.env.JWT_SECRET,{expiresIn:"10m"});
      const code=otp(); user.twoFactorCodeHash=hashToken(code); user.twoFactorAttempts=0; user.twoFactorExpires=new Date(Date.now()+5*60*1000); await user.save();
      await sendSecurityEmail({to:user.email,subject:"Smart Mentoring System login OTP",text:`Your Smart Mentoring System login OTP is ${code}. It expires in 5 minutes. Do not share this OTP with anyone.`});
      return res.status(200).json({success:true,requires2FA:true,challenge,developmentCode:process.env.NODE_ENV!=="production" && !process.env.SMTP_HOST?code:undefined,message:"Two-factor authentication required. OTP sent to your registered email."});
    }
    const refreshToken=refreshTokenFor(user);
    user.refreshTokenHash=hashToken(refreshToken);
    user.refreshTokenExpires=new Date(Date.now()+30*24*60*60*1000);
    await user.save();
    return res.status(200).json({success:true,message:"Login successful",token:accessTokenFor(user),refreshToken,user:safeUser(user)});
  } catch(error){ next(error); }
}

export async function verifyLogin2FA(req,res,next){
  try {
    const decoded=jwt.verify(req.body?.challenge,process.env.JWT_SECRET);
    if(decoded.type!=="2fa") throw new Error("Invalid challenge");
    const user=await User.findById(decoded.id); const code=String(req.body?.code||"");
    if(!user || !user.twoFactorCodeHash || !user.twoFactorExpires || user.twoFactorExpires<new Date()) return res.status(400).json({success:false,message:"Invalid or expired OTP"});
    if((user.twoFactorAttempts||0) >= 5){ user.twoFactorCodeHash=null; user.twoFactorExpires=null; user.twoFactorAttempts=0; await user.save(); return res.status(429).json({success:false,message:"Too many OTP attempts. Please login again to request a new OTP."}); }
    if(hashToken(code)!==user.twoFactorCodeHash){ user.twoFactorAttempts=(user.twoFactorAttempts||0)+1; await user.save(); return res.status(400).json({success:false,message:"Invalid or expired OTP"}); }
    user.twoFactorCodeHash=null;user.twoFactorExpires=null;user.twoFactorAttempts=0;await user.save();
    const refreshToken=refreshTokenFor(user); user.refreshTokenHash=hashToken(refreshToken); user.refreshTokenExpires=new Date(Date.now()+30*24*60*60*1000); await user.save();
    return res.json({success:true,token:accessTokenFor(user),refreshToken,user:safeUser(user)});
  } catch { return res.status(401).json({success:false,message:"Invalid or expired OTP challenge"}); }
}

export async function me(req,res){ return res.status(200).json({success:true,user:req.user}); }
