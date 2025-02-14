const { google } = require("googleapis");
const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Google OAuth
const googleAuth = (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/calendar",
            "openid",
            "email",
            "profile"
        ],
        prompt: "consent",
    });
    res.redirect(authUrl);
};

// callback after auth
const googleAuthCallback = async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);

        // decode id_token to get user info
        const decoded = jwt.decode(tokens.id_token);

        const googleId = decoded.sub;
        const email = decoded.email;
        const name = decoded.name;

        // save user to DB
        let user = await User.findOne({ googleId });

        if (!user) {
            user = new User({
                googleId,
                email,
                name,
                refreshToken: tokens.refresh_token
            });
        } else {
            user.refreshToken = tokens.refresh_token;
        }

        await user.save();

        // generate access token
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRY_TIME });

        res.json({ message: "Authentication successful!", accessToken });
    } catch (error) {
        console.error("Google Auth Err:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
};

// logout user
const logOut = (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
};

module.exports = { googleAuth, googleAuthCallback, logOut };
