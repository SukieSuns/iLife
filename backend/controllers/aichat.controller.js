const axios = require("axios");
const {GoogleGenerativeAI} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatGemini = async (req, res) => {
    const userInput = req.body.prompt
    try {
        const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

        let prompt = [userInput];

        const response = await model.generateContent(prompt);
        res.send(response.response.text());
    } catch (error) {
        console.error("err generating response", error.response?.data || error.message);
        res.status(500).send("An err occured while generating the response");
    }
};

module.exports = { chatGemini };