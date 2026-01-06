const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const path = require('path');
const { generateTimetable } = require('./scheduler');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token manquant." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token invalide." });
        req.user = user;
        next();
    });
};

// --- APP ROUTES ---

app.get('/', (req, res) => {
    res.send('Serveur UniSchedule (BDA) opérationnel ! Les APIs sont sous /api');
});

// DEPARTMENTS
app.get('/api/departments', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, code FROM departments');
        res.json(rows);
    } catch (e) {
        res.json([]);
    }
});

app.get(['/api/public/formations', '/api/formations'], async (req, res) => {
    const { deptId } = req.query;
    console.log(`🔍 Requête formations - deptId: ${deptId || 'Tous'}`);
    try {
        let query = 'SELECT id, name FROM formations';
        const params = [];
        if (deptId) {
            query += ' WHERE department_id = ?';
            params.push(deptId);
        }
        const [rows] = await db.execute(query, params);
        console.log(`✅ Formations trouvées: ${rows.length}`);
        res.json(rows);
    } catch (e) {
        console.error("❌ Erreur formations :", e.message);
        res.json([]);
    }
});

// CREATE FORMATION (Vice Doyen / Admin)
app.post('/api/formations', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'vice_doyen') {
        return res.status(403).json({ error: "Accès refusé" });
    }
    const { name, department_id } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO formations (name, department_id) VALUES (?, ?)',
            [name, department_id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur création formation" });
    }
});

// GET MODULES
app.get('/api/modules', async (req, res) => {
    const { formationId } = req.query;
    try {
        let query = 'SELECT id, name, formation_id FROM modules';
        const params = [];
        if (formationId) {
            query += ' WHERE formation_id = ?';
            params.push(formationId);
        }
        query += ' ORDER BY name';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.json([]);
    }
});

// CREATE MODULE (Vice Doyen / Admin)
app.post('/api/modules', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'vice_doyen') {
        return res.status(403).json({ error: "Accès refusé" });
    }
    const { name, formation_id } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO modules (name, formation_id) VALUES (?, ?)',
            [name, formation_id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur création module" });
    }
});

// AUTH: LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const user = users[0];
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            department_id: user.department_id
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// AUTH: SIGNUP
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, full_name, role, department_id, formation_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (email, password, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, role, department_id]
        );

        // If student and formation selected, auto-enroll
        if (role === 'etudiant' && formation_id) {
            await db.execute(
                'INSERT INTO student_enrollments (student_id, formation_id) VALUES (?, ?)',
                [result.insertId, formation_id]
            );
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: "L'email est déjà utilisé." });
    }
});

app.get('/api/exams', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT e.*, d.name as department_name, f.name as formation_name, r.name as room_name, u.full_name as professor_name
            FROM exams e
            JOIN formations f ON e.formation_id = f.id
            JOIN departments d ON f.department_id = d.id
            LEFT JOIN rooms r ON e.room_id = r.id
            LEFT JOIN users u ON e.responsible_professor_id = u.id
        `;
        const params = [];

        if (req.user.role === 'etudiant') {
            console.log(`API/EXAMS: Filtering by Enrolled Formation for Student ${req.user.id}`);
            // Join with enrollments to restrict to student's formations
            // AND ensure exam is validated (published)
            query += ' JOIN student_enrollments se ON f.id = se.formation_id WHERE se.student_id = ? AND e.is_validated = TRUE';
            params.push(req.user.id);
        } else if (req.user.role !== 'admin' && req.user.role !== 'vice_doyen' && req.user.department_id) {
            console.log(`API/EXAMS: Filtering by Dept ID ${req.user.department_id} for user ${req.user.email} (${req.user.role})`);
            query += ' WHERE f.department_id = ?';
            params.push(req.user.department_id);
        } else {
            console.log(`API/EXAMS: No Department filtering for user ${req.user.email} (${req.user.role})`);
        }

        const [rows] = await db.execute(query, params);
        console.log(`API/EXAMS: Found ${rows.length} exams.`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur récupération examens" });
    }
});

// SCHEDULING GENERATION
app.post('/api/schedule/generate', authenticateToken, async (req, res) => {
    const { filters } = req.body;
    const finalFilters = { ...filters };

    // Si l'utilisateur n'est pas admin et a un département, on restreint à son département
    if (req.user.role === 'chef_departement' && req.user.department_id) {
        finalFilters.deptId = req.user.department_id;
    }

    try {
        const result = await generateTimetable(finalFilters);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// VALIDATE SCHEDULE (Vice Doyen)
app.post('/api/schedule/validate', authenticateToken, async (req, res) => {
    if (req.user.role !== 'vice_doyen' && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Accès refusé" });
    }

    try {
        // Validate ALL scheduled exams (where date is set)
        // Optionally filtering by department could be added if needed, but "Global Validation" implies all.
        // Or we validate based on current "Pending" exams.
        const [result] = await db.execute(`
            UPDATE exams 
            SET is_validated = TRUE 
            WHERE date_time IS NOT NULL AND is_validated = FALSE
        `);

        console.log(`✅ Validated ${result.affectedRows} exams.`);
        res.json({ success: true, count: result.affectedRows });
    } catch (e) {
        console.error("Validation error:", e);
        res.status(500).json({ success: false, error: "Erreur validation" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
