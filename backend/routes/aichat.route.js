const express = require("express");
const { chatGemini, getChatHistory } = require("../controllers/aichat.controller.js");

const router = express.Router();

router.post("/", chatGemini);
router.get("/:googleId", getChatHistory);

module.exports = router;