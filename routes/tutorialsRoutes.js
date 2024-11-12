const express = require("express");
const {  getTutorials, updateTutorial, deleteTutorial, createTutorial } = require("../controllers/tutorialController");

const router = express.Router();

router.post("/tutorials", createTutorial);
router.get("/tutorials", getTutorials);
router.put("/tutorials/:id", updateTutorial);
router.delete("/tutorials/:id", deleteTutorial);

module.exports = router;