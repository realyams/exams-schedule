const db = require('./server/db');
require('dotenv').config({ path: './server/.env' });

async function checkExams() {
    try {
        console.log("Checking exams in DB...");
        const [exams] = await db.execute('SELECT id, module_name, date_time, is_validated, formation_id FROM exams');
        console.log(`Found ${exams.length} exams.`);
        exams.forEach(e => {
            console.log(`- [${e.id}] ${e.module_name}: ${e.date_time} (Validated: ${e.is_validated}) Formation: ${e.formation_id}`);
        });
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

checkExams();
