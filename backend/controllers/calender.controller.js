const { google } = require("googleapis");
const User = require("../models/user.model.js");

const getAuthenticatedClient = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.refreshToken) throw new Error("User not authenticated");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: user.refreshToken });
  return oauth2Client;
};

// fetch calendar events
const getCalendarEvents = async (req, res) => {
  try {
    const oauth2Client = await getAuthenticatedClient(req.userId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json({ events: response.data.items || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// create calendar event
const createCalendarEvent = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) throw new Error("User ID is required");
    const oauth2Client = await getAuthenticatedClient(userId);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const { summary, description, location, startTime, endTime } = req.body;

    // validate startTime &
    if (!startTime || isNaN(Date.parse(startTime))) {
      throw new Error(
        "Invalid startTime: Must be a valid ISO 8601 date (e.g., '2025-02-28T14:00:00.000Z')"
      );
    }

    if (endTime && isNaN(Date.parse(endTime))) {
      throw new Error(
        "Invalid endTime: Must be a valid ISO 8601 date (e.g., '2025-02-28T15:00:00.000Z')"
      );
    }

    // zero duration events
    const endDateTime = endTime || startTime;
    const event = {
      summary,
      description,
      location,
      start: { dateTime: startTime, timeZone: "America/Los_Angeles" },
      end: { dateTime: endDateTime, timeZone: "America/Los_Angeles" },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.json({ message: "Event created!", eventLink: response.data.htmlLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
};
