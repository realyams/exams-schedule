const db = require('./db');

async function fixData() {
    try {
        console.log("🧹 Nettoyage des données en cours...");

        // 1. Count before
        const [before] = await db.execute('SELECT COUNT(*) as c FROM exams');
        console.log(`Avant: ${before[0].c} examens.`);

        // 2. Remove Friday Exams (MySQL DAYOFWEEK: 1=Sun, 6=Fri)
        const [fri] = await db.execute('DELETE FROM exams WHERE DAYOFWEEK(date_time) = 6');
        console.log(`❌ Supprimé ${fri.affectedRows} examens prévus le Vendredi.`);

        // 3. Remove Duplicates (Keep distinct by formation + module)
        // We keep the one with the smallest ID
        const [dupes] = await db.execute(`
            DELETE e1 FROM exams e1
            INNER JOIN exams e2 
            WHERE e1.id > e2.id 
            AND e1.formation_id = e2.formation_id 
            AND e1.module_name = e2.module_name
        `);
        console.log(`♻️ Supprimé ${dupes.affectedRows} examens dupliqués.`);

        // 4. Count after
        const [after] = await db.execute('SELECT COUNT(*) as c FROM exams');
        console.log(`Après: ${after[0].c} examens uniques.`);

        console.log("✅ Nettoyage terminé !");
        process.exit(0);
    } catch (e) {
        console.error("Erreur:", e);
        process.exit(1);
    }
}

fixData();
