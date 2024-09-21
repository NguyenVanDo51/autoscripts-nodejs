const sqlite3 = require('sqlite3').verbose();

// Mở kết nối đến cơ sở dữ liệu SQLite
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Tạo bảng 'user' nếu chưa tồn tại
db.run(`CREATE TABLE IF NOT EXISTS user (
  username TEXT PRIMARY KEY,
  proxy TEXT,
  blum TEXT
)`);

module.exports = db;
