const nodemailer = require("nodemailer");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const transporter = nodemailer.createTransport({
  service: "gmail", // Or any email service you prefer
  auth: {
    user: "sr.sohan088@gmail.com", // Your email
    pass: "imrd iusu ynkc yqca", // Your email password
  },
});

const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    const tasksCollection = getDB("lab-scheduler").collection("tasks");

    // Insert task into the database
    const result = await tasksCollection.insertOne(taskData);

    // Generate approval and rejection links
    const taskId = result.insertedId;
    const approveLink = `https://lab-scheduler-tau.vercel.app/tasks/approve/${taskId}`;
    const rejectLink = `https://lab-scheduler-tau.vercel.app/tasks/reject/${taskId}`;

    // Send an email with accept and reject links
    const mailOptions = {
      from: "sr.sohan088@gmail.com",
      to: "sr.sohan088@gmail.com", // Your email
      subject: "New Task Assigned - Accept or Reject",
      html: `
        <p>A new task has been created. Please review and respond:</p>
        <p>Task Title: ${taskData.taskName}</p>
        <p>
          <a href="${approveLink}">Accept Task</a> | 
          <a href="${rejectLink}">Reject Task</a>
        </p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending task creation email:", error);
        return res.status(500).json({
          success: false,
          message: "Task created but failed to send email",
          error: error.message,
        });
      }

      res.status(201).json({
        success: true,
        data: { _id: result.insertedId, ...taskData },
        message: "Task created and email sent.",
      });
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
const approveTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const tasksCollection = getDB("lab-scheduler").collection("tasks");

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { approve: "Approved" } }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({
      success: true,
      message: "Task approved successfully.",
    });
  } catch (error) {
    console.error("Error approving task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve task",
      error: error.message,
    });
  }
};
const rejectTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const tasksCollection = getDB("lab-scheduler").collection("tasks");

    // Update the task's approved status to false instead of deleting it
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { approve: "Rejected" } }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({
      success: true,
      message: "Task rejected successfully.",
    });
  } catch (error) {
    console.error("Error rejecting task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject task",
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
  approveTask,
  rejectTask,
};
