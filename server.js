const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const port = 5000;
const app = express();

const allowedOrigins = ["http://localhost:5173"]; // Replace with your actual frontend URL

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
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
