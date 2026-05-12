const express = require('express');
const session = require('express-session');
const livereload = require('livereload');
const clr = require('connect-livereload');
const app = express();
const port = 3000;

const db = require('./database');

app.use(express.static('public'));
app.use(clr());
app.use(express.json());

app.get('/transactions', (req, res) => {
    try {
        const trs = db.prepare('SELECT * FROM transactions').all();
        console.log(trs);
        return res.json(trs);
    } catch(err) {
        return res.json({ success: false, error: err.message });
    }
});

app.post('/transactions', (req, res) => {
    try {
        const { userid, categoria, descricao, valor, data, tipo } = req.body;
        const result = db.prepare(
            'INSERT INTO transactions (userid, categoria, descricao, valor, data, tipo) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(userid ?? 0, categoria, descricao, valor, data, tipo);
        const nova = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
        console.log(nova);
        return res.json(nova);
    } catch(err) {
        return res.json({ success: false, error: err.message });
    }
});

app.put('/transactions/:id', (req, res) => {
    try {
        const { categoria, descricao, valor, data, tipo } = req.body;
        console.log(req.body);
        db.prepare(
            'UPDATE transactions SET categoria = ?, descricao = ?, valor = ?, data = ?, tipo = ? WHERE id = ?'
        ).run(categoria, descricao, valor, data, tipo, req.params.id);
        const trs = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
        return res.json(trs);
    } catch(err) {
        return res.json({ success: false, error: err.message });
    }
});

app.delete('/transactions/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
        return res.sendStatus(204);
    } catch(err) {
        return res.json({ success: false, error: err.message });
    }
});

app.listen(port, () => { console.log(`Running on https://localhost:${port}`); });