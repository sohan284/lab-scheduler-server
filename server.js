const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const port = 5000;
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello From Scheduler!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
module.exports = app;
