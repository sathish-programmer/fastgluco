import { GoogleGenerativeAI } from '@google/generative-ai';
require('dotenv').config();

async function test() {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.log("No GOOGLE_VISION_API_KEY");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Say hello");
    console.log(result.response.text());
  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}
test();
