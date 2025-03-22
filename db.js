// db.js
import mysql from 'mysql2/promise';

let connection;

// פונקציה ליצירת חיבור למסד הנתונים
export async function getConnection() {
  if (connection) return connection;
  
  connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',       // שנה לפרטי המשתמש שלך
    password: 'Hentamano2025',       // שנה לסיסמה שלך
    database: 'missingpersonsdb'
  });
  
  console.log('Connected to database');
  
  // יצירת טבלה אם היא לא קיימת
  await connection.execute(`
    CREATE TABLE missingpersons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      age INT NOT NULL,
      last_location VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return connection;
}

// פונקציה לסגירת החיבור
export async function closeConnection() {
  if (connection) {
    await connection.end();
    console.log('Database connection closed');
  }
}

// פונקציה להוספת אדם נעדר
export async function addMissingPerson(full_name, age, last_location, image_url) {
  const conn = await getConnection();
  
  try {
    const [result] = await conn.execute(
      'INSERT INTO missingpersons (full_name, age, last_location, image_url) VALUES (?, ?, ?, ?)',
      [full_name, age, last_location, image_url]
    );
    
    return result.insertId;
  } catch (err) {
    console.error('Error in addMissingPerson:', err);
    throw err;
  }
}

// פונקציה לקבלת כל האנשים הנעדרים
export async function getAllMissingPersons() {
  const conn = await getConnection();
  
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM missingpersons ORDER BY created_at DESC'
    );
    
    return rows;
  } catch (err) {
    console.error('Error in getAllMissingPersons:', err);
    throw err;
  }
}


    
