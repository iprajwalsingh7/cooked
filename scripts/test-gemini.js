const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI("AIzaSyBErzNo0kl3cJM0Eft25em5-5tLY6ffFU0");
    const models = [
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-pro"
    ];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`SUCCESS: ${modelName} works! Response:`, result.response.text());
            return; // Stop after finding a working model
        } catch (error) {
            console.error(`FAILED: ${modelName} - ${error.message.split('\n')[0]}`);
        }
    }
}

listModels();
