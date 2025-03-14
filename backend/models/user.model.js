const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    refreshToken: { type: String, required: true },
    timeZone: { type: String, default: "UTC" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
