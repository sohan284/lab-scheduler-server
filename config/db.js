const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://lab-scheduler:2rnFg1sgjvoBo4e2@cluster0.ifsk1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if the MongoDB connection fails
  }
}

const getDB = (dbName) => client.db(dbName);

module.exports = { connectDB, getDB };