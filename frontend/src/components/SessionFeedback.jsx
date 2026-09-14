import { useState } from "react";
import api from "../api";

export default function SessionFeedback({
  session,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submitFeedback = async () => {
    if (!rating) {
      setMessage("Please select a rating.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await api.feedback.create({
        sessionId: session._id || session.id,
        rating,
        comment,
      });

      setMessage(
        "Thank you! Your feedback was submitted."
      );

      setRating(0);
      setComment("");

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to submit feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-feedback-box">
      <h3>Rate this mentoring session</h3>

      <div className="mc-feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="mc-star-button"
            onMouseEnter={() =>
              setHoverRating(star)
            }
            onMouseLeave={() =>
              setHoverRating(0)
            }
            onClick={() =>
              setRating(star)
            }
          >
            {star <=
            (hoverRating || rating)
              ? "★"
              : "☆"}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        placeholder="Share your feedback about this session..."
        maxLength={500}
      />

      <button
        type="button"
        onClick={submitFeedback}
        disabled={loading}
      >
        {loading
          ? "Submitting..."
          : "Submit Feedback"}
      </button>

      {message && (
        <p className="mc-feedback-message">
          {message}
        </p>
      )}
    </div>
  );
}