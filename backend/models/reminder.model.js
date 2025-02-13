const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
    text: { type: String, required: true },
    time: { type: Date, required: true },
    sent: { type: Boolean, default: false }
});

module.exports = mongoose.model("Reminder", reminderSchema);