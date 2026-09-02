import { io } from "socket.io-client";

/* =========================================================
   SOCKET SERVER URL
========================================================= */

const SOCKET_URL =
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(
        /\/api\/?$/,
        ""
      )
    : "http://localhost:5000";


/* =========================================================
   GET AUTHENTICATION TOKEN
========================================================= */

function getToken() {
  return (
    localStorage.getItem(
      "mentorconnect_token"
    ) ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}


/* =========================================================
   CREATE SOCKET
========================================================= */

const socket = io(
  SOCKET_URL,
  {
    autoConnect: false,

    withCredentials: true,

    auth: {
      token: getToken(),
    },
  }
);


/* =========================================================
   UPDATE SOCKET AUTH
========================================================= */

export function updateSocketAuth() {
  const token = getToken();

  socket.auth = {
    token,
  };
}


/* =========================================================
   CONNECT SOCKET
========================================================= */

export function connectSocket() {
  updateSocketAuth();

  if (!socket.connected) {
    socket.connect();
  }
}


/* =========================================================
   DISCONNECT SOCKET
========================================================= */

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}


/* =========================================================
   SOCKET EVENTS
========================================================= */

socket.on(
  "connect",
  () => {
    console.log(
      "🟢 Socket connected:",
      socket.id
    );
  }
);


socket.on(
  "disconnect",
  (reason) => {
    console.log(
      "🔴 Socket disconnected:",
      reason
    );
  }
);


socket.on(
  "connect_error",
  (error) => {
    console.error(
      "❌ Socket connection error:",
      error.message
    );
  }
);


/* =========================================================
   EXPORT
========================================================= */

export default socket;