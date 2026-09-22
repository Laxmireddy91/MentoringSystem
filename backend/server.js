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
import jwt from "jsonwebtoken";

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

<<<<<<< HEAD
  httpServer.listen(PORT,()=>console.log(`MentorConnect API listening on ${PORT}`));
=======
/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(
    "❌ SERVER ERROR:",
    err
  );

  res.status(500).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
});

/* =========================================================
   START SERVER
========================================================= */

const PORT =
  process.env.PORT || 5000;

async function startServer() {
  try {
    /* -----------------------------------------------------
       CONNECT DATABASE
    ----------------------------------------------------- */

    await connectDB();

    /* -----------------------------------------------------
       CREATE HTTP SERVER
    ----------------------------------------------------- */

    const httpServer =
      http.createServer(app);

    /* -----------------------------------------------------
       CREATE SOCKET.IO SERVER
    ----------------------------------------------------- */

    const io = new Server(
      httpServer,
      {
        cors: {
          origin:
            process.env.CLIENT_URL ||
            "http://localhost:5173",

          credentials: true,
        },
      }
    );
    const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = decoded;

    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error.message
    );

    next(new Error("Invalid authentication token"));
  }
});

    /* =====================================================
       SOCKET.IO CONNECTION
    ===================================================== */

    io.on(
      "connection",
      (socket) => {
        console.log(
          "🔌 Socket connected:",
          socket.id
        );

        /* =================================================
           JOIN PRIVATE USER ROOM
        ================================================= */

        socket.on("join", () => {
  const userId =
    socket.user?.id ||
    socket.user?._id ||
    socket.user?.userId;

  if (!userId) {
    console.log("⚠️ User ID missing from JWT");
    return;
  }

  const room = `user_${userId}`;

  socket.join(room);

  console.log(
    `👤 User ${userId} joined room ${room}`
  );
});
        /* =================================================
           REAL-TIME MESSAGE
        ================================================= */

        socket.on(
          "send_message",
          async (data) => {
            try {
              const {
                senderId,
                receiverId,
                message,
              } = data;

              /* -------------------------------------------
                 VALIDATION
              ------------------------------------------- */

              if (
                !senderId ||
                !receiverId ||
                !message?.trim()
              ) {
                console.log(
                  "⚠️ Invalid message data"
                );

                return;
              }

              console.log(
                `💬 Message: ${senderId} → ${receiverId}`
              );

              /* -------------------------------------------
                 SAVE MESSAGE TO MONGODB
              ------------------------------------------- */

              const newMessage =
                await Message.create({
                  sender: senderId,
                  receiver: receiverId,
                  message:
                    message.trim(),
                  status: "sent",
                });

              /* -------------------------------------------
                 GET COMPLETE MESSAGE
              ------------------------------------------- */

              const populatedMessage =
                await Message.findById(
                  newMessage._id
                )
                  .populate(
                    "sender",
                    "name email role"
                  )
                  .populate(
                    "receiver",
                    "name email role"
                  );

              /* -------------------------------------------
                 SEND TO RECEIVER
              ------------------------------------------- */

              io.to(
                `user_${receiverId}`
              ).emit(
                "receive_message",
                {
                  message:
                    populatedMessage,
                }
              );

              /* -------------------------------------------
                 SEND BACK TO SENDER
              ------------------------------------------- */

              io.to(
                `user_${senderId}`
              ).emit(
                "message_sent",
                {
                  message:
                    populatedMessage,
                }
              );

              console.log(
                "✅ Message saved and delivered"
              );

            } catch (error) {
              console.error(
                "❌ Socket message error:",
                error
              );

              socket.emit(
                "message_error",
                {
                  message:
                    "Unable to send message",
                }
              );
            }
          }
        );

        /* =================================================
           DISCONNECT
        ================================================= */

        socket.on(
          "disconnect",
          () => {
            console.log(
              "🔌 Socket disconnected:",
              socket.id
            );
          }
        );
      }
    );

    /* =====================================================
       START HTTP + SOCKET.IO SERVER
    ===================================================== */

    httpServer.listen(
      PORT,
      () => {
        console.log(
          `🚀 API running on http://localhost:${PORT}`
        );

        console.log(
          `❤️ Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          "💬 Socket.IO ready"
        );
      }
    );

  } catch (error) {
    console.error(
      "❌ Server startup failed:",
      error
    );

    process.exit(1);
  }
>>>>>>> 5101675 (Update MentoringSystem)
}
startServer().catch(err=>{console.error("FATAL STARTUP ERROR",err);process.exit(1);});
