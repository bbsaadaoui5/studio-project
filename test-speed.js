// Test Firebase connection speed using your actual config
const { readFileSync } = require('fs');

// Read your firebase config file
const firebaseContent = readFileSync('./src/lib/firebase.ts', 'utf8');

// Extract the firebaseConfig object (simplified approach)
const configMatch = firebaseContent.match(/firebaseConfig\s*=\s*({[\s\S]*?})/);
if (!configMatch) {
  console.log('❌ Could not extract firebaseConfig');
  process.exit(1);
}

// Evaluate the config safely
let firebaseConfig;
try {
  firebaseConfig = eval('(' + configMatch[1] + ')');
} catch (e) {
  console.log('❌ Error parsing firebaseConfig:', e.message);
  process.exit(1);
}

// Now test the connection
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

async function testSpeed() {
  console.log('🚀 Testing Firebase connection speed...');
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const start = Date.now();
    const testRef = doc(db, 'speed_test', 'test_' + Date.now());
    await setDoc(testRef, { 
      timestamp: new Date(),
      test: 'connection_speed'
    });
    const duration = Date.now() - start;
    
    console.log('✅ Firebase write successful!');
    console.log(`⏱️  Write latency: ${duration}ms`);
    
    // Interpret the results
    if (duration < 200) console.log('🎉 Excellent speed!');
    else if (duration < 500) console.log('⚠️  Acceptable speed');
    else if (duration < 1000) console.log('🐢 Slow - might be regional');
    else console.log('🚨 Very slow - check your network');
    
  } catch (error) {
    console.log('❌ Firebase error:', error.message);
  }
}

testSpeed();
