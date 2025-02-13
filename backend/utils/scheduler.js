const schedule = require("node-schedule");
const Reminder = require("../models/reminder.model.js");
const { sendReminder } = require("../services/twilioService.js");

const scheduleReminder = async (reminder) => {
    const reminderTime = new Date(reminder.time);
    
    if (reminderTime > new Date()) {
        schedule.scheduleJob(reminderTime, async function () {
            console.log(`Sending reminder: "${reminder.text}" at ${new Date()}`);

            try {
                await sendReminder(reminder.text);
                await Reminder.findByIdAndUpdate(reminder._id, { sent: true });
            } catch (err) {
                console.error("Error sending reminder:", err);
            }
        });

        console.log(`Reminder scheduled: "${reminder.text}" at ${reminderTime}`);
    } else {
        // send past reminders immediately
        console.log(`Missed reminder: "${reminder.text}" - Sending now.`);
        try {
            await sendReminder(reminder.text);
            await Reminder.findByIdAndUpdate(reminder._id, { sent: true });
        } catch (err) {
            console.error("Error sending missed reminder:", err);
        }
    }
};

// run at startup to reschedule unsent reminders
const scheduleUnsentReminders = async () => {
    try {
        const reminders = await Reminder.find({ sent: false });

        reminders.forEach((reminder) => {
            scheduleReminder(reminder);
        });

        console.log(`Rescheduled ${reminders.length} reminders.`);
    } catch (error) {
        console.error("Error scheduling reminders:", error);
    }
};

module.exports = { scheduleReminder, scheduleUnsentReminders };