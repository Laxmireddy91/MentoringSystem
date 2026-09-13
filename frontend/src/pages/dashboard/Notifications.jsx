import React from "react";

import CardTitle from "../../components/CardTitle";
import { safeId } from "../../utils/dashboardUtils";

/* =======================================================
   NOTIFICATIONS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them.
======================================================= */

export default function Notifications({
  data,
  markNotificationRead,
}) {
  return (
    <section className="mc-card">

      <CardTitle
        title="Notifications"
        sub="Alerts, reports and academic updates"
      />

      <div className="mc-notices">

        {data.notifications.map(
          (notification) => (
            <div
              className={`mc-notice ${
                notification.read
                  ? "read"
                  : ""
              }`}
              key={safeId(
                notification
              )}
            >

              <div>

                <span>
                  {
                    notification.type ||
                    "General"
                  }
                </span>

                <h3>
                  {
                    notification.title
                  }
                </h3>

                <p>
                  {
                    notification.text
                  }
                </p>

              </div>

              <button
                className="mc-link"
                onClick={() =>
                  markNotificationRead(
                    safeId(
                      notification
                    )
                  )
                }
              >
                {notification.read
                  ? "Read"
                  : "Mark read"}
              </button>

            </div>
          )
        )}

      </div>

    </section>
  );
}
