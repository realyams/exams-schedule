const db = require('./db');

async function checkUsers() {
    try {
        const [users] = await db.execute('SELECT id, email, role, full_name, password FROM users');
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- [${u.id}] ${u.email} (${u.role}) - Hash start: ${u.password ? u.password.substring(0, 10) : 'NULL'}`);
        });
        process.exit(0);
    } catch (e) {
        console.error('Error checking users:', e);
        process.exit(1);
    }
}

checkUsers();
