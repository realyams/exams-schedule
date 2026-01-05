SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS conflicts;
DROP TABLE IF EXISTS surveillances;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS student_enrollments;
DROP TABLE IF EXISTS formations;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS exams_backup;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS examens;
DROP TABLE IF EXISTS departements;
DROP TABLE IF EXISTS etudiants;
DROP TABLE IF EXISTS professeurs;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS lieu_examen;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Départements
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL
);

-- 2. Utilisateurs (Admins, Profs, Etudiants)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'vice_doyen', 'chef_departement', 'professeur', 'etudiant') NOT NULL,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. Formations (L1, L2, Master, etc.)
CREATE TABLE formations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 4. Inscription des étudiants aux formations
CREATE TABLE student_enrollments (
    student_id INT NOT NULL,
    formation_id INT NOT NULL,
    PRIMARY KEY (student_id, formation_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
);

-- 5. Salles et Amphis
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    type ENUM('salle', 'amphi') DEFAULT 'salle'
);

-- 6. Examens
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(255) NOT NULL,
    date_time DATETIME DEFAULT NULL,
    duration INT DEFAULT 90, -- en minutes
    room_id INT,
    formation_id INT NOT NULL,
    responsible_professor_id INT,
    is_validated BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE,
    FOREIGN KEY (responsible_professor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Surveillances (Table pour l'équité des surveillances)
CREATE TABLE surveillances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    professor_id INT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (exam_id, professor_id)
);

-- 8. Conflits (Logiques critiques)
CREATE TABLE conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('student_overlap', 'professor_overlap', 'capacity_violation', 'equity_warning') NOT NULL,
    description TEXT,
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    exam_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

