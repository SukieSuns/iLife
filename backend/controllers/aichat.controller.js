const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatGemini = async (req, res) => {
    const userInput = req.body.prompt;
    const systemInstructions = "Your name is iLife AI. Always refer to yourself as iLife AI when introducing yourself or responding to users.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const response = await model.generateContent([systemInstructions, userInput]);

        if (!response || !response.response || !response.response.candidates || response.response.candidates.length === 0) {
            throw new Error("Invalid response structure");
        }

        const aiMessage = response.response.candidates[0]?.content?.parts?.[0]?.text || "AI could not generate a response.";

        res.json({ response: aiMessage });
    } catch (error) {
        console.error("err generating response", error.aiMessage?.data || error.message);
        res.status(500).send("An error occurred while generating the response");
    }
};

module.exports = { chatGemini };
