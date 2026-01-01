// Simple Firebase connection test
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Manually paste your firebaseConfig here (from src/lib/firebase.ts)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  console.log('Testing Firebase connection...');
  
  try {
    const start = Date.now();
    const testRef = doc(db, 'connection_test', 'simple_test');
    await setDoc(testRef, { 
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    const duration = Date.now() - start;
    
    console.log('✅ Firebase connection successful!');
    console.log(`⏱️  Write time: ${duration}ms`);
    
  } catch (error) {
    console.log('❌ Firebase connection failed:');
    console.log(error.message);
  }
}

testConnection();
