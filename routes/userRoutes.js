const express = require("express");
const {
  upsertUser,
  loginUser,
  removeUser,
  sendOtp,
  verifyOtp,
  getUsers,
  updateUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/users", upsertUser);
router.get("/users", getUsers);

router.post("/login", loginUser);
router.post("/login/send-otp", sendOtp);
router.post("/login/verify-otp", verifyOtp);

router.delete("/users/:username", removeUser);
router.put("/users/:username", updateUser);

module.exports = router;
