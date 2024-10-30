const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const getCourses = async (req, res) => {
  try {
    const coursesCollection = getDB("lab-scheduler").collection("courses");
    const result = await coursesCollection.find().toArray();
    res.status(200).json({
      success: true,
      data: result,
      message: "course retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
      message: error.message,
    });
  }
};

const createCourse = async (req, res) => {
  try {
    const data = req.body;
    const coursesCollection = getDB("lab-scheduler").collection("courses");
    const result = await coursesCollection.insertOne(data);
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...data },
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

const updateCourse = async (req, res) => {
  const id = req.params.id;
  const { course } = req.body;

  // Check if the ID is valid
  if (!ObjectId.isValid(id)) {
    console.error("Invalid status ID:", id);
    return res.status(400).json({
      success: false,
      message: "Invalid status ID",
    });
  }

  // Validate that only title and color fields are allowed
  const allowedFields = ["course"];
  const invalidFields = Object.keys(req.body).filter(
    (key) => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    console.error("Invalid fields in request body:", invalidFields);
    return res.status(400).json({
      success: false,
      message: "Invalid fields in request body: " + invalidFields.join(", "),
    });
  }

  try {
    const coursesCollection = getDB("lab-scheduler").collection("courses");
    const updateFields = {};

    if (course !== undefined) updateFields.course = course;

    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      console.error("course not found:", id);
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};
const deleteCourse = async (req, res) => {
  const id = req.params.id;

  try {
    const coursesCollection = getDB("lab-scheduler").collection("courses");
    const result = await coursesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 1) {
      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: error.message,
    });
  }
};

module.exports = {
  getCourses,
  createCourse,
  deleteCourse,
  updateCourse,
};
