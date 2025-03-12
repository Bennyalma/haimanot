-- יצירת מסד הנתונים
CREATE DATABASE IF NOT EXISTS missing_persons_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE missing_persons_db;

-- טבלת נעדרים
CREATE TABLE IF NOT EXISTS missing_persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    age INT,
    last_location VARCHAR(255),
    contact_phone VARCHAR(20),
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    status ENUM('active', 'found', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    found_date TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת דיווחים
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    missing_person_id INT NOT NULL,
    report_number VARCHAR(20) UNIQUE NOT NULL,
    reporter_name VARCHAR(100),
    reporter_phone VARCHAR(20),
    additional_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (missing_person_id) REFERENCES missing_persons(id)
        ON DELETE CASCADE,
    INDEX idx_report_number (report_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת צפיות בנעדרים
CREATE TABLE IF NOT EXISTS sightings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    missing_person_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    reporter_name VARCHAR(100),
    reporter_phone VARCHAR(20),
    sighting_date TIMESTAMP NOT NULL,
    status ENUM('pending', 'verified', 'false_alarm') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (missing_person_id) REFERENCES missing_persons(id)
        ON DELETE CASCADE,
    INDEX idx_sighting_date (sighting_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת מעקב אחר שינויי סטטוס
CREATE TABLE IF NOT EXISTS status_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    missing_person_id INT NOT NULL,
    old_status ENUM('active', 'found', 'archived') NOT NULL,
    new_status ENUM('active', 'found', 'archived') NOT NULL,
    notes TEXT,
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (missing_person_id) REFERENCES missing_persons(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טריגר לתיעוד שינויי סטטוס
DELIMITER //
CREATE TRIGGER after_status_change
AFTER UPDATE ON missing_persons
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO status_updates 
            (missing_person_id, old_status, new_status, notes)
        VALUES 
            (NEW.id, OLD.status, NEW.status, 
             CONCAT('סטטוס שונה מ-', OLD.status, ' ל-', NEW.status));
    END IF;
END;//
DELIMITER ;

-- אינדקסים נוספים לביצועים
ALTER TABLE missing_persons
    ADD INDEX idx_location_status (last_location, status),
    ADD INDEX idx_age_status (age, status);

ALTER TABLE sightings
    ADD INDEX idx_location_date (location, sighting_date); 