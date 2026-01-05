const db = require('./db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fs = require('fs');

async function checkExams() {
    try {
        const [exams] = await db.execute('SELECT id, module_name, date_time, is_validated, formation_id FROM exams');
        let output = `Found ${exams.length} exams:\n`;
        exams.forEach(e => {
            output += `- [${e.id}] ${e.module_name}: ${e.date_time} (Validated: ${e.is_validated}) Formation: ${e.formation_id}\n`;
        });
        fs.writeFileSync('db_check_output.txt', output);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('db_check_output.txt', 'Error: ' + e.message);
        process.exit(1);
    }
}

checkExams();
