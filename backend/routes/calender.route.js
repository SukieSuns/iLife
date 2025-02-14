const express = require("express");
const { getCalendarEvents, createCalendarEvent } = require("../controllers/calender.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.get("/", authMiddleware, getCalendarEvents);
router.post("/", authMiddleware, createCalendarEvent);

module.exports = router;
