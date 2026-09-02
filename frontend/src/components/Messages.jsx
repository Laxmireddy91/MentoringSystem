import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../socket";


/* =========================================================
   API URL
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


/* =========================================================
   GET TOKEN
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
   GET CURRENT USER
========================================================= */

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(
        "mentorconnect_user"
      ) || "{}"
    );
  } catch {
    return {};
  }
}


/* =========================================================
   MESSAGES COMPONENT
========================================================= */

export default function Messages({
  role = "student",
}) {

  const currentUser =
    getCurrentUser();


  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [partner, setPartner] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [connected, setConnected] =
    useState(socket.connected);


  const messagesEndRef =
    useRef(null);


  /* =======================================================
     USER ID
  ======================================================= */

  const currentUserId =
    currentUser?._id ||
    currentUser?.id;


  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);


  /* =======================================================
     SOCKET CONNECTION
  ======================================================= */

  useEffect(() => {

    const handleConnect = () => {

      console.log(
        "🟢 Messages socket connected"
      );

      setConnected(true);

      /*
       * Join authenticated user's room.
       *
       * This is compatible with
       * your existing backend.
       */

      if (currentUserId) {

        socket.emit(
          "join",
          currentUserId
        );

      }
    };


    const handleDisconnect = () => {

      console.log(
        "🔴 Messages socket disconnected"
      );

      setConnected(false);

    };


    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );


    if (
      !socket.connected &&
      getToken()
    ) {
      socket.connect();
    }


    return () => {

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

    };

  }, [currentUserId]);


  /* =======================================================
     FIND CHAT PARTNER
  ======================================================= */

  useEffect(() => {

    async function loadPartner() {

      try {

        setLoading(true);

        setError("");


        /*
         * The existing backend workspace
         * endpoints provide student/mentor
         * information.
         *
         * We first try to identify the
         * manually assigned relationship.
         */

        const token =
          getToken();


        if (!token) {

          setError(
            "Please login again."
          );

          return;

        }


        /*
         * Student
         */

        if (
          role === "student"
        ) {

const response =
  await fetch(
    `${API_URL}/workspace/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

          if (
            response.ok
          ) {

            const data =
              await response.json();


            const student =
              data.student ||
              data.data ||
              data;


         if (data.profiles?.mentor) {
  setPartner(data.profiles.mentor);
}

          }

        }


        /*
         * Mentor
         */

        if (
          role === "mentor"
        ) {

          const response =
            await fetch(
              `${API_URL}/workspace/dashboard`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );


          if (
            response.ok
          ) {

            const data =
              await response.json();


            const students =
              data.students ||
              data.data ||
              [];


            /*
             * For now show the first
             * assigned student.
             *
             * We will expand this into
             * a conversation list next.
             */

       const assigned =
  students.find(
    (student) =>
      String(student.mentor || "")
        .trim()
        .toLowerCase() ===
      String(currentUser.name || "")
        .trim()
        .toLowerCase()
  );

console.log(
  "========== MENTOR MESSAGE PARTNER =========="
);

console.log(
  "Current mentor:",
  currentUser.name
);

console.log(
  "Students from dashboard:",
  students
);

console.log(
  "Assigned student:",
  assigned
);

if (assigned) {

  /*
   * student.user should contain
   * the User._id of the student.
   *
   * It may arrive as:
   *
   * 1. "6a8c887cb5acc665eb001200"
   *
   * 2. { _id: "6a8c887cb5acc665eb001200" }
   *
   * 3. { id: "6a8c887cb5acc665eb001200" }
   */

  const studentUserId =
    typeof assigned.user === "object"
      ? (
          assigned.user?._id ||
          assigned.user?.id
        )
      : assigned.user;

  console.log(
    "Student User ID:",
    studentUserId
  );

  if (studentUserId) {

    setPartner({
      _id: String(studentUserId),
      id: String(studentUserId),
      name: assigned.name || "Student",
      role: "student",
    });

  } else {

    console.error(
      "Assigned student has no User ID:",
      assigned
    );

    setError(
      "Assigned student account could not be found."
    );

  }

}

          }

        }

      } catch (err) {

        console.error(
          "❌ Partner loading error:",
          err
        );

        setError(
          "Unable to load your chat partner."
        );

      } finally {

        setLoading(false);

      }

    }


    loadPartner();

  }, [
    role,
    currentUser.name,
  ]);


  /* =======================================================
     FIND MENTOR
  ======================================================= */

  async function findMentorByName(
    mentorName,
    token
  ) {

    try {

      const response =
        await fetch(
          `${API_URL}/workspace/mentors`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (
        !response.ok
      ) {
        return;
      }


      const data =
        await response.json();


      const mentors =
        data.mentors ||
        data.data ||
        [];


const mentor =
  mentors.find(
    (item) =>
      String(item.name || "")
        .trim()
        .toLowerCase() ===
      String(mentorName || "")
        .trim()
        .toLowerCase()
  );

if (mentor) {

  const mentorUserId =
    typeof mentor.user === "object"
      ? (
          mentor.user?._id ||
          mentor.user?.id
        )
      : mentor.user;

  console.log(
    "========== STUDENT MESSAGE PARTNER =========="
  );

  console.log(
    "Mentor:",
    mentor
  );

  console.log(
    "Mentor User ID:",
    mentorUserId
  );

  if (mentorUserId) {

    setPartner({
      _id: String(mentorUserId),
      id: String(mentorUserId),
      name: mentor.name || "Mentor",
      role: "mentor",
    });

  } else {

    console.error(
      "Mentor has no User ID:",
      mentor
    );

    setError(
      "Mentor account could not be found."
    );

  }

}

    } catch (err) {

      console.error(
        "❌ Mentor lookup error:",
        err
      );

    }

  }


  /* =======================================================
     LOAD CONVERSATION
  ======================================================= */

  useEffect(() => {

    async function loadConversation() {

      if (
        !partner ||
        !partner._id &&
        !partner.id
      ) {
        return;
      }


      const partnerId =
        partner._id ||
        partner.id;


      try {

        setError("");


        const token =
          getToken();


        const response =
          await fetch(
            `${API_URL}/messages/${partnerId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.message ||
            "Unable to load conversation"
          );

        }


        setMessages(
          data.messages || []
        );


        /*
         * Mark messages as read.
         */

        await fetch(
          `${API_URL}/messages/${partnerId}/read`,
          {
            method: "PUT",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      } catch (err) {

        console.error(
          "❌ Conversation error:",
          err
        );

        setError(
          err.message ||
          "Unable to load messages."
        );

      }

    }


    loadConversation();

  }, [partner]);


  /* =======================================================
     REAL-TIME RECEIVED MESSAGE
  ======================================================= */

  useEffect(() => {

    const handleReceive =
      (data) => {

        const incoming =
          data?.message;


        if (!incoming) {
          return;
        }


        const senderId =
          incoming.sender?._id ||
          incoming.sender;


        const receiverId =
          incoming.receiver?._id ||
          incoming.receiver;


        const partnerId =
          partner?._id ||
          partner?.id;


        if (
          String(senderId) ===
            String(partnerId) ||
          String(receiverId) ===
            String(partnerId)
        ) {

          setMessages(
            (previous) => {

              /*
               * Prevent duplicates.
               */

              const exists =
                previous.some(
                  (item) =>
                    String(
                      item._id
                    ) ===
                    String(
                      incoming._id
                    )
                );


              if (exists) {
                return previous;
              }


              return [
                ...previous,
                incoming,
              ];

            }
          );

        }

      };


    socket.on(
      "receive_message",
      handleReceive
    );


    return () => {

      socket.off(
        "receive_message",
        handleReceive
      );

    };

  }, [partner]);


  /* =======================================================
     MESSAGE SENT FROM SERVER
  ======================================================= */

  useEffect(() => {

    const handleSent =
      (data) => {

        const sent =
          data?.message;


        if (!sent) {
          return;
        }


        setMessages(
          (previous) => {

            const exists =
              previous.some(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    sent._id
                  )
              );


            if (exists) {
              return previous;
            }


            return [
              ...previous,
              sent,
            ];

          }
        );

      };


    socket.on(
      "message_sent",
      handleSent
    );


    return () => {

      socket.off(
        "message_sent",
        handleSent
      );

    };

  }, []);


  /* =======================================================
     SEND MESSAGE
  ======================================================= */


async function sendMessage(event) {
  event.preventDefault();

  const cleanText = text.trim();

  if (!cleanText || !partner || sending) {
    return;
  }

  /*
   * Always use the USER ID of the receiver.
   *
   * partner should look like:
   *
   * {
   *   _id: "6a8c887cb5acc665eb001200",
   *   id: "6a8c887cb5acc665eb001200",
   *   name: "akhila",
   *   role: "student"
   * }
   */

  const receiverId = String(
    partner?._id ||
    partner?.id ||
    ""
  ).trim();

  console.log(
    "========== SEND MESSAGE DEBUG =========="
  );

  console.log(
    "Current User:",
    currentUser
  );

  console.log(
    "Partner:",
    partner
  );

  console.log(
    "Receiver User ID:",
    receiverId
  );

  if (!receiverId) {
    setError(
      "Receiver user ID is missing."
    );

    console.error(
      "Cannot send message. Partner has no User ID:",
      partner
    );

    return;
  }

  try {
    setSending(true);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Please login again."
      );
    }

    const response = await fetch(
      `${API_URL}/messages`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          receiver: receiverId,
          message: cleanText,
        }),
      }
    );

    const data =
      await response.json();

    console.log(
      "Send message response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Unable to send message"
      );
    }

    /*
     * Add the sent message immediately.
     */

    if (data.message) {
      setMessages(
        (previous) => {
          const exists =
            previous.some(
              (item) =>
                String(item._id) ===
                String(
                  data.message._id
                )
            );

          if (exists) {
            return previous;
          }

          return [
            ...previous,
            data.message,
          ];
        }
      );
    }

    setText("");

  } catch (error) {

    console.error(
      "Send message error:",
      error
    );

    setError(
      error.message ||
      "Unable to send message"
    );

  } finally {

    setSending(false);

  }
}

   

 
 


  /* =======================================================
     FORMAT TIME
  ======================================================= */

  function formatTime(
    date
  ) {

    if (!date) {
      return "";
    }


    try {

      return new Date(
        date
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    } catch {

      return "";

    }

  }


  /* =======================================================
     DETERMINE MESSAGE OWNER
  ======================================================= */

  function isMine(
    message
  ) {

    const senderId =
      message?.sender?._id ||
      message?.sender;


    return (
      String(senderId) ===
      String(currentUserId)
    );

  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <section className="mc-card">
        <h2>Messages</h2>

        <p>
          Loading your conversation...
        </p>
      </section>
    );

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="mc-card"
      style={{
        padding: 0,
        overflow: "hidden",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          padding: "22px 24px",
          borderBottom:
            "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
            }}
          >
            Messages
          </h2>

          <p
            style={{
              margin:
                "6px 0 0",
              opacity: 0.65,
            }}
          >
            {role === "student"
              ? "Chat with your mentor"
              : "Chat with your students"}
          </p>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >

          <span
            style={{
              width: 9,
              height: 9,
              borderRadius:
                "50%",
              background:
                connected
                  ? "#22c55e"
                  : "#ef4444",
            }}
          />

          {connected
            ? "Connected"
            : "Offline"}

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div
          style={{
            margin:
              "16px 20px 0",
            padding: 12,
            borderRadius: 10,
            background:
              "rgba(239,68,68,0.1)",
            color:
              "#b91c1c",
            fontSize: 14,
          }}
        >
          {error}
        </div>

      )}


      {/* =================================================
          NO PARTNER
      ================================================= */}

      {!partner && !error && (

        <div
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >

          <div
            style={{
              fontSize: 42,
              marginBottom: 12,
            }}
          >
            💬
          </div>

          <h3>
            No chat available yet
          </h3>

          <p
            style={{
              opacity: 0.65,
            }}
          >
            {role === "student"
              ? "You will be able to message your assigned mentor once a mentor is assigned."
              : "You will be able to message students assigned to you."}
          </p>

        </div>

      )}


      {/* =================================================
          CHAT
      ================================================= */}

      {partner && (

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            height: 560,
          }}
        >

          {/* ---------------------------------------------
              PARTNER HEADER
          --------------------------------------------- */}

          <div
            style={{
              padding:
                "14px 20px",
              borderBottom:
                "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems:
                "center",
              gap: 12,
            }}
          >

            <div
              style={{
                width: 42,
                height: 42,
                borderRadius:
                  "50%",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background:
                  "rgba(59,130,246,0.12)",
                fontWeight: 700,
              }}
            >
              {(partner.name ||
                "?")
                .charAt(0)
                .toUpperCase()}
            </div>


            <div>

              <strong>
                {partner.name ||
                  "Mentor"}
              </strong>

              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                {partner.role ||
                  (role ===
                  "student"
                    ? "Mentor"
                    : "Student")}
              </div>

            </div>

          </div>


          {/* ---------------------------------------------
              MESSAGE LIST
          --------------------------------------------- */}

          <div
            style={{
              flex: 1,
              overflowY:
                "auto",
              padding:
                "20px",
              display: "flex",
              flexDirection:
                "column",
              gap: 10,
              background:
                "rgba(0,0,0,0.015)",
            }}
          >

            {messages.length ===
              0 && (

              <div
                style={{
                  margin:
                    "auto",
                  textAlign:
                    "center",
                  opacity:
                    0.55,
                }}
              >

                <div
                  style={{
                    fontSize: 36,
                  }}
                >
                  👋
                </div>

                <p>
                  Start the conversation
                </p>

              </div>

            )}


            {messages.map(
              (message) => {

                const mine =
                  isMine(
                    message
                  );


                return (
                  <div
                    key={
                      message._id ||
                      `${message.createdAt}-${Math.random()}`
                    }
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        mine
                          ? "flex-end"
                          : "flex-start",
                    }}
                  >

                    <div
                      style={{
                        maxWidth:
                          "72%",
                        padding:
                          "10px 14px",
                        borderRadius:
                          mine
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                        background:
                          mine
                            ? "#2563eb"
                            : "#ffffff",
                        color:
                          mine
                            ? "#ffffff"
                            : "inherit",
                        boxShadow:
                          "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >

                      <div
                        style={{
                          lineHeight:
                            1.45,
                          whiteSpace:
                            "pre-wrap",
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {message.message}
                      </div>


                      <div
                        style={{
                          marginTop:
                            4,
                          fontSize:
                            10,
                          opacity:
                            mine
                              ? 0.75
                              : 0.5,
                          textAlign:
                            "right",
                        }}
                      >

                        {formatTime(
                          message.createdAt
                        )}

                        {mine &&
                          "  ✓"}

                      </div>

                    </div>

                  </div>
                );

              }
            )}


            <div
              ref={
                messagesEndRef
              }
            />

          </div>


          {/* ---------------------------------------------
              COMPOSER
          --------------------------------------------- */}

          <form
            onSubmit={
              sendMessage
            }
            style={{
              padding:
                "14px 16px",
              borderTop:
                "1px solid rgba(0,0,0,0.08)",
              display:
                "flex",
              gap: 10,
            }}
          >

            <input
              value={text}
              onChange={(event) =>
                setText(
                  event.target.value
                )
              }
              placeholder="Type a message..."
              maxLength={2000}
              disabled={
                sending ||
                !connected
              }
              style={{
                flex: 1,
                padding:
                  "12px 14px",
                border:
                  "1px solid rgba(0,0,0,0.15)",
                borderRadius:
                  12,
                outline: "none",
                fontSize: 14,
              }}
            />


            <button
              type="submit"
              disabled={
                sending ||
                !text.trim() ||
                !connected
              }
              style={{
                padding:
                  "0 20px",
                border: "none",
                borderRadius:
                  12,
                cursor:
                  "pointer",
                fontWeight: 600,
              }}
            >
              {sending
                ? "Sending..."
                : "Send"}
            </button>

          </form>

        </div>

      )}

    </section>
  );
}