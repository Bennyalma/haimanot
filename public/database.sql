CREATE DATABASE missingpersonsdb;
USE MissingPersonsDB;

CREATE TABLE missingPersons (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- מזהה ייחודי לכל נעדר
    שם הנעדרVARCHAR(255) NOT NULL,   -- שם מלא
    גיל INT,                           -- גיל
    מיקום אחרון VARCHAR(255),        -- מיקום אחרון
    file VARCHAR(255),            -- קישור לתמונה של הנעדר
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- תאריך הדיווח
);

-- הוספת נתונים לטבלה
INSERT INTO MissingPersons (full_name, age, last_location, image_url)
VALUES 
    ('ישראל ישראלי', 25, 'תל אביב', 'https://example.com/image1.jpg'),
    ('שרה כהן', 16, 'חיפה', 'https://example.com/image2.jpg');

-- בדיקת הנתונים
SELECT * FROM MissingPersons;

CREATE TABLE CitizenReports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,  -- מזהה ייחודי לדיווח
    missing_person_id INT NOT NULL,           -- מזהה הנעדר (מקושר לטבלה הראשית)
    description TEXT,                         -- תיאור מפורט (מה שהעד ראה/שמע)
    image_url VARCHAR(255),                   -- קישור לתמונה שהועלתה בדיווח
    video_url VARCHAR(255),                   -- קישור לסרטון שהועלה בדיווח
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- תאריך הדיווח
    reporter_ip VARCHAR(45),                  -- כתובת IP של המדווח (לצורך אנונימיות)
    
    FOREIGN KEY (missing_person_id) REFERENCES MissingPersons(id)
);

INSERT INTO MissingPersons (full_name, age, last_location, image_url)
VALUES 
    ('ישראל ישראלי', 25, 'תל אביב', 'https://example.com/image1.jpg'),
    ('שרה כהן', 16, 'חיפה', 'https://example.com/image2.jpg');

-- שאילתה לצפייה בטבלאות
SELECT * FROM MissingPersons;
SELECT * FROM CitizenReports;