const db = require('./db');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const email = 'prof.alim@uni.dz';
        const hashedPassword = await bcrypt.hash('password123', 10);

        await db.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        console.log(`Password for ${email} reset to 'password123'.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetPassword();
