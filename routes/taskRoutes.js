const express = require("express");
const {
  getTasks,
  createTask,
  approveTask,
  rejectTask,
  removeTasks,
} = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware"); 

const router = express.Router();

router.get("/scheduledtasks", authMiddleware,getTasks);
router.post("/scheduledtasks", createTask);
router.delete('/tasks/:id',authMiddleware,removeTasks)

router.put("/tasks/approve/:id", approveTask);
router.put("/tasks/reject/:id", rejectTask);

module.exports = router;
