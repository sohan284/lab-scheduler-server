const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");

const upsertUser = async (req, res) => {
  try {
    const usersCollection = getDB("lab-scheduler").collection("users");

    const { username, password } = req.body; // Only username and password are required

    const filter = { username }; // Filter to find user by username
    const options = { upsert: true }; // Upsert option to insert if not found

    const updateDoc = {
      $set: {
        username,
        password, // Update password or set it if inserting a new user
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc, options);
    const token = jwt.sign(
      {
        username: username,
      },
      "uijlkasfipwekflsakjdfjoierwjfkjsdaflkasfiuewopifj", // Secret key stored in env variables
      { expiresIn: "1h" } // Token expiry time
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
      "uijlkasfipwekflsakjdfjoierwjfkjsdaflkasfiuewopifj",
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

module.exports = {
  upsertUser,
  loginUser,
};
