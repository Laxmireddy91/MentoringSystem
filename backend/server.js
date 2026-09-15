import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "./models/User.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const requiredEnv=["MONGO_URI","JWT_SECRET"];
for(const key of requiredEnv){ if(!process.env[key]) throw new Error(`Missing required environment variable: ${key}`); }
if(!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET=process.env.JWT_SECRET;

const app=express();
const allowedOrigins=(process.env.CLIENT_URL||"http://localhost:5173").split(",").map(x=>x.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(pinoHttp());
app.use(cors({origin:(origin,cb)=>{if(!origin||allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error("CORS not allowed"));},credentials:true}));
app.use(express.json({limit:"5mb"}));
app.use(express.urlencoded({extended:true}));
app.use("/uploads",express.static("uploads"));

const authLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many authentication attempts. Please try again later."}});
app.use("/api/auth/login",authLimiter);
app.use("/api/auth/register",authLimiter);
app.use("/api/auth/forgot-password",authLimiter);

app.get("/api/health",(req,res)=>res.json({success:true,message:"MentorConnect API is running",database:"MentoringSystem",security:{helmet:true,rateLimit:true,socketJWT:true}}));
app.use("/api/auth",authRoutes);
app.use("/api/workspace",workspaceRoutes);
app.use("/api/risk",riskRoutes);
app.use("/api/messages",messageRoutes);

app.use((req,res)=>res.status(404).json({success:false,message:"Route not found"}));
app.use((err,req,res,next)=>{ req.log?.error({err},"Request failed"); console.error("SERVER ERROR",err); const production=process.env.NODE_ENV==="production"; res.status(err.status||500).json({success:false,message:production?"Internal server error":(err.message||"Internal server error")}); });

const PORT=process.env.PORT||5000;
async function startServer(){
  await connectDB();
  const httpServer=http.createServer(app);
  const io=new Server(httpServer,{cors:{origin:(origin,cb)=>{if(!origin||allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error("CORS not allowed"));},credentials:true}});
  app.set("io",io);

  io.use(async(socket,next)=>{
    try{
      const token=socket.handshake.auth?.token;
      if(!token) return next(new Error("Authentication required"));
      const decoded=jwt.verify(token,process.env.JWT_SECRET);
      if(!decoded?.id) return next(new Error("Invalid token"));
      const user=await User.findById(decoded.id).select("_id name email role active usn");
      if(!user||user.active===false) return next(new Error("User not authorized"));
      socket.user=user;
      next();
    }catch{ next(new Error("Invalid authentication token")); }
  });

  io.on("connection",socket=>{
    const ownRoom=`user_${socket.user._id}`;
    socket.join(ownRoom);
    socket.emit("socket_authenticated",{userId:socket.user._id});
    console.log(`Socket authenticated: ${socket.user._id}`);

    socket.on("join",userId=>{
      if(String(userId)!==String(socket.user._id)) return socket.emit("socket_error",{message:"You may only join your own user room"});
      socket.join(ownRoom);
    });

    socket.on("disconnect",reason=>console.log(`Socket disconnected ${socket.user._id}: ${reason}`));
  });

  httpServer.listen(PORT,()=>console.log(`MentorConnect API listening on ${PORT}`));
}
startServer().catch(err=>{console.error("FATAL STARTUP ERROR",err);process.exit(1);});
