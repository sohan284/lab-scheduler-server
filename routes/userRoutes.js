const express = require("express");
const {
  upsertUser,
  loginUser,
  removeUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/users", upsertUser);

router.post("/login", loginUser);

router.delete("/users/:username", removeUser);

module.exports = router;
