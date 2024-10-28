const express = require("express");
const {
  createMachine,
  getMachines,
  deleteMachine,
} = require("../controllers/machineController");

const router = express.Router();

router.post("/machines", createMachine);
router.get("/machines", getMachines);
router.put("/machines/:id", updateMachine);
router.delete("/machines/:id", deleteMachine);

module.exports = router;
