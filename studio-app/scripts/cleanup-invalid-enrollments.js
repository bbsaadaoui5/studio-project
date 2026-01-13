/**
 * Cleanup Invalid Enrollments
 * 
 * This script finds and optionally removes enrollments to courses that no longer exist.
 * Run with: node scripts/cleanup-invalid-enrollments.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('💡 Make sure service-account-key.json exists in the project root');
    process.exit(1);
  }
}

const db = admin.firestore();

async function findInvalidEnrollments() {
  console.log('🔍 Scanning for invalid enrollments...\n');
  
  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    const validCourseIds = new Set(coursesSnapshot.docs.map(doc => doc.id));
    console.log(`📚 Found ${validCourseIds.size} valid courses in database\n`);
    
    // Get all enrollments
    const enrollmentsSnapshot = await db.collection('enrollments').get();
    console.log(`📋 Found ${enrollmentsSnapshot.size} enrollment records\n`);
    
    const invalidEnrollments = [];
    
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const data = enrollmentDoc.data();
      const courseId = enrollmentDoc.id;
      
      if (!validCourseIds.has(courseId)) {
        const studentCount = data.studentIds?.length || 0;
        invalidEnrollments.push({
          courseId,
          studentIds: data.studentIds || [],
          studentCount
        });
        
        console.log(`❌ Invalid enrollment found:`);
        console.log(`   Course ID: ${courseId}`);
        console.log(`   Students enrolled: ${studentCount}`);
        console.log(`   Student IDs:`, data.studentIds?.join(', ') || 'None');
        console.log('');
      }
    }
    
    if (invalidEnrollments.length === 0) {
      console.log('✅ No invalid enrollments found! All enrollments reference valid courses.');
    } else {
      console.log(`\n⚠️  Summary: Found ${invalidEnrollments.length} invalid enrollment(s)`);
      console.log(`   Total students affected: ${invalidEnrollments.reduce((sum, e) => sum + e.studentCount, 0)}`);
      console.log('\n💡 To remove these invalid enrollments, run:');
      console.log('   node scripts/cleanup-invalid-enrollments.js --remove');
    }
    
    return invalidEnrollments;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function removeInvalidEnrollments(invalidEnrollments) {
  console.log('\n🗑️  Removing invalid enrollments...\n');
  
  const batch = db.batch();
  
  for (const enrollment of invalidEnrollments) {
    const docRef = db.collection('enrollments').doc(enrollment.courseId);
    batch.delete(docRef);
    console.log(`   Deleting enrollment for course: ${enrollment.courseId}`);
  }
  
  await batch.commit();
  console.log(`\n✅ Removed ${invalidEnrollments.length} invalid enrollment(s)`);
}

async function main() {
  const shouldRemove = process.argv.includes('--remove');
  
  const invalidEnrollments = await findInvalidEnrollments();
  
  if (shouldRemove && invalidEnrollments.length > 0) {
    await removeInvalidEnrollments(invalidEnrollments);
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
