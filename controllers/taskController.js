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
    {
      taskData.sendApproval
        ? (taskData.approve = "Pending")
        : (taskData.approve = "Approved");
    }
    const result = await tasksCollection.insertOne(taskData);
    if (taskData.sendApproval) {
      taskData.approve = "Pending";
      const taskId = result.insertedId;
      const approveLink = `https://lab-scheduler-tau.vercel.app/tasks/approve/${taskId}`;
      const rejectLink = `https://lab-scheduler-tau.vercel.app/tasks/reject/${taskId}`;

      const facultyMailOptions = {
        from: `${process.env.USER_EMAIL}`,
        to: `${process.env.TO_EMAIL}`,
        subject: "Student Requires Approval to Use HP Indigo",
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
                <p>A new task has been scheduled </p>
    
                <div class="task-details">
                  <p><span>Email:</span> ${taskData.taskCratedBy}</p>
                  <p><span>Scheduled Date:</span> ${new Date(
                    taskData.startDate
                  ).toLocaleString()}</p>
                  <p><span>Time:</span> ${taskData.estimatedTime}</p>
                  <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(
                    ", "
                  )}</p>
                </div>
    
                <p>Please click one of the buttons below to accept or reject the task:</p>
                <div class="cta-buttons">
                  <a href="${approveLink}" class="accept">Approve</a>
                  <a href="${rejectLink}" class="reject">Deny</a>
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
        await transporter.sendMail(facultyMailOptions);
        res.status(200).json({
          success: true,
          data: { _id: result.insertedId, ...taskData },
          message: "Task created and email sent.",
        });
      } catch (error) {
        console.error("Failed to send email:", error);
        res.status(500).json({
          success: false,
          message: "Task created but failed to send email",
          error: error.message,
        });
      }
    } else {
      const studentMailOptions = {
        from: `${process.env.USER_EMAIL}`,
        to: `sr.sohan088@gmail.com`,
        subject: "Task Scheduled Successfully",
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
                background-color: #28a745;
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
                <h1>Task Scheduled Successfully</h1>
              </div>
              <div class="content">
                 <p>Hi there,</p>
                 <p>We're excited to let you know that you have successfully scheduled a new task! 🎉</p>
  <p>Please find the details below:</p>
                <div class="task-details">
                  <p><span>Task Name:</span> ${taskData.taskName}</p>
                   <p><span>Courses:</span> ${taskData.selectedCourse.join(
                     ", "
                   )}</p>
                   <p><span>Machine:</span> ${taskData.selectedMachine.join(
                     ", "
                   )}</p>
                   <p><span>Estimated Time Required:</span> ${
                     taskData.estimatedTime
                   }</p>
                  <p><span>Scheduled Date:</span> ${new Date(
                    taskData.startDate
                  ).toLocaleString()}</p>
                  <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(
                    ", "
                  )}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      try {
        await transporter.sendMail(studentMailOptions);
        res.status(200).json({
          success: true,
          data: { _id: result.insertedId, ...taskData },
          message: "Task created and email sent.",
        });
      } catch (error) {
        console.error("Failed to send email:", error);
        res.status(500).json({
          success: false,
          message: "Task created but failed to send email",
          error: error.message,
        });
      }
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

    const taskData = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });

    if (!taskData) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Change status only if it's "Pending"
    if (taskData.approve === "Pending") {
      await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { approve: "Approved" } }
      );

      const studentMailOptions = {
        from: `${process.env.USER_EMAIL}`,
        to: `sr.sohan088@gmail.com`, // Consider using taskData.email or a variable for dynamic emails
        subject: "Task Scheduled Successfully",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Task Notification</title>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0; }
              .header { text-align: center; background-color: #28a745; padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; color: #ffffff; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 20px; line-height: 1.6; }
              .task-details { background-color: #f9f9f9; padding: 10px; border-radius: 6px; margin-top: 15px; }
              .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #888888; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>Task Scheduled Successfully</h1>
              </div>
              <div class="content">
                 <p>Hi there,</p>
                 <p>We're excited to let you know that you have successfully scheduled a new task! 🎉</p>
                 <p>Please find the details below:</p>
                <div class="task-details">
                  <p><span>Task Name:</span> ${taskData.taskName}</p>
                   <p><span>Courses:</span> ${taskData.selectedCourse.join(
                     ", "
                   )}</p>
                   <p><span>Machine:</span> ${taskData.selectedMachine.join(
                     ", "
                   )}</p>
                   <p><span>Estimated Time Required:</span> ${
                     taskData.estimatedTime
                   }</p>
                  <p><span>Scheduled Date:</span> ${new Date(
                    taskData.startDate
                  ).toLocaleString()}</p>
                  <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(
                    ", "
                  )}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      try {
        await transporter.sendMail(studentMailOptions);
        return res.status(200).json({
          success: true,
          message: "Task approved successfully and email sent.",
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Task approved, but failed to send email",
          error: emailError.message,
        });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Task must be Pending to approve." });
    }
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

    const taskData = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });

    if (!taskData) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Change status only if it's "Pending"
    if (taskData.approve === "Pending") {
      await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { approve: "Rejected" } }
      );

      const studentMailOptions = {
        from: `${process.env.USER_EMAIL}`,
        to: taskData.taskCratedBy, // Use the creator's email from taskData
        subject: "Task Scheduled Denied",
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
                border: 1px solid #e0e0e0;
              }
              .header {
                text-align: center;
                background-color: #dc3545; /* Red color for rejection */
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
                <h1>Task Rejected</h1>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>Thank you for your submission. After careful consideration, we regret to inform you that your task has not been approved at this time.</p>
                <p>If you have any questions or need further clarification, please don’t hesitate to reach out. We appreciate your understanding and encourage you to submit again in the future.</p>
                <div class="task-details">
                  <p><span>Task Name:</span> ${taskData.taskName}</p>
                  <p><span>Courses:</span> ${taskData.selectedCourse.join(
                    ", "
                  )}</p>
                  <p><span>Machine:</span> ${taskData.selectedMachine.join(
                    ", "
                  )}</p>
                  <p><span>Estimated Time Required:</span> ${
                    taskData.estimatedTime
                  }</p>
                  <p><span>Scheduled Date:</span> ${new Date(
                    taskData.startDate
                  ).toLocaleString()}</p>
                  <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(
                    ", "
                  )}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      try {
        await transporter.sendMail(studentMailOptions);
        console.log("Rejection email sent successfully.");
      } catch (error) {
        console.error("Failed to send rejection email:", error);
        return res.status(500).json({
          success: false,
          message: "Task rejected, but failed to send rejection email",
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Task rejected successfully.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Task must be Pending to reject.",
      });
    }
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
