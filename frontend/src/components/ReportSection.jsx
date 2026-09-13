import React from "react";

/* =========================================================
   REPORT SECTION

   Shared collapsible-looking section wrapper used by the
   digital performance report and reports centre (Performance,
   Reports). Extracted without behavior or styling changes from
   Dashboard.jsx, where it previously existed both as dead code
   and duplicated locally in Performance.jsx and Reports.jsx.
========================================================= */

export default function ReportSection({ title, description, children }) {
  return (
    <section className="mc-report-section">
      <div className="mc-report-section-head">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
