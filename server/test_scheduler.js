const { generateTimetable } = require('./scheduler');
const db = require('./db');

async function test() {
    console.log("🧪 Testing Scheduler Date Limits...");

    // 1. Reset a few exams to non-validated to give work to scheduler
    // We target Formation 1 (or any available)
    await db.execute("UPDATE exams SET is_validated = FALSE, date_time = NULL, room_id = NULL WHERE formation_id = 1 LIMIT 5");

    // 2. Run Scheduler with strict limits (June 11 - June 22)
    const filters = {
        startDate: '2025-06-11',
        endDate: '2025-06-22'
    };

    console.log("Running with filters:", filters);
    const result = await generateTimetable(filters);
    console.log("Result:", result);

    // 3. Check dates of scheduled exams
    const [exams] = await db.execute("SELECT id, date_time FROM exams WHERE formation_id = 1 AND is_validated = TRUE");

    console.log("📅 Checking Scheduled Dates:");
    let fail = false;
    exams.forEach(e => {
        const d = new Date(e.date_time);
        console.log(`Exam ${e.id}: ${d.toISOString()}`);
        if (d.getMonth() !== 5) { // 5 = June
            console.error(`❌ BAD DATE: Month is ${d.getMonth()}`);
            fail = true;
        }
    });

    if (!fail) console.log("✅ All dates are in June.");
    process.exit(0);
}

test();
