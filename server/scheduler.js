const db = require('./db');

async function generateTimetable(filters = {}) {
    const { deptId, formationId, startDate, endDate } = filters;

    const PERIOD_START = new Date((startDate || '2025-06-01') + 'T08:00:00');
    const PERIOD_END = new Date((endDate || '2025-06-25') + 'T18:00:00');

    const DAILY_START = 8;
    const DAILY_END = 17;

    try {
        // 1. Exams to schedule
        console.log("--- SCHEDULER START ---");
        console.log("Filters:", filters);

        let sql = `SELECT * FROM exams WHERE is_validated = FALSE`;
        const params = [];

        if (formationId) {
            sql += ` AND formation_id = ?`;
            params.push(formationId);
        } else if (deptId) {
            sql += `
                AND formation_id IN (
                    SELECT id FROM formations WHERE department_id = ?
                )
            `;
            params.push(deptId);
        }

        const [exams] = await db.execute(sql, params);
        console.log(`Scheduler: Found ${exams.length} exams to schedule.`);
        if (!exams.length) return { success: true, scheduled: 0 };

        // 2. Rooms
        const [rooms] = await db.execute(
            `SELECT * FROM rooms ORDER BY capacity DESC`
        );

        // 3. Students per formation
        const [students] = await db.execute(`
            SELECT formation_id, COUNT(*) count
            FROM student_enrollments
            GROUP BY formation_id
        `);

        const formationSize = {};
        students.forEach(s => formationSize[s.formation_id] = s.count);

        // 4. Occupancy (validated exams)
        const [existing] = await db.execute(`
            SELECT date_time, duration, room_id, formation_id, responsible_professor_id
            FROM exams
            WHERE is_validated = TRUE
        `);

        const roomOcc = {}, formOcc = {}, profOcc = {};

        for (const e of existing) {
            const start = new Date(e.date_time);
            const end = new Date(start.getTime() + e.duration * 60000);

            roomOcc[e.room_id] ??= [];
            formOcc[e.formation_id] ??= [];
            profOcc[e.responsible_professor_id] ??= [];

            roomOcc[e.room_id].push({ start, end });
            formOcc[e.formation_id].push({ start, end });
            profOcc[e.responsible_professor_id].push({ start, end });
        }

        const free = (list, s, e) =>
            !list || !list.some(x => s < x.end && e > x.start);

        let scheduled = 0;

        // 5. Scheduling
        for (const exam of exams) {
            let date = new Date(PERIOD_START);
            let placed = false;

            while (!placed && date < PERIOD_END) {

                // ⛔ skip Friday (5) only
                if (date.getDay() === 5) {
                    date.setDate(date.getDate() + 1);
                    date.setHours(DAILY_START, 0, 0, 0);
                    continue;
                }

                const start = new Date(date);
                const end = new Date(start.getTime() + (exam.duration || 90) * 60000);

                if (end.getHours() > DAILY_END) {
                    console.log(`  [${exam.id}] Skip Date ${date.toLocaleDateString()} (Too late: ${end.getHours()}h)`);
                    date.setDate(date.getDate() + 1);
                    date.setHours(DAILY_START, 0, 0, 0);
                    continue;
                }

                // 1 exam/day per formation
                if (!free(formOcc[exam.formation_id], start, end)) {
                    console.log(`  [${exam.id}] Skip Date ${date.toLocaleDateString()} (Formation conflict)`);
                    date.setDate(date.getDate() + 1);
                    date.setHours(DAILY_START, 0, 0, 0);
                    continue;
                }

                // max 3/day per professor
                const profId = exam.responsible_professor_id;
                const profDay = (profOcc[profId] || []).filter(
                    x => x.start.toDateString() === start.toDateString()
                ).length;

                if (profDay >= 3) {
                    date.setHours(date.getHours() + 1);
                    continue;
                }

                for (const room of rooms) {
                    if ((formationSize[exam.formation_id] || 0) > room.capacity) {
                        // console.log(`    Room ${room.name} too small (${room.capacity} < ${formationSize[exam.formation_id]})`);
                        continue;
                    }
                    if (!free(roomOcc[room.id], start, end)) {
                        // console.log(`    Room ${room.name} occupied`);
                        continue;
                    }

                    await db.execute(
                        `UPDATE exams
                         SET date_time = ?, room_id = ?, is_validated = FALSE
                         WHERE id = ?`,
                        [start, room.id, exam.id]
                    );

                    roomOcc[room.id] ??= [];
                    formOcc[exam.formation_id] ??= [];
                    profOcc[profId] ??= [];

                    roomOcc[room.id].push({ start, end });
                    formOcc[exam.formation_id].push({ start, end });
                    profOcc[profId].push({ start, end });

                    scheduled++;
                    placed = true;
                    console.log(`  [${exam.id}] PLACED: ${start.toLocaleString()} in ${room.name}`);
                    break;
                }

                if (!placed) date.setHours(date.getHours() + 1);
            }
        }

        return { success: true, scheduled };

    } catch (err) {
        console.error('Scheduler error:', err);
        return { success: false, error: err.message };
    }
}

module.exports = { generateTimetable };
