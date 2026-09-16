import Mentor from "../models/Mentor.js";

function cleanMentorPayload(body = {}) {
  const allowed = [
    "mentorId",
    "name",
    "students",
    "performance",
    "lastActive",
    "status",
    "email",
  ];

  const payload = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }

  return payload;
}

export async function createMentor(req, res, next) {
  try {
    const payload = cleanMentorPayload(req.body);

    const mentor = await Mentor.create({
      ...payload,
      mentorId:
        payload.mentorId ||
        `M${Date.now().toString().slice(-6)}`,
    });

    return res.status(201).json({
      ...mentor.toObject(),
      id: mentor._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMentor(req, res, next) {
  try {
    const payload = cleanMentorPayload(req.body);

    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found",
      });
    }

    return res.json({
      ...mentor.toObject(),
      id: mentor._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMentor(req, res, next) {
  try {
    const mentor = await Mentor.findByIdAndDelete(
      req.params.id
    );

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found",
      });
    }

    return res.json({
      success: true,
      message: "Mentor deleted",
    });
  } catch (error) {
    next(error);
  }
}