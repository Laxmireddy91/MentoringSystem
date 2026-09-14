import StudentGoal from "../models/StudentGoal.js";

function calculateStatus(currentCIE, targetCIE) {
  if (currentCIE >= targetCIE) {
    return "Achieved";
  }

  if (currentCIE >= targetCIE * 0.8) {
    return "On Track";
  }

  return "Needs Improvement";
}

export async function getMyGoal(req, res) {
  try {
    const goal = await StudentGoal.findOne({
      student: req.user._id,
    });

    if (!goal) {
      return res.json(null);
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

export async function createOrUpdateGoal(req, res) {
  try {
    const {
      targetCIE,
      goal,
      currentCIE = 0,
    } = req.body;

    if (
      targetCIE === undefined ||
      !goal?.trim()
    ) {
      return res.status(400).json({
        message:
          "Target CIE and goal are required",
      });
    }

    const numericTarget = Number(targetCIE);
    const numericCurrent = Number(currentCIE);

    if (
      !Number.isFinite(numericTarget) ||
      numericTarget < 0 ||
      numericTarget > 100
    ) {
      return res.status(400).json({
        message:
          "Target CIE must be between 0 and 100",
      });
    }

    if (
      !Number.isFinite(numericCurrent) ||
      numericCurrent < 0 ||
      numericCurrent > 100
    ) {
      return res.status(400).json({
        message:
          "Current CIE must be between 0 and 100",
      });
    }

    const status = calculateStatus(
      numericCurrent,
      numericTarget
    );

    const savedGoal =
      await StudentGoal.findOneAndUpdate(
        {
          student: req.user._id,
        },
        {
          student: req.user._id,
          targetCIE: numericTarget,
          goal: goal.trim(),
          currentCIE: numericCurrent,
          status,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.json(savedGoal);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

export async function deleteMyGoal(req, res) {
  try {
    await StudentGoal.findOneAndDelete({
      student: req.user._id,
    });

    res.json({
      message: "Goal deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}