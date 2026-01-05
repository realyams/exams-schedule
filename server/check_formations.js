const db = require('./db');

async function checkFormations() {
    try {
        const [rows] = await db.execute(`
            SELECT d.id as dept_id, d.name as dept_name, f.id as form_id, f.name as form_name
            FROM departments d
            LEFT JOIN formations f ON d.id = f.department_id
            ORDER BY d.name, f.name
        `);

        console.log("--- DEPARTMENTS & FORMATIONS ---");
        rows.forEach(r => {
            console.log(`[${r.dept_name}] (ID: ${r.dept_id}) -> ${r.form_name ? r.form_name + ' (ID: ' + r.form_id + ')' : 'NO FORMATIONS'}`);
        });
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkFormations();
