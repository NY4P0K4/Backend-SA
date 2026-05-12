require('dotenv').config();

const express = require('express');
const session = require('express-session');
const livereload = require('livereload');
const clr = require('connect-livereload');
const {Pool} = require('pg');
const app = express();
const port = 3000

const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

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
                categoria TEXT,
                descricao TEXT,
                valor NUMERIC,
                data TEXT,
                tipo TEXT
            )`);
    } catch(err) {
        return err.message;
    };
};

dbMake();

app.use(express.static('public'));
app.use(clr());
app.use(express.json());

app.get('/transactions', async(req, res) => {
    try {
        const trs = await db.query(`SELECT * FROM transactions`);
        console.log(trs.rows);
        return res.json(trs.rows);
    } catch(err) {
        return res.json({success: false, error: err.message});
    };
});

app.put('/transactions/:id', async (req, res) => {
    try {
        const { categoria, descricao, valor, data, tipo } = req.body;
        console.log(req.body)
        const trs = await db.query('UPDATE transactions SET categoria = $1, descricao = $2, valor = $3, data = $4, tipo = $5 WHERE id = $6 RETURNING *', [categoria, descricao, valor, data, tipo, req.params.id]);
        return res.json(trs.rows[0]);
    } catch (err) {
        return res.json({success: false, error: err.message});
    }
});

app.post('/transactions', async (req, res) => {
    try {
        const {userid, categoria, descricao, valor, data, tipo} = req.body;
        const trs = await db.query(`INSERT INTO transactions (userid, categoria, descricao, valor, data, tipo) VALUES ($1, $2, $3, $4, $5, $6)`, [userid ?? 0, categoria, descricao, valor, data, tipo]);
        console.log(trs.rows);
        return res.json(trs.rows[0]);
    } catch(err) {
        return res.json({success: false, error: err.message});
    };
});

app.delete('/transactions/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
        return res.sendStatus(204);
    } catch(err) {
        return res.json({success: false, error: err.message});
    };
});

app.listen(port, () => {console.log(`Running on https://localhost:${port}`)});