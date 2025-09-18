// Quick test script for Gemini API
const fetch = require('node-fetch');

async function testGemini() {
  try {
    const response = await fetch('http://localhost:3000/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'Generate a course description for Robotics Club' 
      })
    });
    
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testGemini();