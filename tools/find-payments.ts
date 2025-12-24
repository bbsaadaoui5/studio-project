// Diagnostic script: find payments for a student by name
// Run with: npx ts-node ./tools/find-payments.ts "عمر الباهلي"

let getStudents: any;
let getStudent: any;
let getPaymentsForStudent: any;

async function main() {
  const nameArg = process.argv[2];
  if (!nameArg) {
    console.error('Usage: npx ts-node ./tools/find-payments.ts "Student Name"');
    process.exit(1);
  }

  const name = nameArg.trim();
  ({ getStudents, getStudent } = await import('../src/services/studentService.ts'));
  ({ getPaymentsForStudent } = await import('../src/services/financeService.ts'));
  console.log(`Looking up students matching: ${name}`);
  const students = await getStudents();
  const matches = students.filter(s => (s.name || '').includes(name));
  if (matches.length === 0) {
    console.log('No students found with that name. Try a different search or check spelling.');
    process.exit(0);
  }

  for (const s of matches) {
    console.log('---');
    console.log(`Student: ${s.name} (id: ${s.id}, grade: ${s.grade}, class: ${s.className})`);
    const payments = await getPaymentsForStudent(s.id);
    console.log(`Payments for ${s.id} (${payments.length}):`);
    payments.forEach(p => console.log(JSON.stringify(p, null, 2)));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
