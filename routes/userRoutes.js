const express = require("express");
const {
  upsertUser,
  loginUser,
  removeUser,
  sendOtp,
  verifyOtp,
} = require("../controllers/userController");

const router = express.Router();

router.post("/users", upsertUser);

router.post("/login", loginUser);
router.post("/login/send-otp", sendOtp);
router.post("/login/verify-otp", verifyOtp);

router.delete("/users/:username", removeUser);

module.exports = router;
