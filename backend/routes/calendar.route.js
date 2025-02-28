const express = require("express");
const { getCalendarEvents, createCalendarEvent } = require("../controllers/calendar.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.get("/events", authMiddleware, getCalendarEvents);
router.post("/events", authMiddleware, createCalendarEvent);

module.exports = router;
