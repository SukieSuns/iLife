require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const reminderRoutes = require("./routes/reminder.route.js");
const { scheduleUnsentReminders } = require("./utils/scheduler.js");

// middleware
const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/api/reminders", reminderRoutes);

app.get("/", (req, res) => {
  res.json({
    message:
      "Use /api/reminders to send and get reminders. - get/post",
  });
});

// connect to MongoDB & start server
mongoose
  .connect(process.env.MONGODB_KEY)
  .then(() => {
    console.log("Connected to MongoDB!");

    // schedule unsent reminders on startup
    scheduleUnsentReminders();

    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => console.error("Err connecting to DB", err));
