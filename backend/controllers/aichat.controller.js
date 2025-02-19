const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require("../models/chat.model.js");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatGemini = async (req, res) => {
    const { prompt, googleId, sessionId } = req.body;

    if (!prompt || !googleId) {
        return res.status(400).json({ error: "required fields missing" });
    }

    const systemInstructions = "Your name is iLife AI. Always refer to yourself as iLife AI when introducing yourself or responding to users.";

    try {
        // fetch last 5 messages to maintain conversation context
        const previousChats = await Chat.find({ googleId })
            .sort({ timestamp: -1 })
            .limit(5);

        let chatHistory = previousChats.reverse().map(chat => `${chat.sender}: ${chat.message}`).join("\n");

        // add history with new user input
        const aiContext = `${systemInstructions}\n\n${chatHistory}\n\nUser: ${prompt}\nAI:`;
        
        console.log(aiContext);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const response = await model.generateContent([aiContext]);

        if (!response || !response.response || !response.response.candidates || response.response.candidates.length === 0) {
            throw new Error("Invalid response structure");
        }

        const aiMessage = response.response.candidates[0]?.content?.parts?.[0]?.text || "AI could not generate a response.";
        const session = sessionId || `session_${Date.now()}`;

        await Chat.create({ googleId, sessionId: session, sender: "user", message: prompt });
        await Chat.create({ googleId, sessionId: session, sender: "ai", message: aiMessage });

        res.json({ response: aiMessage, sessionId: session });
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
    getChatHistory 
};
