import express from 'express';
import cors from 'cors';
import { getConnection, closeConnection, addMissingPerson, getAllMissingPersons } from './db.js';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3000;

// הגדרת middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

let db;

async function initialize() {
  db = await getConnection();
}

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Missingpersons API is running');
});

app.post('/addmissingpersons', upload.single('image_file'), async (req, res) => {
  try {
    const { full_name, age, last_location } = req.body;
    
    if (!full_name || !age || !last_location) {
      return res.status(400).send('חסרים שדות חובה');
    }
    
    if (!req.file) {
      return res.status(400).send('חסרה תמונה');
    }
    
    const image_url = `/uploads/${req.file.filename}`;
    
    await addMissingPerson(full_name, age, last_location, image_url);
    res.status(200).send('הנתונים נשמרו בהצלחה!');
    
    io.emit('new-missing-person', {
      full_name,
      age,
      last_location,
      image_url
    });
  } catch (err) {
    console.error('Error in /addmissingpersons:', err);
    res.status(500).send('שגיאה בשמירת הנתונים במסד הנתונים');
  }
});

// נתיב לטיפול בשליחת טופס
app.post('/addmissingperson', async (req, res) => {
  const { full_name, age, last_location, image_url } = req.body;
  
  if (!full_name || !age || !last_location || !image_url) {
    return res.status(400).send('חסרים שדות חובה');
  }
  
  try {
    await addMissingPerson(full_name, age, last_location, image_url);
    res.send('Data inserted successfully');
  } catch (err) {
    console.error('Error in /add-missing-person:', err);
    res.status(500).send('שגיאה בשמירת הנתונים במסד הנתונים');
  }
});

// נתיב להצגת כל הנתונים
app.get('/missingpersons', async (req, res) => {
  try {
    const results = await getAllMissingPersons();
    res.json(results);
  } catch (err) {
    console.error('Error in /missingpersons:', err);
    res.status(500).send('שגיאה בשליפת הנתונים');
  }
});

// סגירת החיבור בעת סיום השרת
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

// הפעלת השרת
const server = app.listen(port, () => {
  console.log(`server running on http://localhost:${port}`);
  initialize();
});

// הגדרת Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});