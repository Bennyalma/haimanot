const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// הגדרות MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'chat_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// טעינת משתני הסביבה
dotenv.config();

const port = process.env.PORT || 5501;

// הגדרות Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// הגדרות העלאת קבצים
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|mp4|mov|avi/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('קבצים מסוג תמונה או וידאו בלבד מותרים'));
    }
});

// שמירת הודעות בזיכרון זמני (עד להעברה ל-DB)
let messages = [];
const MAX_MESSAGES = 100;

// ניהול חיבורי Socket.IO
io.on('connection', async (socket) => {
    console.log('משתמש התחבר:', socket.id);

    // שליחת הודעות קודמות למשתמש חדש
    socket.on('get previous messages', async () => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?',
                [MAX_MESSAGES]
            );
            socket.emit('previous messages', rows.reverse());
        } catch (error) {
            console.error('שגיאה בטעינת הודעות:', error);
        }
    });

    // קבלת הודעה חדשה
    socket.on('chat message', async (message) => {
        try {
            // שמירת ההודעה ב-DB
            const [result] = await pool.execute(
                'INSERT INTO messages (user_id, text, timestamp) VALUES (?, ?, ?)',
                [message.userId, message.text, new Date()]
            );
            
            message.id = result.insertId;
            
            // שידור ההודעה לכל המשתמשים
            io.emit('chat message', message);
            
            // שמירה בזיכרון זמני
            messages.push(message);
            if (messages.length > MAX_MESSAGES) {
                messages.shift();
            }
        } catch (error) {
            console.error('שגיאה בשמירת הודעה:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('משתמש התנתק:', socket.id);
    });
});

// נתיבי API
app.get('/api/messages', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?',
            [MAX_MESSAGES]
        );
        res.json(rows.reverse());
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בטעינת הודעות' });
    }
});

// יצירת טבלאות DB בהפעלה ראשונית
async function initDatabase() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('טבלת הודעות נוצרה בהצלחה');
    } catch (error) {
        console.error('שגיאה ביצירת טבלת הודעות:', error);
    }
}

// חיבור למסד הנתונים
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'missing_persons_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// בדיקת חיבור למסד הנתונים
db.getConnection((err, connection) => {
    if (err) {
        console.error('שגיאה בהתחברות למסד הנתונים:', err);
        return;
    }
    console.log('מחובר בהצלחה למסד הנתונים');
    connection.release();
});

// נתיבים (Routes)

// קבלת כל הנעדרים הפעילים
app.get('/api/missing-persons', (req, res) => {
    const query = `
        SELECT mp.*, 
               COUNT(DISTINCT s.id) as sighting_count,
               GROUP_CONCAT(DISTINCT s.location) as last_sightings
        FROM missing_persons mp
        LEFT JOIN sightings s ON mp.id = s.missing_person_id
        WHERE mp.status = 'active'
        GROUP BY mp.id
        ORDER BY mp.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('שגיאה בשליפת נתונים:', err);
            return res.status(500).json({ error: 'שגיאה בשליפת נתונים' });
        }
        res.json(results);
    });
});

// הוספת דיווח חדש על נעדר
app.post('/api/reports', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    const { name, description, contactNumber } = req.body;
    const photoUrl = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const videoUrl = req.files?.video ? `/uploads/${req.files.video[0].filename}` : null;

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // הוספת הנעדר
        const [result] = await connection.execute(
            'INSERT INTO missing_persons (name, description, contact_phone, image_url, video_url, status) VALUES (?, ?, ?, ?, ?, "active")',
            [name, description, contactNumber, photoUrl, videoUrl]
        );

        // יצירת מספר פנייה
        const reportId = `MP${result.insertId.toString().padStart(6, '0')}`;
        
        // הוספת רשומה לטבלת הדיווחים
        await connection.execute(
            'INSERT INTO reports (missing_person_id, report_number) VALUES (?, ?)',
            [result.insertId, reportId]
        );

        await connection.commit();
        res.status(201).json({
            success: true,
            reportId,
            message: 'הדיווח נשלח בהצלחה'
        });
    } catch (error) {
        await connection.rollback();
        console.error('שגיאה בשליחת הדיווח:', error);
        res.status(500).json({ error: 'שגיאה בשליחת הדיווח' });
    } finally {
        connection.release();
    }
});

// חיפוש נעדרים
app.get('/api/missing-persons/search', (req, res) => {
    const { name, area, ageRange, dateRange } = req.query;
    let query = 'SELECT * FROM missing_persons WHERE status = "active"';
    const params = [];

    if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }
    if (area) {
        query += ' AND last_location LIKE ?';
        params.push(`%${area}%`);
    }
    if (ageRange) {
        const [minAge, maxAge] = ageRange.split('-');
        query += ' AND age BETWEEN ? AND ?';
        params.push(minAge, maxAge);
    }
    if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        query += ' AND created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('שגיאה בחיפוש:', err);
            return res.status(500).json({ error: 'שגיאה בחיפוש' });
        }
        res.json(results);
    });
});

// הוספת דיווח על צפייה בנעדר
app.post('/api/sightings', (req, res) => {
    const { missingPersonId, location, description, reporterName, reporterPhone } = req.body;
    
    const query = `
        INSERT INTO sightings 
        (missing_person_id, location, description, reporter_name, reporter_phone, sighting_date)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;

    db.query(query, [missingPersonId, location, description, reporterName, reporterPhone], (err, result) => {
        if (err) {
            console.error('שגיאה בהוספת דיווח צפייה:', err);
            return res.status(500).json({ error: 'שגיאה בהוספת דיווח' });
        }
        res.status(201).json({
            success: true,
            sightingId: result.insertId,
            message: 'הדיווח על הצפייה נוסף בהצלחה'
        });
    });
});

// עדכון סטטוס נעדר
app.patch('/api/missing-persons/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    db.query(
        'UPDATE missing_persons SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id],
        (err, result) => {
            if (err) {
                console.error('שגיאה בעדכון סטטוס:', err);
                return res.status(500).json({ error: 'שגיאה בעדכון סטטוס' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'נעדר לא נמצא' });
            }
            res.json({ message: 'סטטוס עודכן בהצלחה' });
        }
    );
});

// טיפול בשגיאות
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'שגיאת שרת פנימית' });
});

// הפעלת השרת
http.listen(port, async () => {
    console.log(`השרת פועל בפורט ${port}`);
    await initDatabase();
}); 