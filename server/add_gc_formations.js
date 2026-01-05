const db = require('./db');

async function seedGC() {
    try {
        // 1. Get GC Dept ID
        const [depts] = await db.execute("SELECT id FROM departments WHERE name LIKE '%Génie Civil%' OR name LIKE '%Civil%'");
        if (depts.length === 0) {
            console.error("Department 'Génie Civil' not found!");
            process.exit(1);
        }
        const deptId = depts[0].id;
        console.log(`Found Génie Civil Dept ID: ${deptId}`);

        // 2. Insert Formations
        const formations = [
            'L3 Génie Civil',
            'M1 Structures',
            'M2 Géotechnique'
        ];

        for (const fName of formations) {
            // Check if exists
            const [exists] = await db.execute('SELECT id FROM formations WHERE name = ? AND department_id = ?', [fName, deptId]);
            if (exists.length === 0) {
                await db.execute('INSERT INTO formations (name, department_id) VALUES (?, ?)', [fName, deptId]);
                console.log(`Created formation: ${fName}`);
            } else {
                console.log(`Formation already exists: ${fName}`);
            }
        }

        console.log("Seeding GC complete.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedGC();
