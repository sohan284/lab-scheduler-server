const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const machineRoutes = require("./routes/machineRoutes");
const courseRoutes = require("./routes/coursesRoutes");
const tutorialsRoutes = require("./routes/tutorialsRoutes");
const port = 5000;
const app = express();

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://lab-scheduler-tau.vercel.app",
  "https://lab-scheduler-client.vercel.app",
  "https://lab-scheduler.netlify.app",
];

// Set up CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    credentials: true,
  })
);

// Make sure CORS is applied before routes
app.use(express.json());

connectDB();

app.use("/", userRoutes, taskRoutes, machineRoutes ,courseRoutes, tutorialsRoutes);

app.get("/", (req, res) => {
  res.send("Hello From Scheduler!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
