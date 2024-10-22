const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const port = 5000;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://lab-scheduler-tau.vercel.app",
  "https://lab-scheduler.netlify.app",
]; // Replace with your actual frontend URL

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin like mobile apps or curl requests
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If origin is not allowed, send error
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Include OPTIONS method
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization", // Allow necessary headers
    credentials: true, // Allow credentials (cookies, authorization headers)
  })
);
app.use(express.json());

connectDB();

app.use("/", userRoutes, taskRoutes);

app.get("/", (req, res) => {
  res.send("Hello From Scheduler!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
module.exports = app;
