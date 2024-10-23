const nodemailer = require("nodemailer");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const transporter = nodemailer.createTransport({
  service: "gmail", // Or any email service you prefer
  auth: {
    user: `${process.env.USER_EMAIL}`,
    pass: `${process.env.EMAIL_KEY}`,
  },
});

const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    const tasksCollection = getDB("lab-scheduler").collection("tasks");
    const result = await tasksCollection.insertOne(taskData);

    const taskId = result.insertedId;
    const approveLink = `https://lab-scheduler-tau.vercel.app/tasks/approve/${taskId}`;
    const rejectLink = `https://lab-scheduler-tau.vercel.app/tasks/reject/${taskId}`;

    const mailOptions = {
      from: `${process.env.USER_EMAIL}`,
      to: `${process.env.TO_EMAIL}`,
      subject: "New Task Assigned - Accept or Reject",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Notification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              border: 1px solid #e0e0e0; /* Added border for the body */
            }
            .header {
              text-align: center;
              background-color: #007bff;
              padding: 15px;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
              color: #ffffff;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              line-height: 1.6;
            }
            .content p {
              margin: 0 0 10px;
              font-size: 16px;
            }
            .task-details {
              background-color: #f9f9f9;
              padding: 10px;
              border-radius: 6px;
              margin-top: 15px;
            }
            .task-details p {
              margin: 5px 0;
              font-size: 15px;
            }
            .task-details span {
              font-weight: bold;
            }
            .cta-buttons {
              margin-top: 20px;
              text-align: center;
            }
            .cta-buttons a {
              text-decoration: none;
              padding: 12px 20px;
              border-radius: 5px;
              font-size: 16px;
              color: #ffffff;
              margin: 0 10px;
              display: inline-block;
              transition: background-color 0.3s ease; /* Smooth hover transition */
            }
            .cta-buttons a.accept {
              background-color: #28a745;
              border: 1px solid #28a745;
            }
            .cta-buttons a.reject {
              background-color: #dc3545;
              border: 1px solid #dc3545;
            }
            /* Hover effects for the buttons */
            .cta-buttons a.accept:hover {
              background-color: #218838;
            }
            .cta-buttons a.reject:hover {
              background-color: #c82333;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>New Task Assigned</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A new task has been created and assigned to you. Please review the task details below:</p>
    
              <div class="task-details">
                <p><span>Task Name:</span> ${taskData.taskName}</p>
                <p><span>Course:</span> ${taskData.course}</p>
                <p><span>Start Date:</span> ${new Date(
                  taskData.startDate
                ).toLocaleString()}</p>
                <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(
                  ", "
                )}</p>
                <p><span>Estimated Time:</span> ${taskData.estimatedTime}</p>
                <p><span>Task Created By:</span> ${taskData.taskCratedBy}</p>
              </div>
    
              <p>Please click one of the buttons below to accept or reject the task:</p>
              <div class="cta-buttons">
                <a href="${approveLink}" class="accept">Accept Task</a>
                <a href="${rejectLink}" class="reject">Reject Task</a>
              </div>
            </div>
            <div class="footer">
              <p>If you have any questions, please contact the administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({
        success: true,
        data: { _id: result.insertedId, ...taskData },
        message: "Task created and email sent.",
      });
    } catch (error) {
      console.error("Failed to send OTP:", error);
      res.status(500).json({
        success: false,
        message: "Task created but failed to send email",
        error: error.message,
      });
    }
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
    const result = await tasksCollection.find().sort({ _id: -1 }).toArray();

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
