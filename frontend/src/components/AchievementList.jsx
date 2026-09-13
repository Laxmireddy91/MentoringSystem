import React from "react";

import { safeId, assetUrl } from "../utils/dashboardUtils";

/* =========================================================
   ACHIEVEMENT LIST

   Shared list of uploaded student achievements/documents, used
   by the Reports Centre for both students (editable) and
   mentors (read-only). Extracted without behavior or styling
   changes from Dashboard.jsx, where it previously existed both
   as dead code and duplicated locally in Reports.jsx.
========================================================= */

export default function AchievementList({ achievements = [], onDelete, readOnly = false }) {
  if (!achievements.length) {
    return null;
  }

  return (
    <div className="mc-achievement-list">
      {achievements.map((item, index) => {
        const id = safeId(item) || index;
        const url = assetUrl(item.filePath);
        return (
          <article className="mc-achievement-item" key={id}>
            <div className="mc-achievement-main">
              <div className="mc-achievement-icon">★</div>
              <div>
                <h4>{item.title || "Untitled achievement"}</h4>
                <div className="mc-achievement-meta">
                  <span>{item.category || "Achievement"}</span>
                  <span>{item.date || "Date not set"}</span>
                  {item.fileName && <span>{item.fileName}</span>}
                </div>
                {item.description && <p>{item.description}</p>}
              </div>
            </div>
            {url && (
              <div className="mc-achievement-actions">
                <a className="mc-outline-btn" href={url} target="_blank" rel="noreferrer">Open Document</a>
                {!readOnly && onDelete && <button className="mc-danger-link" onClick={() => onDelete(id)}>Remove</button>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
