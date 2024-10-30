const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const getMachines = async (req, res) => {
  try {
    const machinesCollection = getDB("lab-scheduler").collection("machines");
    const result = await machinesCollection.find().toArray();
    res.status(200).json({
      success: true,
      data: result,
      message: "Tag retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching Tag:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Tag",
      message: error.message,
    });
  }
};

const createMachine = async (req, res) => {
  try {
    const data = req.body;
    const machinesCollection = getDB("lab-scheduler").collection("machines");
    const result = await machinesCollection.insertOne(data);
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...data },
      message: "Machine created successfully",
    });
  } catch (error) {
    console.error("Error creating machine:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create machine",
      error: error.message,
    });
  }
};

const updateMachine = async (req, res) => {
  const id = req.params.id;
  const { title, author, tutorial,duration } = req.body;

  // Check if the ID is valid
  if (!ObjectId.isValid(id)) {
    console.error("Invalid status ID:", id);
    return res.status(400).json({
      success: false,
      message: "Invalid status ID",
    });
  }

  // Validate that only title and color fields are allowed
  const allowedFields = ["title", "author", "tutorial","duration"];
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
    const machinesCollection = getDB("lab-scheduler").collection("machines");
    const updateFields = {};

    // Update fields only if they are provided in the request body
    if (title !== undefined) updateFields.title = title;
    if (author !== undefined) updateFields.author = author;
    if (tutorial !== undefined) updateFields.tutorial = tutorial;
    if (duration !== undefined) updateFields.duration = duration;

    const result = await machinesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      console.error("Tag not found:", id);
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tag updated successfully",
    });
  } catch (error) {
    console.error("Error updating machine:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};
const deleteMachine = async (req, res) => {
  const id = req.params.id;

  try {
    const machinesCollection = getDB("lab-scheduler").collection("machines");
    const result = await machinesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 1) {
      res.status(200).json({
        success: true,
        message: "Machine deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Machine not found",
      });
    }
  } catch (error) {
    console.error("Error deleting machine:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete machine",
      error: error.message,
    });
  }
};

module.exports = {
  getMachines,
  createMachine,
  deleteMachine,
  updateMachine,
};
