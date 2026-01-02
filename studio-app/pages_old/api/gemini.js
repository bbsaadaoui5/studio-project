// pages/api/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with your API key (NOT Firebase API key!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured' 
      });
    }

    // Get the generative model - using gemini-1.5-pro-latest for the most recent version
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",  // 🔄 UPDATED: Now using the latest version
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      success: true,
      response: text,
      model: "gemini-1.5-pro-latest" // Added model info to response
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Handle specific error types
    if (error.message?.includes('API key not valid')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your GEMINI_API_KEY environment variable.'
      });
    }
    
    if (error.message?.includes('quota exceeded')) {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.'
      });
    }

    return res.status(500).json({ 
      error: {
        message: error.message || 'Internal server error',
        type: error.name || 'UnknownError'
      }
    });
  }
}