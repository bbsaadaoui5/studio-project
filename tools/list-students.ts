// Diagnostic script: list students and key fields
// Run with: npx ts-node ./tools/list-students.ts

// Dynamically import services so this script runs in ESM/ts-node environments
let getStudents: any;

async function main() {
  ({ getStudents } = await import('../src/services/studentService.ts'));
  const students = await getStudents();
  if (!students || students.length === 0) {
    console.log('No students returned by getStudents()');
    process.exit(0);
  }

  console.log(`Found ${students.length} students:`);
  for (const s of students) {
    console.log('----------------------------------------');
    console.log(`id: ${s.id}`);
    console.log(`name: ${s.name || "" || '[no name]'}`);
    console.log(`grade: ${s.grade || '[no grade]'}`);
    console.log(`className: ${s.className || '[no className]'}`);
    console.log(`status: ${s.status || '[no status]'}`);
    console.log(`enrollmentDate: ${s.enrollmentDate || '[no enrollmentDate]'}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

// Ensure this file is treated as a module to avoid global-scope name collisions
export {};
