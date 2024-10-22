const { getDB } = require("../config/db");

const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    const tasksCollection = getDB("lab-scheduler").collection("tasks");
    const result = await tasksCollection.insertOne(taskData);
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...taskData },
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasksCollection = getDB("lab-scheduler").collection("tasks");
    const result = await tasksCollection.find().toArray();

    res?.status(200).json({
      success: true,
      data: result,
      message: "Task retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res?.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
      message: error.message,
    });
  }
};
module.exports = {
  getTasks,
  createTask,
};
