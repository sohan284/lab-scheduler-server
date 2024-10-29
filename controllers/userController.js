const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDB } = require("../config/db");
const transporter = require("../utils/mailer");
const saltRounds = 10; // You can adjust this number for more security but it will affect performance.
const crypto = require("crypto");
let otpStore = {};
const sendOtp = async (req, res) => {
  const { email } = req.body;
  const usersCollection = getDB("lab-scheduler").collection("users");
  const existingUser = await usersCollection.findOne({ username: email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Username already exists",
    });
  }
  const otp = crypto.randomInt(100000, 999999).toString();

  otpStore[email] = { otp, createdAt: Date.now() };

  const mailOptions = {
    from: "srsohan284@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It is valid for 2 minutes.`,
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
    const { username, password, role } = req.body;

    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const filter = { username };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        username,
        password: hashedPassword,
        role,
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
      { expiresIn: "1h" }
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
