const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();

// CORS configuration
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

app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello From Scheduler!");
});

// Start the server only if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
