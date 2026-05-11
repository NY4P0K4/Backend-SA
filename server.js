const express = require('express');
const session = require('express-session');
const livereload = require('livereload');
const clr = require('connect-livereload');
const {Pool} = require('pg');
const app = express();
const port = 3000

const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kanban',
    password: 'senai',
    port: 5432
})

db.query('SELECT NOW()', (err, res) => {
    if(err)
        return console.log(err.message);
    else
        return console.log(res.rows[0].now)
});

const dbMake = async() => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(20) NOT NULL UNIQUE,
                displayname VARCHAR(40),
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                pfp TEXT DEFAULT '/images/pfpdefault.jpg'
            )`);
        await db.query(
            `CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                userid INT DEFAULT 0,
                value NUMERIC
            )`);
    } catch(err) {
        return err.message;
    };
};

app.get('/transactions', async(req, res) => {
    try {
        const trs = await db.query('SELECT * FROM transactions');
        return res.json({success: true, value: trs.rows});
    } catch(err) {
        return res.json({success: false, error: err.message});
    };
});

app.get('/transactions/:id', async(req, res) => {
    try {
        const trs = await db.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
        return res.json({success: true, value: trs.rows});
    } catch(err) {
        return res.json({success: false, error: err.message});
    };
});

app.post('/transactions', (req, res) => {
    try {
        return res.json({success: false, error: 'WIP'});
    } catch(err) {
        return res.json({success: false, error: err.message});
    };
});

dbMake();

app.use(express.static('public'));
app.use(clr());

app.listen(port, () => {console.log(`Running on https://localhost:${port}`)});