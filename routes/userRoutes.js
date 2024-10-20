const express = require("express");
const { upsertUser, loginUser } = require("../controllers/userController");

const router = express.Router();

router.post("/users", upsertUser);

router.post("/login", loginUser);

module.exports = router;
