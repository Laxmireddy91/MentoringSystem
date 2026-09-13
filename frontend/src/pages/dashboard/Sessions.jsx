import React from "react";

import CardTitle from "../../components/CardTitle";
import { safeId } from "../../utils/dashboardUtils";

/* =======================================================
   SESSIONS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them. The
   scheduling/editing modal itself is still rendered by
   Dashboard.jsx; this component only triggers it via setModal.
======================================================= */

export default function Sessions({
  role,
  info,
  data,
  setModal,
  deleteSession,
}) {
  const profile =
    data.profiles?.[role] ||
    {};

  return (
    <section className="mc-card">

      <CardTitle
        title="Mentoring Sessions"
        sub="Schedule, update and manage mentoring meetings"
      >

        <button
          className="mc-primary"
          onClick={() =>
            setModal({
              type: "session",

              item: {
                title: "",
                date: "",
                time: "10:00",
                owner:
                  profile.name ||
                  info.label,
                status:
                  "Scheduled",
              },
            })
          }
        >
          + Schedule Session
        </button>

      </CardTitle>


      <div className="mc-session-grid">

        {data.sessions.map(
          (session) => (
            <div
              className="mc-session"
              key={safeId(
                session
              )}
            >

              <span>
                {
                  session.status
                }
              </span>

              <h3>
                {
                  session.title
                }
              </h3>

              <p>
                {
                  session.date
                }{" "}
                at{" "}
                {
                  session.time
                }
              </p>

              <small>
                Owner:{" "}
                {
                  session.owner
                }
              </small>

              <div>

                <button
                  className="mc-link"
                  onClick={() =>
                    setModal({
                      type:
                        "session",
                      item:
                        session,
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className="mc-danger-link"
                  onClick={() =>
                    deleteSession(
                      safeId(
                        session
                      )
                    )
                  }
                >
                  Cancel
                </button>

              </div>

            </div>
          )
        )}

      </div>

    </section>
  );
}
