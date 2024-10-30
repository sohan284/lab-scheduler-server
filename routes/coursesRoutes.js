const express = require("express");
const { createCourse, getCourses, updateCourse, deleteCourse } = require("../controllers/courseController");


const router = express.Router();

router.post("/courses", createCourse);
router.get("/courses", getCourses);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

module.exports = router;
