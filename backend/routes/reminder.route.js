const express = require("express");
const { createReminder, getReminders } = require("../controllers/reminder.controller");

const router = express.Router();

router.post("/", createReminder);
router.get("/", getReminders);

module.exports = router;
