const Reminder = require("../models/reminder.model.js");
const { scheduleReminder } = require("../utils/scheduler.js");

const createReminder = async (req, res) => {
    try {
        const { text, time } = req.body;
        if (!text || !time) return res.status(400).json({ error: "Text and time are required" });

        const reminder = await Reminder.create({ text, time });

        // schedule the reminder
        scheduleReminder(reminder);

        res.status(201).json({ message: "Reminder scheduled", reminder });
    } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find();
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { createReminder, getReminders };
