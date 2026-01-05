const { generateTimetable } = require('./scheduler');

async function test() {
    console.log("Starting test generation...");
    try {
        const result = await generateTimetable({
            startDate: '2025-06-01',
            endDate: '2025-06-20'
        });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("CRASHED:", error);
    }
}

test();
