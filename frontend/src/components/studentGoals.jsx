import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function StudentGoals({ student }) {
  const [goal, setGoal] = useState(null);
  const [targetCIE, setTargetCIE] = useState("");
  const [goalText, setGoalText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * Current CIE is calculated automatically
   * from the latest available CIE marks.
   *
   * Priority:
   * CIE III → CIE II → CIE I
   */
  const currentCIE = useMemo(() => {
    if (!student) return 0;

    const cie1 = Number(student.cie1 || 0);
    const cie2 = Number(student.cie2 || 0);
    const cie3 = Number(student.cie3 || 0);

    if (cie3 > 0) return cie3;
    if (cie2 > 0) return cie2;
    return cie1;
  }, [student]);

  const progress = useMemo(() => {
    const target = Number(targetCIE);

    if (!target || target <= 0) return 0;

    return Math.min(
      100,
      Math.round((currentCIE / target) * 100)
    );
  }, [targetCIE, currentCIE]);

  const status = useMemo(() => {
    const target = Number(targetCIE);

    if (!target) return "Not Set";

    if (currentCIE >= target) {
      return "Achieved";
    }

    if (currentCIE >= target * 0.8) {
      return "On Track";
    }

    return "Needs Improvement";
  }, [targetCIE, currentCIE]);

  useEffect(() => {
    loadGoal();
  }, []);

  async function loadGoal() {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.studentGoals.getMy();

      const savedGoal =
        response?.goal ||
        response?.data ||
        response ||
        null;

      if (savedGoal) {
        setGoal(savedGoal);
        setTargetCIE(savedGoal.targetCIE ?? "");
        setGoalText(savedGoal.goal ?? "");
      }
    } catch (error) {
      console.error("Unable to load goal:", error);

      /*
       * A 404 simply means the student
       * has not created a goal yet.
       */
      if (
        !error?.message?.toLowerCase()?.includes("404")
      ) {
        setMessage(
          error.message || "Unable to load goal"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveGoal(event) {
    event.preventDefault();

    setMessage("");

    const target = Number(targetCIE);

    if (!target || target < 1 || target > 100) {
      setMessage(
        "Target CIE must be between 1 and 100."
      );
      return;
    }

    if (!goalText.trim()) {
      setMessage("Please enter your goal.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        targetCIE: target,
        currentCIE,
        goal: goalText.trim(),
        status,
      };

      let response;

      /*
       * Existing goal → update
       * No goal → create
       */
      if (goal?._id || goal?.id) {
        const id = goal._id || goal.id;

        response = await api.studentGoals.update(
          id,
          payload
        );
      } else {
        response = await api.studentGoals.save(
          payload
        );
      }

      const savedGoal =
        response?.goal ||
        response?.data ||
        response ||
        payload;

      setGoal(savedGoal);

      setMessage(
        "Goal saved successfully."
      );
    } catch (error) {
      console.error("Unable to save goal:", error);

      setMessage(
        error.message ||
          "Unable to save your goal."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal() {
    if (!goal) return;

    const confirmed = window.confirm(
      "Delete your academic goal?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage("");

      const id = goal._id || goal.id;

      if (api.studentGoals.deleteById) {
        await api.studentGoals.deleteById(id);
      } else {
        await api.studentGoals.delete();
      }

      setGoal(null);
      setTargetCIE("");
      setGoalText("");

      setMessage(
        "Goal deleted successfully."
      );
    } catch (error) {
      console.error("Unable to delete goal:", error);

      setMessage(
        error.message ||
          "Unable to delete goal."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mc-card">
        <h2>My Academic Goal</h2>
        <p>Loading your goal...</p>
      </section>
    );
  }

  return (
    <section className="mc-card student-goals-page">
      <div className="mc-card-title">
        <div>
          <h2>My Academic Goal</h2>
          <p>
            Set your target CIE score and track your
            academic progress.
          </p>
        </div>
      </div>

      <form
        className="mc-form"
        onSubmit={saveGoal}
      >
        <div className="mc-form-grid">
          <label>
            <span>Target CIE Score</span>

            <input
              type="number"
              min="1"
              max="100"
              value={targetCIE}
              onChange={(event) =>
                setTargetCIE(event.target.value)
              }
              placeholder="Example: 85"
            />
          </label>

          <label>
            <span>Current CIE Score</span>

            <input
              type="number"
              value={currentCIE}
              readOnly
              disabled
            />

            <small>
              Automatically calculated from your
              latest CIE marks.
            </small>
          </label>
        </div>

        <label className="mc-wide-label">
          <span>My Goal</span>

          <textarea
            value={goalText}
            onChange={(event) =>
              setGoalText(event.target.value)
            }
            placeholder="Example: Improve my CIE performance and maintain consistent academic progress."
            rows="5"
            maxLength="300"
          />

          <small>
            {goalText.length}/300 characters
          </small>
        </label>

        {message && (
          <div className="mc-goal-message">
            {message}
          </div>
        )}

        <div className="mc-goal-actions">
          <button
            type="submit"
            className="mc-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : goal
              ? "Update Goal"
              : "Save Goal"}
          </button>

          {goal && (
            <button
              type="button"
              className="mc-danger-link"
              onClick={deleteGoal}
              disabled={saving}
            >
              Delete Goal
            </button>
          )}
        </div>
      </form>

      {/* ==============================
          PROGRESS CARD
      ============================== */}

      <div className="mc-goal-progress">
        <div className="mc-goal-progress-header">
          <div>
            <span className="mc-eyebrow">
              GOAL PROGRESS
            </span>

            <h3>
              {targetCIE
                ? `${progress}% of your target`
                : "Set a target to begin tracking"}
            </h3>
          </div>

          <strong>
            {progress}%
          </strong>
        </div>

        <div className="mc-goal-progress-bar">
          <div
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mc-goal-stats">
          <div>
            <span>Current CIE</span>
            <strong>{currentCIE}</strong>
          </div>

          <div>
            <span>Target CIE</span>
            <strong>
              {targetCIE || "—"}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{status}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}