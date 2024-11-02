const nodemailer = require("nodemailer");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const transporter = require("../utils/mailer");

const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    taskData.authorApproval = []; 
    const tasksCollection = getDB("lab-scheduler").collection("tasks");
    const machinesCollection = getDB("lab-scheduler").collection("machines");
    const taskMachines = taskData.selectedMachine;

    try {
      const machines = await machinesCollection.find({
          title: { $in: taskMachines } // Replace 'title' with the actual field name
      }).toArray();
      {
        taskData.sendApproval
          ? (taskData.approve = "Pending")
          : (taskData.approve = "Approved");
      }
      const result = await tasksCollection.insertOne(taskData);
      
      if (taskData.sendApproval) {
        taskData.approve = "Pending";
        const taskId = result.insertedId;
        const sendEmailToAuthor = async (authorEmail, machine) => {
          const approveLink = `https://lab-scheduler-tau.vercel.app/tasks/approve/${taskId}?author=${authorEmail}`;
          const rejectLink = `https://lab-scheduler-tau.vercel.app/tasks/reject/${taskId}?author=${authorEmail}`;
          const mailOptions = {
            from: `${process.env.USER_EMAIL}`,
            to: authorEmail,
            subject: `Approval Request for ${machine.title}`,
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
                    <p><span>Email:</span> ${taskData.createdBy}</p>
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
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${authorEmail} for ${machine.title}`);
          } catch (error) {
            console.error(`Failed to send email to ${authorEmail}:`, error);
          }
        };
        const emailPromises = machines.map(async (machine) => {
          if (machine.author) {
            taskData.authorApproval.push({ author: machine.author, status: "Pending" });
            await sendEmailToAuthor(machine.author, machine);
          }
        });
      
        try {
          await Promise.all(emailPromises);
          await tasksCollection.updateOne(
            { _id: taskId },
            { $set: { authorApproval: taskData.authorApproval } }
          );
          res.status(200).json({
            success: true,
            data: { _id: result.insertedId, ...taskData },
            message: "Task created and emails sent.",
          });
        } catch (error) {
          console.error("Failed to send all emails:", error);
          res.status(500).json({
            success: false,
            message: "Task created but failed to send some emails",
            error: error.message,
          });
        }
      }
      else {
        const studentMailOptions = {
          from: `${process.env.USER_EMAIL}`,
          to: `${taskData?.createdBy}`,
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
      console.error("Error fetching machines:", error);
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
    const { author } = req.body;
    
    const tasksCollection = getDB("lab-scheduler").collection("tasks");


    const taskData = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });
    
    if (!taskData) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }


    const authorApprovalIndex = taskData.authorApproval.findIndex(
      (approval) => approval.author === author
    );

    if (authorApprovalIndex === -1) {
      return res.status(404).json({ success: false, message: "Author not found in author approvals" });
    }

    if (taskData.authorApproval[authorApprovalIndex].status !== "Approved") {
      taskData.authorApproval[authorApprovalIndex].status = "Approved";

     await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { authorApproval: taskData.authorApproval } }
      );
    }

    // Check if all author approvals are "Approved"
    const allApproved = taskData.authorApproval.every(
      (approval) => approval.status === "Approved"
    );

    if (allApproved) {
      // Update the overall task approval status to "Approved"
      await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { approve: "Approved" } }
      );

      const studentMailOptions = {
        from: `${process.env.USER_EMAIL}`,
        to: `${taskData?.createdBy}`,
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
                   <p><span>Courses:</span> ${taskData.selectedCourse.join(", ")}</p>
                   <p><span>Machine:</span> ${taskData?.selectedMachine?.map(machine => machine.title).join(", ")}</p>
                   <p><span>Estimated Time Required:</span> ${taskData.estimatedTime}</p>
                  <p><span>Scheduled Date:</span> ${new Date(taskData.startDate).toLocaleString()}</p>
                  <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(", ")}</p>
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
      return res.status(200).json({
        success: true,
        message: "Author approval updated, but task not fully approved yet.",
      });
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
    const { author } = req.body;

    const tasksCollection = getDB("lab-scheduler").collection("tasks");

    // Fetch the task from the database
    const taskData = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
    });

    if (!taskData) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Find the index of the author in authorApproval
    const authorApprovalIndex = taskData.authorApproval.findIndex(
      (approval) => approval.author === author
    );

    if (authorApprovalIndex === -1) {
      return res.status(404).json({ success: false, message: "Author not found in author approvals" });
    }

    // Check if the author's status is already set to "Rejected"
    if (taskData.authorApproval[authorApprovalIndex].status !== "Rejected") {
      // Update the specific author's approval status to "Rejected"
      taskData.authorApproval[authorApprovalIndex].status = "Rejected";

      // Update the database with the modified authorApproval array
      await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        {
          $set: {
            authorApproval: taskData.authorApproval,
            approve: "Rejected",
          },
        }
      );

      const studentMailOptions = {
        from: `${process.env.USER_EMAIL}`,
        to: `${taskData?.createdBy}`,
        subject: "Task Rejection Notification",
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
              .header { text-align: center; background-color: #dc3545; padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; color: #ffffff; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 20px; line-height: 1.6; }
              .task-details { background-color: #f9f9f9; padding: 10px; border-radius: 6px; margin-top: 15px; }
              .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #888888; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>Task Rejected</h1>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>We regret to inform you that the task you scheduled has been rejected.</p>
                <p>Please find the details below:</p>
                <div class="task-details">
                  <p><span>Task Name:</span> ${taskData.taskName}</p>
                  <p><span>Courses:</span> ${taskData.selectedCourse.join(", ")}</p>
                  <p><span>Machine:</span> ${taskData?.selectedMachine?.map(machine => machine.title).join(", ")}</p>
                  <p><span>Estimated Time Required:</span> ${taskData.estimatedTime}</p>
                  <p><span>Scheduled Date:</span> ${new Date(taskData.startDate).toLocaleString()}</p>
                  <p><span>Time Slots:</span> ${taskData.selectedTimeSlots.join(", ")}</p>
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
          message: "Task rejected and email sent.",
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Task rejected, but failed to send email",
          error: emailError.message,
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        message: "Author rejection already recorded.",
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
  const username = req.query.username;

  let filter = {};

  if (username) {
    filter = { createdBy: username };
  }

  try {
    const tasksCollection = getDB("lab-scheduler").collection("tasks");
    const result = await tasksCollection
      .find(filter) // Apply the filter (either empty or with username)
      .sort({ _id: -1 }) // Sort by ID in descending order
      .toArray();

    res.status(200).json({
      success: true,
      data: result,
      message: "Tasks retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
      message: error.message,
    });
  }
};
const removeTasks = async (req, res) => {
  const taskId = req.params.id; // Assume the task ID is sent as a route parameter

  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: "Task ID is required",
    });
  }

  try {
    const tasksCollection = getDB("lab-scheduler").collection("tasks");
    
    // Use the deleteOne method to remove the task
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(taskId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task removed successfully",
    });
  } catch (error) {
    console.error("Error removing task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove task",
      message: error.message,
    });
  }
};


module.exports = {
  getTasks,
  createTask,
  approveTask,
  rejectTask,
  removeTasks,
};
