import React from "react";

import CardTitle from "../../components/CardTitle";
import { safeId } from "../../utils/dashboardUtils";

/* =======================================================
   TASKS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them. The task
   creation/edit modal itself is still rendered by
   Dashboard.jsx; this component only triggers it via setModal.
======================================================= */

export default function Tasks({
  info,
  data,
  setModal,
  toggleTask,
  deleteTask,
}) {
  return (
    <section className="mc-card">

      <CardTitle
        title="Task Tracker"
        sub="Follow-ups, reports and pending actions"
      >

        <button
          className="mc-primary"
          onClick={() =>
            setModal({
              type: "task",

              item: {
                title: "",
                due: "",
                owner:
                  info.label,
                priority:
                  "Medium",
                done: false,
              },
            })
          }
        >
          + Add Task
        </button>

      </CardTitle>


      <div className="mc-tasks">

        {data.tasks.map(
          (task) => (
            <div
              className={`mc-task ${
                task.done
                  ? "done"
                  : ""
              }`}
              key={safeId(
                task
              )}
            >

              <button
                onClick={() =>
                  toggleTask(
                    task
                  )
                }
              >
                {task.done
                  ? "✓"
                  : "○"}
              </button>

              <div>

                <b>
                  {
                    task.title
                  }
                </b>

                <small>
                  Due{" "}
                  {
                    task.due ||
                    "—"
                  }{" "}
                  •{" "}
                  {
                    task.owner
                  }
                </small>

              </div>

              <span
                className={`mc-priority ${String(
                  task.priority ||
                    "Medium"
                ).toLowerCase()}`}
              >
                {
                  task.priority
                }
              </span>

              <button
                className="mc-danger-link"
                onClick={() =>
                  deleteTask(
                    safeId(
                      task
                    )
                  )
                }
              >
                Delete
              </button>

            </div>
          )
        )}

      </div>

    </section>
  );
}
