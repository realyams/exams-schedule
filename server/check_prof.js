const db = require('./db');

async function checkProfessors() {
    try {
        const [profs] = await db.execute(`
            SELECT u.id, u.full_name, u.email, u.role, u.department_id, d.name as dept_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'professeur' OR u.role = 'chef_departement'
        `);

        console.log("--- PROFESSORS ---");
        for (const p of profs) {
            const [exams] = await db.execute('SELECT count(*) as c FROM exams WHERE responsible_professor_id = ?', [p.id]);
            const [surv] = await db.execute('SELECT count(*) as c FROM surveillances WHERE professor_id = ?', [p.id]);
            console.log(`[${p.id}] ${p.full_name} (${p.email}) - Dept: ${p.department_id} (${p.dept_name}) - Exams: ${exams[0].c}, Surveillances: ${surv[0].c}`);
        }
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkProfessors();
