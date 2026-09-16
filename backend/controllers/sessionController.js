import Session from "../models/Session.js";
import Notification from "../models/Notification.js";

export async function createSession(req, res, next) {
  try {
    const {
      title,
      date,
      time,
      owner,
      status,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        message: "Session title and date are required",
      });
    }

    const session = await Session.create({
      title,
      date,
      time: time || "",
      owner: owner || req.user.name,
      status: status || "Scheduled",
      createdBy: req.user._id,
    });

    // Create notification for a newly scheduled session
    await Notification.create({
      title: "New Mentoring Session",
      text: `A mentoring session "${session.title}" has been scheduled for ${session.date}.`,
      type: "session",
      user: null,
    });

    return res.status(201).json({
      ...session.toObject(),
      id: session._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}
export async function updateSession(req, res, next) {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        date: req.body.date,
        time: req.body.time,
        owner: req.body.owner,
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    return res.json({
      ...session.toObject(),
      id: session._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const session = await Session.findByIdAndDelete(
      req.params.id
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    return res.json({
      success: true,
      message: "Session cancelled",
    });
  } catch (error) {
    next(error);
  }
}