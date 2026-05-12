const Database = require('better-sqlite3');

const db = new Database('database.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(20) NOT NULL UNIQUE,
        displayname VARCHAR(40),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        pfp TEXT DEFAULT '/images/pfpdefault.jpg',
        deleted BOOLEAN DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid INTEGER DEFAULT 0,
        categoria TEXT,
        descricao TEXT,
        valor REAL,
        data TEXT,
        tipo TEXT
    );
`);

module.exports = db;