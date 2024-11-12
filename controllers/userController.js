const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDB } = require("../config/db");
const transporter = require("../utils/mailer");
const saltRounds = 10; // You can adjust this number for more security but it will affect performance.
const crypto = require("crypto");
let otpStore = {};
const sendOtp = async (req, res) => {
  const { email, purpose } = req.body;
  const usersCollection = getDB("lab-scheduler").collection("users");
  
  const existingUser = await usersCollection.findOne({ username: email });

  if (purpose === "signup" && existingUser) {
    return res.status(409).json({
      success: false,
      message: "Username already exists",
    });
  }

  if (purpose === "forgotPassword" && !existingUser) {
    return res.status(404).json({
      success: false,
      message: "User does not exist",
    });
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  // Store the OTP with a timestamp
  otpStore[email] = { otp, createdAt: Date.now() };

  const mailOptions = {
    from: "sr.sohan088@gmail.com",
    to: email,
    subject: "Your OTP Code",
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          text-align: center;
        }
        .container {
          border: 2px solid black;
          border-radius: 10px;
          padding: 30px;
          max-width: 600px;
          margin: auto;
        }
        h2 {
          font-size: 24px;
          margin-bottom: 20px;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        .otp-digit {
          border: 3px solid #4a90e2;
          border-radius: 5px;
          padding: 15px;
          margin: 0 5px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background-color: #e1f5fe;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your OTP Code</h2>
        <div class="otp-code">${otp}</div>
        <p>Your OTP code is valid for <strong>2 minutes</strong>.</p>
        <p>Thank you for using our service!</p>
        <div class="footer">&copy; ${new Date().getFullYear()} All rights reserved.</div>
      </div>
    </body>
    </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res
      .status(400)
      .json({ success: false, message: "No OTP sent or expired" });
  }

  const storedOtpData = otpStore[email];
  const otpCreatedAt = storedOtpData.createdAt;

  if (Date.now() - otpCreatedAt > 2 * 60 * 1000) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  delete otpStore[email];

  res.status(200).json({ success: true, message: "OTP verified successfully" });
};
const upsertUser = async (req, res) => {
  try {
    const usersCollection = getDB("lab-scheduler").collection("users");
    const { username, password, role, createdAt } = req.body;

    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      // Update only the password if it exists, without altering other fields
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const updateDoc = { $set: { password: hashedPassword } };

      const result = await usersCollection.updateOne(
        { username },
        updateDoc
      );

      const token = jwt.sign({ username }, `${process.env.JWT_SECRET}`, {
        expiresIn: "1h",
      });

      return res.status(200).json({
        success: true,
        data: result,
        token,
        message: "Password updated successfully",
      });
    }

    // Hash the password before saving for a new user
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const filter = { username };
    const options = { upsert: true };

    // Only add fields if they are provided
    const updateDoc = {
      $set: {
        username,
        password: hashedPassword,
        ...(role && { role }),
        ...(createdAt && { createdAt }),
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc, options);

    const token = jwt.sign({ username }, `${process.env.JWT_SECRET}`, {
      expiresIn: "1h",
    });

    res.status(200).json({
      success: true,
      data: result,
      token,
      message: "User upserted successfully",
    });
  } catch (error) {
    console.error("Error upserting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upsert user",
      message: error.message,
    });
  }
};


const loginUser = async (req, res) => {
  const { username, password } = req.body;
  const usersCollection = getDB("lab-scheduler").collection("users");

  try {
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid User" });
    }

    // Compare the hashed password with the provided password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      `${process.env.JWT_SECRET}`,
      { expiresIn: "30d" }
    );

    res.status(200).json({ token, message: "Login successful", success: true });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log in user",
      message: error.message,
    });
  }
};
const getUsers = async (req, res) => {
  try {
    const usersCollection = getDB("lab-scheduler").collection("users");
    const result = await usersCollection.find().sort({ _id: -1 }).toArray();
    res.status(200).json({
      success: true,
      data: result,
      message: "User retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching User:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch User",
      message: error.message,
    });
  }
};
const updateUser = async (req, res) => {
  const username = req.params.username; // Get the username from the request parameters
  const { role } = req.body; // Extract the updated role from the request body

  if (!role) {
    return res.status(400).json({
      success: false,
      message: "Role is required to update the user",
    });
  }
  

  try {
    const usersCollection = getDB("lab-scheduler").collection("users");

    // Check if the user exists
    const existingUser = await usersCollection.findOne({ username });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update the user's role
    const result = await usersCollection.updateOne(
      { username },
      { $set: { role } } // Only update the role
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes made to the user",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
      message: error.message,
    });
  }
};

const removeUser = async (req, res) => {
  const username = req.params.username;
  try {
    const db = getDB("lab-scheduler");
    const tasksCollection = db.collection("tasks");
    const usersCollection = db.collection("users");

    await tasksCollection.deleteMany({ createdBy: username });

    const result = await usersCollection.deleteOne({ username: username });

    if (result.deletedCount === 1) {
      res.status(200).json({
        success: true,
        message: "Account and associated tasks deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }
  } catch (error) {
    console.error("Error deleting account and tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account and tasks",
      error: error.message,
    });
  }
};

module.exports = {
  upsertUser,
  loginUser,
  removeUser,
  sendOtp,
  verifyOtp,
  getUsers,
  updateUser,
};
