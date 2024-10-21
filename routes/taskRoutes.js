const express = require("express");
const { getTasks, createTask } = require("../controllers/taskController");

const router = express.Router();

router.get("/scheduledtasks", getTasks);
router.post("/scheduledtasks", createTask);

module.exports = router;
