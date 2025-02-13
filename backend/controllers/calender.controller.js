const { google } = require('googleapis');

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const jwtClient = new google.auth.JWT(
    GOOGLE_CLIENT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    SCOPES
);

const calendar = google.calendar({
    version: 'v3',
    project: GOOGLE_PROJECT_NUMBER,
    auth: jwtClient
});

// fetch calendar events
const getCalendarEvents = async (req, res) => {
    try {
        const response = await calendar.events.list({
            calendarId: GOOGLE_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        if (response.data.items.length) {
            return res.json({ events: response.data.items });
        } else {
            return res.json({ message: 'No upcoming events found.' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// create event
const createCalendarEvent = async (req, res) => {
    try {
        const { summary, description, location, startTime, endTime } = req.body;

        const event = {
            summary,
            description,
            location,
            start: { dateTime: startTime, timeZone: 'UTC' },
            end: { dateTime: endTime, timeZone: 'UTC' },
        };

        const response = await calendar.events.insert({
            calendarId: GOOGLE_CALENDAR_ID,
            resource: event,
        });

        return res.json({
            message: "Event successfully created!",
            eventLink: response.data.htmlLink
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


module.exports = { 
    getCalendarEvents, 
    createCalendarEvent 
};
