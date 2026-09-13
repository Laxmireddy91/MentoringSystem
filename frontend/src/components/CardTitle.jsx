import React from "react";

/* =========================================================
   CARD TITLE

   Shared card header used across dashboard sections (Overview,
   Students, Mentors, Sessions, Tasks, Notifications, Profile,
   Analytics, Performance, Reports). Extracted without behavior
   or styling changes from Dashboard.jsx, where it previously
   existed both as dead code and duplicated locally in every one
   of those files.
========================================================= */

export default function CardTitle({
  title,
  sub,
  children,
}) {
  return (
    <div className="mc-card-title">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {sub}
        </p>

      </div>

      {children}

    </div>
  );
}
