const db = require('./db');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkApiQuery() {
    try {
        console.log("Testing API Query...");
        const query = `
            SELECT e.id, e.module_name, f.name as formation_name, d.name as department_name
            FROM exams e
            JOIN formations f ON e.formation_id = f.id
            JOIN departments d ON f.department_id = d.id
            LEFT JOIN rooms r ON e.room_id = r.id
            LEFT JOIN users u ON e.responsible_professor_id = u.id
        `;

        // Test query WITHOUT department filtering first
        const [rows] = await db.execute(query);
        let output = `Query returned ${rows.length} rows.\n`;
        rows.forEach(r => {
            output += `- [${r.id}] ${r.module_name} (${r.formation_name}, ${r.department_name})\n`;
        });
        fs.writeFileSync('api_query_output.txt', output);

        process.exit(0);
    } catch (e) {
        fs.writeFileSync('api_query_output.txt', "Query failed: " + e.message);
        process.exit(1);
    }
}

checkApiQuery();
