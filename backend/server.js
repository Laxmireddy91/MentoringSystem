import "dotenv/config";

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import Message from "./models/Message.js";

import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5174",

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use("/uploads", express.static("uploads"));

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MentorConnect API is running",
    database: "MentoringSystem",
  });
});

/* =========================================================
   ROUTES
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/workspace",
  workspaceRoutes
);

app.use(
  "/api/risk",
  riskRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

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
            "http://localhost:5174",

          credentials: true,
        },
      }
    );

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

        socket.on(
          "join",
          (userId) => {
            if (!userId) {
              console.log(
                "⚠️ User ID missing while joining room"
              );

              return;
            }

            const room =
              `user_${userId}`;

            socket.join(room);

            console.log(
              `👤 User ${userId} joined room ${room}`
            );
          }
        );

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
}

/* =========================================================
   RUN SERVER
========================================================= */

startServer();