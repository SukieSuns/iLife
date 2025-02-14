const express = require("express");
const { googleAuth, googleAuthCallback, logOut } = require("../controllers/auth.controller.js");

const router = express.Router();

router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/logout", logOut);

module.exports = router;
