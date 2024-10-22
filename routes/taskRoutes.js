const express = require("express");
const {
  getTasks,
  createTask,
  approveTask,
  rejectTask,
} = require("../controllers/taskController");

const router = express.Router();

router.get("/scheduledtasks", getTasks);
router.post("/scheduledtasks", createTask);

router.put("/tasks/approve/:id", approveTask);
router.put("/tasks/reject/:id", rejectTask);

module.exports = router;
