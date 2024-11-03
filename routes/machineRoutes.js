const express = require("express");
const {
  createMachine,
  getMachines,
  deleteMachine,
  updateMachine,
} = require("../controllers/machineController");
const authMiddleware = require("../middleware/authMiddleware"); 
const router = express.Router();

router.post("/machines", createMachine);
router.get("/machines", authMiddleware,getMachines);
router.put("/machines/:id", updateMachine);
router.delete("/machines/:id",authMiddleware, deleteMachine);

module.exports = router;
