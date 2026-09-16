import Task from "../models/Task.js";

export async function createTask(req, res, next) {
  try {
    const {
      title,
      due,
      owner,
      priority,
      done,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = await Task.create({
      title,
      due: due || "",
      owner: owner || req.user.name,
      priority: priority || "Medium",
      done: Boolean(done),
      user: req.user._id,
    });

    return res.status(201).json({
      ...task.toObject(),
      id: task._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        title: req.body.title,
        due: req.body.due,
        owner: req.body.owner,
        priority: req.body.priority,
        done: req.body.done,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.json({
      ...task.toObject(),
      id: task._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    next(error);
  }
}