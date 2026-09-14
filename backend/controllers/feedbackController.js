import Feedback from "../models/Feedback.js";
import Session from "../models/Session.js";

/*
|--------------------------------------------------------------------------
| Create Feedback
|--------------------------------------------------------------------------
| Student submits a rating and optional comment for a session.
*/
export const createFeedback = async (req, res, next) => {
  try {
    const { sessionId, rating, comment } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session is required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    const existingFeedback = await Feedback.findOne({
      session: sessionId,
      student: req.user._id,
    });

    if (existingFeedback) {
      return res.status(409).json({
        message: "You have already submitted feedback for this session",
      });
    }

    const feedback = await Feedback.create({
      session: sessionId,
      student: req.user._id,
      mentor: session.createdBy,
      rating,
      comment: comment || "",
    });

    const populatedFeedback = await Feedback.findById(
      feedback._id
    )
      .populate("student", "name email")
      .populate("mentor", "name email")
      .populate("session", "title date time");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: populatedFeedback,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| Get Feedback For Session
|--------------------------------------------------------------------------
*/
export const getSessionFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({
      session: req.params.sessionId,
    })
      .populate("student", "name email")
      .populate("mentor", "name email")
      .populate("session", "title date time")
      .sort({ createdAt: -1 });

    res.json({
      feedback,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| Get Mentor Feedback
|--------------------------------------------------------------------------
*/
export const getMentorFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({
      mentor: req.params.mentorId,
    })
      .populate("student", "name email")
      .populate("session", "title date time")
      .sort({ createdAt: -1 });

    const totalRatings = feedback.length;

    const averageRating =
      totalRatings === 0
        ? 0
        : feedback.reduce(
            (sum, item) => sum + item.rating,
            0
          ) / totalRatings;

    res.json({
      feedback,
      totalRatings,
      averageRating: Number(
        averageRating.toFixed(2)
      ),
    });
  } catch (error) {
    next(error);
  }
};