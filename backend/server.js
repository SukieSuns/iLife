require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const reminderRoutes = require("./routes/reminder.route.js");
const calendarRoutes = require("./routes/calendar.route.js");
const authRoutes = require("./routes/auth.route.js");
const aiChatRoutes = require("./routes/aichat.route.js");
const { scheduleUnsentReminders } = require("./utils/scheduler.js");

const app = express();

// middleware
app.use(express.json());
app.use(
  session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control, Authorization");
  next();
});

// routes
app.use("/api/reminders", reminderRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", aiChatRoutes);

app.get("/", (req, res) => {
  res.json({
    message:
      "hello world",
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
