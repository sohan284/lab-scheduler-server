const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");

const upsertUser = async (req, res) => {
  try {
    const usersCollection = getDB("lab-scheduler").collection("users");

    const { username, password } = req.body;

    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      // If the user already exists, send a response with the appropriate message
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const filter = { username }; // Filter to find user by username
    const options = { upsert: true }; // Upsert option to insert if not found

    const updateDoc = {
      $set: {
        username,
        password,
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc, options);

    const token = jwt.sign(
      { username: username },
      `${process.env.JWT_SECRET}`,
      { expiresIn: "1h" }
    );

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
    console.log(user);

    if (!user) {
      return res.status(401).json({ message: "Invalid User" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
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
const removeUser = async (req, res) => {
  const username = req.params.username;
  try {
    const db = getDB("lab-scheduler");
    const tasksCollection = db.collection("tasks");
    const usersCollection = db.collection("users");

    await tasksCollection.deleteMany({ taskCratedBy: username });

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
};
