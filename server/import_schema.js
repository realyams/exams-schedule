const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function importSchema() {
    console.log('========================================');
    console.log('📥 IMPORTING SCHEMA.SQL');
    console.log('========================================\n');

    try {
        // Read schema.sql file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        console.log(`✓ Read schema.sql (${schema.length} characters)\n`);

        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'mysql-20957e76-habimaroua-a255.e.aivencloud.com',
            port: process.env.DB_PORT || 26878,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false },
            multipleStatements: true
        });

        console.log('✓ Connected to database\n');

        // Execute schema
        console.log('🔄 Executing SQL statements...\n');
        await connection.query(schema);

        console.log('\n========================================');
        console.log('✅ SCHEMA IMPORTED SUCCESSFULLY');
        console.log('========================================\n');

        // Verify counts
        const [depts] = await connection.execute('SELECT COUNT(*) as c FROM departments');
        const [rooms] = await connection.execute('SELECT COUNT(*) as c FROM rooms');
        const [formations] = await connection.execute('SELECT COUNT(*) as c FROM formations');
        const [users] = await connection.execute('SELECT COUNT(*) as c FROM users');
        const [exams] = await connection.execute('SELECT COUNT(*) as c FROM exams');

        console.log('📊 Verification:');
        console.log(`  - Departments: ${depts[0].c}`);
        console.log(`  - Rooms: ${rooms[0].c}`);
        console.log(`  - Formations: ${formations[0].c}`);
        console.log(`  - Users: ${users[0].c}`);
        console.log(`  - Exams: ${exams[0].c}`);
        console.log('\n========================================\n');

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

importSchema();
