const { getDB } = require("../config/db");

const getTasks = async (req, res) => {
  try {
    const db = getDB();
    const tasks = await db.collection("tasks").find({}).toArray();

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
const createTask = async (req, res) => {
  try {
    const {
      taskName,
      course,
      startDate,
      selectedTimeSlots,
      selectedMachine,
      email,
    } = req.body;

    if (!Array.isArray(selectedTimeSlots) || selectedTimeSlots.length === 0) {
      return res
        .status(400)
        .json({ message: "Selected time slots are required." });
    }
    const db = getDB();
    await db.collection("tasks").insertOne({
      taskName,
      course,
      startDate,
      selectedTimeSlots,
      selectedMachine,
      email,
    });

    res.status(201).json({ message: "Task scheduled successfully!" });
  } catch (error) {
    console.error("Error scheduling task:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
};
