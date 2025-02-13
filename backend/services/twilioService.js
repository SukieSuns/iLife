const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendReminder = async (text) => {
    try {
        const message = await client.messages.create({
            body: text,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.USER_PHONE_NUMBER,
        });

        console.log(`Reminder sent: ${message.sid}`);
    } catch (error) {
        console.error("Error sending SMS:", error);
        throw error;
    }
};

module.exports = { sendReminder };
