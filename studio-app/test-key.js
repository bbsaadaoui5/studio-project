import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDGOpEuFUR2w8feqaaIeBSAD0QwYH05WhM");

async function testKey() {
  try {
    console.log("Testing API key...");
    const models = await genAI.listModels();
    console.log("✅ API key works! Available models:", models);
  } catch (error) {
    console.log("❌ API key error:", error.message);
    console.log("Error details:", error);
  }
}

testKey();
