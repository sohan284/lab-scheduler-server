const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const tutorialsCollection = getDB("lab-scheduler").collection("tutorials");


const createTutorial = async (req, res) => {
    try {
        const tutorialData = req.body;
        const result = await tutorialsCollection.insertOne(tutorialData);
        res.status(201).json({
            success: true,
            data: result,
            message: "Tutorial created successfully",
        });
    } catch (error) {
        console.error("Error creating tutorial:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create tutorial",
            message: error.message,
        });
    }
};

const getTutorials = async (req, res) => {
    try {
        const result = await tutorialsCollection.find().toArray();

        res.status(200).json({
            success: true,
            data: result,
            message: "Tutorials retrieved successfully",
        });
    } catch (error) {
        console.error("Error fetching tutorials:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch tutorials",
            message: error.message,
        });
    }
};

const updateTutorial = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await tutorialsCollection.updateOne(
            { _id: new ObjectId(id)
 },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: "Tutorial not found",
            });
        }

        res.status(200).json({
            success: true,
            data: result,
            message: "Tutorial updated successfully",
        });
    } catch (error) {
        console.error("Error updating tutorial:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update tutorial",
            message: error.message,
        });
    }
};

const deleteTutorial = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tutorialsCollection.deleteOne({ _id: new ObjectId(id)
 });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: "Tutorial not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Tutorial deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting tutorial:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete tutorial",
            message: error.message,
        });
    }
};

module.exports = {
    createTutorial,
    getTutorials,
    updateTutorial,
    deleteTutorial
};