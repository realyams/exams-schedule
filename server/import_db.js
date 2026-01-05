const db = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function importSchema() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon at end of lines
        const statements = sql
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements.`);

        for (const statement of statements) {
            // REMOVED comment check. MySQL/Driver handles comments.
            try {
                await db.query(statement);
            } catch (err) {
                console.error("Error executing statement:", statement.substring(0, 50) + "...", err.message);
            }
        }
        console.log("Schema import completed.");
        process.exit(0);
    } catch (e) {
        console.error("Fatal error:", e);
        process.exit(1);
    }
}

importSchema();
