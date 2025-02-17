const express = require("express");
const { chatGemini } = require("../controllers/aichat.controller.js");

const router = express.Router();

router.post("/chat", chatGemini);

module.exports = router;