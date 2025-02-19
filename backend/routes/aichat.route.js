const express = require("express");
const { chatGemini, getChatHistory } = require("../controllers/aichat.controller.js");

const router = express.Router();

router.post("/chat", chatGemini);
router.get("/chat/:googleId", getChatHistory);

module.exports = router;