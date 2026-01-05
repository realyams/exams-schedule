const db = require('./db');
const bcrypt = require('bcryptjs');

// Configuration
const NUM_DEPARTMENTS = 7;
const NUM_FORMATIONS = 200;
const NUM_STUDENTS = 13000;
const BATCH_SIZE = 500; // Reduced batch size for stability

// Département names and codes
const DEPARTMENTS = [
    { name: 'Informatique', code: 'INFO' },
    { name: 'Mathématiques', code: 'MATH' },
    { name: 'Génie Civil', code: 'GC' },
    { name: 'Physique', code: 'PHY' },
    { name: 'Chimie', code: 'CHEM' },
    { name: 'Biologie', code: 'BIO' },
    { name: 'Économie', code: 'ECO' }
];

// Formation levels and specializations
const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2'];
const SPECIALIZATIONS = {
    'Informatique': ['Base', 'Réseaux', 'Big Data', 'IA', 'Cybersécurité', 'Web', 'Mobile'],
    'Mathématiques': ['Base', 'Appliquées', 'Statistiques', 'Finance', 'Modélisation', 'Cryptographie'],
    'Génie Civil': ['Base', 'Structures', 'Géotechnique', 'Hydraulique', 'Construction', 'Routes'],
    'Physique': ['Base', 'Nucléaire', 'Quantique', 'Matériaux', 'Énergies', 'Astrophysique'],
    'Chimie': ['Base', 'Organique', 'Inorganique', 'Analytique', 'Industrielle', 'Environnement'],
    'Biologie': ['Base', 'Cellulaire', 'Moléculaire', 'Écologie', 'Microbiologie', 'Génétique'],
    'Économie': ['Base', 'Gestion', 'Finance', 'Commerce', 'Marketing', 'Développement']
};

// Modules typiques par niveau
const MODULES_BY_LEVEL = {
    'L1': ['Mathématiques 1', 'Physique 1', 'Introduction Spécialité', 'Langues', 'Communication'],
    'L2': ['Mathématiques 2', 'Statistiques', 'Méthodologie', 'Projet 1', 'Anglais Technique'],
    'L3': ['Projet Fin Cycle', 'Spécialisation 1', 'Spécialisation 2', 'Stage', 'Séminaire'],
    'M1': ['Recherche Opérationnelle', 'Projet Avancé', 'Spécialisation Avancée 1', 'Spécialisation Avancée 2', 'Méthodologie Recherche'],
    'M2': ['Mémoire', 'Séminaire Recherche', 'Spécialisation Expert', 'Stage Professionnel', 'Veille Technologique']
};

//first names
const FIRST_NAMES = [
    'Mohamed', 'Ahmed', 'Fatima', 'Amina', 'Youcef', 'Karim', 'Sarah', 'Leila',
    'Ali', 'Rachid', 'Samia', 'Naima', 'Omar', 'Sofiane', 'Meriem', 'Assia',
    'Amine', 'Mehdi', 'Yasmine', 'Dounia', 'Walid', 'Hamza', 'Rania', 'Nesrine',
    'Bilal', 'Riadh', 'Hanane', 'Salima', 'Tarek', 'Samir', 'Nabila', 'Karima'
];

const LAST_NAMES = [
    'Benali', 'Mansouri', 'Rahmani', 'Kadi', 'Alim', 'Bouaziz', 'Cherif', 'Djelloul',
    'Hamidi', 'Messaoud', 'Ould', 'Saadi', 'Taleb', 'Yahi', 'Ziani', 'Amrani',
    'Boudaoud', 'Chaoui', 'Djebaili', 'Ghazi', 'Khaled', 'Larbi', 'Mounir', 'Nabil',
    'Ouali', 'Reguieg', 'Sahli', 'Toumi', 'Yahia', 'Zenati', 'Brahimi', 'Ferroudj'
];

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateFullName() {
    return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

async function generateData() {
    console.log('========================================');
    console.log('GÉNÉRATION DE DONNÉES MASSIVES');
    console.log('========================================');
    console.log(`Départements: ${NUM_DEPARTMENTS}`);
    console.log(`Filières: ${NUM_FORMATIONS}`);
    console.log(`Étudiants: ${NUM_STUDENTS}`);
    console.log('========================================\n');

    const startTime = Date.now();

    try {
        // STEP 1: Insert Rooms
        console.log('ÉTAPE 1/6: Insertion des salles et amphithéâtres...');
        const rooms = [
            // Amphithéâtres (8)
            ['Amphi A - Ibn Khaldoun', 300, 'amphi'],
            ['Amphi B - Averroès', 250, 'amphi'],
            ['Amphi C - Al Khawarizmi', 200, 'amphi'],
            ['Amphi D - Ibn Sina', 200, 'amphi'],
            ['Amphi E - Al Biruni', 180, 'amphi'],
            ['Amphi F - Al Idrissi', 150, 'amphi'],
            ['Amphi G - Ibn Rushd', 150, 'amphi'],
            ['Amphi H - Al Razi', 120, 'amphi'],
            // Salles TP/TD (15)
            ['Salle TP 101', 50, 'salle'],
            ['Salle TP 102', 50, 'salle'],
            ['Salle TP 103', 50, 'salle'],
            ['Salle TD 201', 45, 'salle'],
            ['Salle TD 202', 45, 'salle'],
            ['Salle TD 203', 40, 'salle'],
            ['Salle TD 204', 40, 'salle'],
            ['Salle TD 301', 35, 'salle'],
            ['Salle TD 302', 35, 'salle'],
            ['Salle TD 303', 35, 'salle'],
            ['Salle Cours 401', 60, 'salle'],
            ['Salle Cours 402', 60, 'salle'],
            ['Salle Cours 403', 55, 'salle'],
            ['Salle Cours 404', 55, 'salle'],
            ['Salle Cours 405', 50, 'salle'],
            // Laboratoires (12)
            ['Labo Informatique 1', 40, 'salle'],
            ['Labo Informatique 2', 40, 'salle'],
            ['Labo Informatique 3', 35, 'salle'],
            ['Labo Physique', 30, 'salle'],
            ['Labo Chimie Organique', 30, 'salle'],
            ['Labo Chimie Inorganique', 30, 'salle'],
            ['Labo Biologie', 35, 'salle'],
            ['Labo Microbiologie', 25, 'salle'],
            ['Labo Génie Civil', 40, 'salle'],
            ['Salle Multimédia 1', 45, 'salle'],
            ['Salle Multimédia 2', 45, 'salle'],
            ['Salle Séminaire', 80, 'salle']
        ];

        for (const room of rooms) {
            const [existing] = await db.execute(
                'SELECT id FROM rooms WHERE name = ?',
                [room[0]]
            );

            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO rooms (name, capacity, type) VALUES (?, ?, ?)',
                    room
                );
            }
        }
        console.log(`✓ ${rooms.length} salles créées\n`);

        // STEP 2: Insert Departments
        console.log('ÉTAPE 2/6: Insertion des départements...');
        for (const dept of DEPARTMENTS) {
            const [existing] = await db.execute(
                'SELECT id FROM departments WHERE code = ?',
                [dept.code]
            );

            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO departments (name, code) VALUES (?, ?)',
                    [dept.name, dept.code]
                );
                console.log(`✓ Créé: ${dept.name} (${dept.code})`);
            } else {
                console.log(`⊙ Existe déjà: ${dept.name} (${dept.code})`);
            }
        }

        // Get department IDs
        const [deptResults] = await db.execute('SELECT id, name FROM departments');
        const deptMap = {};
        deptResults.forEach(d => {
            deptMap[d.name] = d.id;
        });
        console.log(`\n✓ ${deptResults.length} départements prêts\n`);

        // STEP 3: Insert Roles (Users)
        console.log('ÉTAPE 3/6: Insertion des utilisateurs (admin, vice-doyen, chefs, professeurs)...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Admin and Vice-Doyen
        const [adminExists] = await db.execute('SELECT id FROM users WHERE email = ?', ['admin@uni.dz']);
        if (adminExists.length === 0) {
            await db.execute(
                'INSERT INTO users (email, password, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)',
                ['admin@uni.dz', hashedPassword, 'Admin Principal', 'admin', null]
            );
        }

        const [viceExists] = await db.execute('SELECT id FROM users WHERE email = ?', ['vice.doyen@uni.dz']);
        if (viceExists.length === 0) {
            await db.execute(
                'INSERT INTO users (email, password, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)',
                ['vice.doyen@uni.dz', hashedPassword, 'Dr. Hamza Khedim', 'vice_doyen', null]
            );
        }

        // Chef de département for each department
        const chefNames = ['Mohamed Benali', 'Fatima Mansouri', 'Ahmed Bouaziz', 'Karim Djelloul', 'Amina Cherif', 'Sarah Rahmani', 'Youcef Kadi'];
        for (let i = 0; i < DEPARTMENTS.length; i++) {
            const email = `chef.${DEPARTMENTS[i].code.toLowerCase()}@uni.dz`;
            const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (exists.length === 0) {
                await db.execute(
                    'INSERT INTO users (email, password, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)',
                    [email, hashedPassword, `Dr. ${chefNames[i]}`, 'chef_departement', deptMap[DEPARTMENTS[i].name]]
                );
            }
        }

        // Professors (2 per department)
        const profNames = ['Omar', 'Leila', 'Rachid', 'Meriem', 'Sofiane', 'Assia', 'Mehdi', 'Yasmine', 'Walid', 'Dounia', 'Hamza', 'Rania', 'Bilal', 'Nesrine'];
        for (let i = 0; i < 14; i++) {
            const deptId = Math.floor(i / 2);
            const email = `prof${i + 1}@uni.dz`;
            const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (exists.length === 0) {
                await db.execute(
                    'INSERT INTO users (email, password, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)',
                    [email, hashedPassword, `Pr. ${profNames[i]}`, 'professeur', deptMap[DEPARTMENTS[deptId].name]]
                );
            }
        }
        console.log('✓ Utilisateurs créés (admins, chefs, professeurs)\n');

        // STEP 4: Insert Formations
        console.log('ÉTAPE 4/6: Insertion des filières...');
        const formationsPerDept = Math.floor(NUM_FORMATIONS / NUM_DEPARTMENTS);
        let formationCount = 0;

        for (const dept of DEPARTMENTS) {
            const deptId = deptMap[dept.name];
            const specs = SPECIALIZATIONS[dept.name];
            let deptFormationCount = 0;

            for (const level of LEVELS) {
                for (const spec of specs) {
                    if (formationCount >= NUM_FORMATIONS) break;

                    const formationName = spec === 'Base'
                        ? `${level} ${dept.name}`
                        : `${level} ${spec}`;

                    const [existing] = await db.execute(
                        'SELECT id FROM formations WHERE name = ? AND department_id = ?',
                        [formationName, deptId]
                    );

                    if (existing.length === 0) {
                        await db.execute(
                            'INSERT INTO formations (name, department_id) VALUES (?, ?)',
                            [formationName, deptId]
                        );
                        formationCount++;
                    }

                    // Count both new and existing formations
                    deptFormationCount++;

                    if (deptFormationCount >= formationsPerDept) break;
                }
                if (deptFormationCount >= formationsPerDept || formationCount >= NUM_FORMATIONS) break;
            }
            console.log(`✓ ${dept.name}: ${deptFormationCount} filières`);
        }

        // Get actual total from database
        const [totalFormations] = await db.execute('SELECT COUNT(*) as total FROM formations');
        console.log(`\n✓ Total: ${formationCount} nouvelles filières créées`);
        console.log(`✓ Total dans la base: ${totalFormations[0].total} filières\n`);

        // Get formation IDs with their names and levels
        const [formationResults] = await db.execute('SELECT id, name FROM formations');
        const formationIds = formationResults.map(f => f.id);

        // STEP 4.5: Insert Modules for each Formation
        console.log('\nÉTAPE 4.5/6: Génération des modules pour chaque filière...');
        let moduleCount = 0;
        const modulesByFormation = {};

        for (const formation of formationResults) {
            // Déterminer le niveau (L1, L2, L3, M1, M2)
            let level = 'L1';
            for (const lvl of LEVELS) {
                if (formation.name.includes(lvl)) {
                    level = lvl;
                    break;
                }
            }

            // Générer 5-8 modules par filière
            const numModules = Math.floor(Math.random() * 4) + 5; // 5-8 modules
            const baseModules = MODULES_BY_LEVEL[level] || MODULES_BY_LEVEL['L1'];
            const formationModules = [];

            for (let i = 0; i < numModules && i < baseModules.length; i++) {
                const moduleName = baseModules[i];
                formationModules.push(moduleName);
                moduleCount++;
            }

            modulesByFormation[formation.id] = formationModules;
        }
        console.log(`✓ ${moduleCount} modules générés pour ${formationResults.length} filières\n`);

        // STEP 4.6: Insert Sample Exams with Proper Constraints
        console.log('ÉTAPE 4.6/6: Génération d\'examens avec contraintes...');
        const [roomList] = await db.execute('SELECT id, capacity, type FROM rooms ORDER BY capacity DESC');
        const [profList] = await db.execute("SELECT id, department_id FROM users WHERE role = 'professeur'");

        let generatedExamCount = 0;
        const validatedExams = [];

        // Générer 2-3 examens validés par filière (avec dates)
        const startDate = new Date('2025-06-05');
        const timeSlots = ['09:00:00', '14:00:00'];
        let currentDayOffset = 0;

        for (const formation of formationResults) { // Toutes les filières pour les examens validés
            const modules = modulesByFormation[formation.id] || [];
            const numExams = Math.min(2, modules.length); // 2 examens validés max par filière

            for (let i = 0; i < numExams; i++) {
                const moduleName = modules[i];
                const examDate = new Date(startDate);

                // Respecter: 1 examen par jour par formation (pas de Vendredi)
                let dayOffset = currentDayOffset;
                while (examDate.getDay() === 5) { // Skip Friday
                    dayOffset++;
                    examDate.setDate(startDate.getDate() + dayOffset);
                }
                examDate.setDate(startDate.getDate() + dayOffset);

                const timeSlot = timeSlots[i % timeSlots.length];
                const dateTimeStr = `${examDate.toISOString().split('T')[0]} ${timeSlot}`;

                // Choisir une salle adaptée (capacité raisonnable)
                const room = randomElement(roomList.slice(0, 15)); // Salles moyennes/grandes

                // Choisir un professeur aléatoire
                const prof = randomElement(profList);

                const duration = [90, 120][Math.floor(Math.random() * 2)];

                try {
                    await db.execute(
                        'INSERT IGNORE INTO exams (module_name, date_time, duration, room_id, formation_id, responsible_professor_id, is_validated) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
                        [moduleName, dateTimeStr, duration, room.id, formation.id, prof.id]
                    );
                    generatedExamCount++;
                } catch (error) {
                    // Skip en cas de conflit
                }

                currentDayOffset += 1; // Jour suivant
            }
        }

        // Générer examens NON validés (à planifier)
        for (const formation of formationResults) { // Toutes les filières
            const modules = modulesByFormation[formation.id] || [];
            const numNonValidated = Math.min(3, modules.length - 2); // 3 examens non validés

            for (let i = 2; i < 2 + numNonValidated && i < modules.length; i++) {
                const moduleName = modules[i];
                const prof = randomElement(profList);
                const duration = [90, 120][Math.floor(Math.random() * 2)];

                try {
                    await db.execute(
                        'INSERT IGNORE INTO exams (module_name, formation_id, responsible_professor_id, is_validated, duration) VALUES (?, ?, ?, FALSE, ?)',
                        [moduleName, formation.id, prof.id, duration]
                    );
                    generatedExamCount++;
                } catch (error) {
                    // Skip
                }
            }
        }
        console.log(`✓ ${generatedExamCount} examens générés (validés + non validés)\n`);

        // STEP 4.7: Insert Surveillances for validated exams
        console.log('ÉTAPE 4.7/6: Génération des surveillances...');
        const [validatedExamsList] = await db.execute(
            'SELECT id, formation_id FROM exams WHERE is_validated = TRUE AND date_time IS NOT NULL'
        );

        let generatedSurveillanceCount = 0;
        for (const exam of validatedExamsList) {
            // 2 professeurs par examen
            const prof1 = randomElement(profList);
            let prof2 = randomElement(profList);
            while (prof2.id === prof1.id) {
                prof2 = randomElement(profList);
            }

            try {
                await db.execute(
                    'INSERT IGNORE INTO surveillances (exam_id, professor_id) VALUES (?, ?)',
                    [exam.id, prof1.id]
                );
                await db.execute(
                    'INSERT IGNORE INTO surveillances (exam_id, professor_id) VALUES (?, ?)',
                    [exam.id, prof2.id]
                );
                generatedSurveillanceCount += 2;
            } catch (error) {
                // Skip
            }
        }
        console.log(`✓ ${generatedSurveillanceCount} surveillances créées\n`);

        // STEP 5: Insert Students
        console.log('ÉTAPE 5/6: Insertion des étudiants...');
        console.log('(Cela peut prendre plusieurs minutes...)\n');

        let insertedStudents = 0;

        for (let i = 1; i <= NUM_STUDENTS; i++) {
            const deptId = randomElement(Object.values(deptMap));

            try {
                await db.execute(
                    'INSERT IGNORE INTO users (email, password, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)',
                    [`etudiant${i}@uni.dz`, hashedPassword, generateFullName(), 'etudiant', deptId]
                );
                insertedStudents++;
            } catch (error) {
                // Skip if already exists
                if (!error.message.includes('Duplicate')) {
                    console.error(`Error inserting student ${i}:`, error.message);
                }
            }

            // Progress indicator
            if (i % 1000 === 0) {
                const progress = ((i / NUM_STUDENTS) * 100).toFixed(1);
                console.log(`   Progression: ${progress}% (${i}/${NUM_STUDENTS})`);
            }
        }
        console.log(`\n✓ ${insertedStudents} étudiants créés\n`);

        // STEP 6: Insert Student Enrollments
        console.log('ÉTAPE 6/6: Inscription des étudiants aux filières...');
        console.log('(Cela peut prendre plusieurs minutes...)\n');

        const [students] = await db.execute(
            `SELECT id FROM users WHERE role = 'etudiant' ORDER BY id DESC LIMIT ${NUM_STUDENTS}`
        );

        let insertedEnrollments = 0;

        for (let i = 0; i < students.length; i++) {
            const studentId = students[i].id;
            const numEnrollments = Math.floor(Math.random() * 3) + 1; // 1-3 formations

            // Get unique random formations
            const selectedFormations = new Set();
            while (selectedFormations.size < numEnrollments) {
                selectedFormations.add(randomElement(formationIds));
            }

            for (const formationId of selectedFormations) {
                try {
                    await db.execute(
                        'INSERT IGNORE INTO student_enrollments (student_id, formation_id) VALUES (?, ?)',
                        [studentId, formationId]
                    );
                    insertedEnrollments++;
                } catch (error) {
                    // Skip duplicates
                }
            }

            // Progress indicator
            if ((i + 1) % 1000 === 0 || i === students.length - 1) {
                const progress = (((i + 1) / students.length) * 100).toFixed(1);
                console.log(`   Progression: ${progress}% (${i + 1}/${students.length})`);
            }
        }
        console.log(`\n✓ ${insertedEnrollments} inscriptions créées\n`);

        // FINAL SUMMARY
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('========================================');
        console.log('GÉNÉRATION TERMINÉE AVEC SUCCÈS');
        console.log('========================================');
        console.log(`Durée totale: ${duration} secondes`);
        console.log('\nRécapitulatif:');

        const [deptCount] = await db.execute('SELECT COUNT(*) as c FROM departments');
        const [roomCount] = await db.execute('SELECT COUNT(*) as c FROM rooms');
        const [formCount] = await db.execute('SELECT COUNT(*) as c FROM formations');
        const [adminCount] = await db.execute('SELECT COUNT(*) as c FROM users WHERE role IN ("admin", "vice_doyen")');
        const [chefCount] = await db.execute('SELECT COUNT(*) as c FROM users WHERE role = "chef_departement"');
        const [profCount] = await db.execute('SELECT COUNT(*) as c FROM users WHERE role = "professeur"');
        const [studCount] = await db.execute('SELECT COUNT(*) as c FROM users WHERE role = ?', ['etudiant']);
        const [enrolCount] = await db.execute('SELECT COUNT(*) as c FROM student_enrollments');
        const [examCount] = await db.execute('SELECT COUNT(*) as c FROM exams');
        const [validatedExamCount] = await db.execute('SELECT COUNT(*) as c FROM exams WHERE is_validated = TRUE');
        const [surveillanceCount] = await db.execute('SELECT COUNT(*) as c FROM surveillances');

        console.log(`  - Départements: ${deptCount[0].c}`);
        console.log(`  - Salles: ${roomCount[0].c}`);
        console.log(`  - Filières: ${formCount[0].c}`);
        console.log(`  - Administrateurs: ${adminCount[0].c}`);
        console.log(`  - Chefs de département: ${chefCount[0].c}`);
        console.log(`  - Professeurs: ${profCount[0].c}`);
        console.log(`  - Étudiants: ${studCount[0].c}`);
        console.log(`  - Inscriptions: ${enrolCount[0].c}`);
        console.log(`  - Examens: ${examCount[0].c} (${validatedExamCount[0].c} validés)`);
        console.log(`  - Surveillances: ${surveillanceCount[0].c}`);
        console.log('========================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

generateData();
