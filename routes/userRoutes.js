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
const authMiddleware = require("../middleware/authMiddleware"); 
const router = express.Router();

router.post("/users", upsertUser); 
router.get("/users", authMiddleware, getUsers); 

router.post("/login", loginUser);
router.post("/login/send-otp", sendOtp);
router.post("/login/verify-otp", verifyOtp);


router.delete("/users/:username", authMiddleware, removeUser); 
router.put("/users/:username", authMiddleware, updateUser);
module.exports = router;
