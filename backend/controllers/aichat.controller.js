const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require("../models/chat.model.js");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatGemini = async (req, res) => {
  const { prompt, googleId, sessionId } = req.body;

  if (!prompt || !googleId) {
    return res.status(400).json({ error: "required fields missing" });
  }

  const systemInstructions = `
  You are iLife AI, a helpful assistant. Always refer to yourself as iLife AI.
  
  Your primary role is to assist with scheduling reminders. When the user expresses an intent to set a reminder or schedule an event, extract as much information as possible from their message and respond with a plain JSON object containing the following fields:
  
  - summary: a brief title for the reminder (required)
  - description: additional details about the reminder (optional)
  - location: where the event will take place (optional)
  - startTime: the start date and time in ISO 8601 format (required, e.g., "2024-12-15T14:00:00.000Z")
  - endTime: the end date and time in ISO 8601 format (optional, e.g., "2024-12-15T15:00:00.000Z")

    If the user provides partial information, include the available fields in the JSON and set missing fields to null. Use the current date provided in the prompt to calculate relative dates like 'tomorrow' or 'next week.' Do not respond with a text message asking for clarification; instead, provide the JSON with null values for missing fields.
  
  If the user is not trying to create a reminder, respond in a friendly, engaging, and highly varied manner, taking into account their input, the conversation history, and avoiding repetitive responses at all costs. Use the conversation history to maintain context, acknowledge previous interactions, and offer unique, natural, and creative replies that never repeat the same phrasing or structure. If the user asks the same question repeatedly (e.g., "How are you doing?"), generate an entirely new, creative response each time that builds on the previous exchange, introduces new engagement, or surprises the user with fresh content. Continuously vary your responses to keep the conversation lively and interesting, drawing on a wide range of friendly, conversational tones and topics.
  
  Examples for casual conversation:
  - User: "Hi"
    AI: "Hello! How can I help you today?"
  - User: "How are you doing?"
    AI: "I'm doing great, thanks for asking! How about you?"
  - User: "How are you doing?" (after the first exchange)
    AI: "Feeling fantastic today, thank you! How are you holding up?"
  - User: "How are you doing?" (later, after more conversation)
    AI: "Still feeling awesome—happy to chat! What’s new with you?"
  - User: "I'm alright too, thanks."
    AI: "Glad you’re doing well! What’s on your mind today? I’m here to help!"
  - User: "Tell me a fun fact."
    AI: "Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible!"
  
  
  For scheduling:
  - User: "Schedule a meeting with the dev team on February 22, 2025, at 6:56 PM online to discuss project updates."
    AI:
    {
        "summary": "Meeting with the dev team",
        "description": "Discuss project updates",
        "location": "Online",
        "startTime": "2025-02-22T18:56:00.000Z",
        "endTime": "2025-02-22T19:56:00.000Z"
    }
  
  - User: "Set a reminder for a meeting on December 15, 2024, at 2 PM."
    AI:
    {
        "summary": "meeting",
        "description": null,
        "location": null,
        "startTime": "2024-12-15T14:00:00.000Z",
        "endTime": null
    }
  `;

  try {
    const previousChats = await Chat.find({ googleId })
      .sort({ timestamp: -1 })
      .limit(10);

    let chatHistory = previousChats
      .reverse()
      .map((chat) => `${chat.sender}: ${chat.message}`)
      .join("\n");

    const currentDate = new Date().toISOString();
    const aiContext = `${systemInstructions}\n\nCurrent date: ${currentDate}\n\n${chatHistory}\n\nUser: ${prompt}\nAI:`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent([aiContext]);

    if (
      !response ||
      !response.response ||
      !response.response.candidates ||
      response.response.candidates.length === 0
    ) {
      throw new Error("Invalid response structure");
    }

    const aiMessage =
      response.response.candidates[0]?.content?.parts?.[0]?.text ||
      "AI could not generate a response.";
    const session = sessionId || `session_${Date.now()}`;

    let jsonResponse = null;
    const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      try {
        jsonResponse = JSON.parse(jsonMatch[1]);
        console.log("JSON Response:", JSON.stringify(jsonResponse, null, 2));
      } catch (error) {
        console.error("err parsing extracted JSON:", error.message);
      }
    }

    if (!jsonResponse) {
      await Chat.create({
        googleId,
        sessionId: session,
        sender: "user",
        message: prompt,
      });
      await Chat.create({
        googleId,
        sessionId: session,
        sender: "ai",
        message: aiMessage,
      });
      return res.json({ response: aiMessage, sessionId: session });
    }

    let missing = [];
    if (!jsonResponse.summary) missing.push("summary");
    if (!jsonResponse.startTime) missing.push("start time");

    if (missing.length > 0) {
      let clarificationMessage =
        "I've extracted the following details for your reminder:\n";
      if (jsonResponse.summary)
        clarificationMessage += `- Summary: ${jsonResponse.summary}\n`;
      if (jsonResponse.startTime)
        clarificationMessage += `- Start Time: ${jsonResponse.startTime}\n`;
      if (jsonResponse.endTime)
        clarificationMessage += `- End Time: ${jsonResponse.endTime}\n`;
      if (jsonResponse.location)
        clarificationMessage += `- Location: ${jsonResponse.location}\n`;
      if (jsonResponse.description)
        clarificationMessage += `- Description: ${jsonResponse.description}\n`;
      clarificationMessage += `\nHowever, I still need the following required details: ${missing.join(
        ", "
      )}. Please provide them.`;

      await Chat.create({
        googleId,
        sessionId: session,
        sender: "user",
        message: prompt,
      });
      await Chat.create({
        googleId,
        sessionId: session,
        sender: "ai",
        message: clarificationMessage,
      });
      return res.json({
        response: clarificationMessage,
        sessionId: session,
      });
    }

    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ error: "auth token not provided" });
    }

    try {
      const calendarResponse = await axios.post(
        "http://localhost:3000/api/calendar/events",
        { ...jsonResponse, userId: googleId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reminder created!", calendarResponse.data);

      await Chat.create({
        googleId,
        sessionId: session,
        sender: "user",
        message: prompt,
      });
      await Chat.create({
        googleId,
        sessionId: session,
        sender: "ai",
        message:
          "Your reminder has been added to your calendar! Anything else I can do for you?",
      });

      res.json({
        response: "Your reminder has been added to your calendar!",
        sessionId: session,
        eventLink: calendarResponse.data.eventLink,
      });
    } catch (error) {
      console.error("err creating calendar event:", error.message);
      res.status(500).json({ error: "failed to create calendar event" });
    }
  } catch (error) {
    console.error("err generating response:", error.message);
    res.status(500).send("An error occurred while generating the response");
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { googleId } = req.params;
    if (!googleId) return res.status(400).json({ error: "googleId missing" });

    const chats = await Chat.find({ googleId }).sort({ timestamp: 1 });

    res.json({ googleId, chats });
  } catch (error) {
    console.error("err fetching chat history", error.message);
    res.status(500).send("An error occurred while fetching chat history");
  }
};

module.exports = {
  chatGemini,
  getChatHistory,
};
