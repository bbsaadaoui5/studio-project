import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Get the latest Gemini Pro model
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro-latest" // Using the latest version
});

export async function callGemini(prompt: string) {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      text: text,
      data: {
        model: "gemini-1.5-pro-latest",
        timestamp: new Date().toISOString(),
        tokensUsed: response.usageMetadata?.totalTokenCount || null
      }
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    
    return {
      text: "Sorry, I'm having trouble processing your request right now.",
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: "gemini-1.5-pro-latest",
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Optional: Function for streaming responses
export async function callGeminiStream(prompt: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const result = await model.generateContentStream(prompt);
    
    return result.stream;
  } catch (error) {
    console.error('Gemini AI Streaming Error:', error);
    throw error;
  }
}

// Optional: Function with custom generation config
export async function callGeminiWithConfig(
  prompt: string, 
  config?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  }
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        topP: config?.topP ?? 0.8,
        topK: config?.topK ?? 40,
        maxOutputTokens: config?.maxOutputTokens ?? 2048,
      },
    });

    const response = await result.response;
    const text = response.text();

    return {
      text: text,
      data: {
        model: "gemini-1.5-pro-latest",
        config: config,
        timestamp: new Date().toISOString(),
        tokensUsed: response.usageMetadata?.totalTokenCount || null
      }
    };
  } catch (error) {
    console.error('Gemini AI Config Error:', error);
    
    return {
      text: "Sorry, I'm having trouble processing your request right now.",
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: "gemini-1.5-pro-latest",
        timestamp: new Date().toISOString()
      }
    };
  }
}