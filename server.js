const express = require('express');
const session = require('express-session');
const livereload = require('livereload');
const clr = require('connect-livereload');
const path = require("path");
const bcrypt = require('bcrypt');
const multer = require('multer');
const app = express();
const port = 3000;

const db = require('./database');

// Session configuration constants
const saltrounds = 10;

// Validation function for signup
function check(username, email, password, confirmation) {
    const minUsernameLength = 3;
    const minPasswordLength = 6;
    
    if (username.length < minUsernameLength) {
        return [false, 'username', 'Username must be at least 3 characters long.'];
    }
    if (!email.includes('@')) {
        return [false, 'email', 'Please enter a valid email address.'];
    }
    if (password.length < minPasswordLength) {
        return [false, 'password', 'Password must be at least 6 characters long.'];
    }
    if (password !== confirmation) {
        return [false, 'confirmation', 'Passwords do not match.'];
    }
    return [true];
}

// Session middleware configuration
app.use(session({
    secret: 'your-secret-key', // Change this to a secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

app.use(express.static('public'));
app.use(clr());
app.use(express.json());

app.post('/login', (req, res) => {
    const {email, password} = req.body;

    db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)', [email], async (err, dbres) => {
        if(err) return res.json({success: false});
        if(!dbres.rows) return res.json({success: false, error: 'Account does not exist.'});
        if(dbres.rows[0].deleted) return res.json({success: false, error: 'This account was deleted.'});

        const match = await bcrypt.compare(password, dbres.rows[0].password);

        if(!match)
            return res.json({success: false, error: 'Invalid Email or Password'})

        req.session.userid = dbres.rows[0].id;
        req.session.user = {
            userid: dbres.rows[0].id,
            username: dbres.rows[0].username,
            displayname: dbres.rows[0].displayname,
            pfp: dbres.rows[0].pfp
        };
        
        return res.json({success: match, user: req.session.user});
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => res.send('Logged out'));
});

app.get('/api/check-auth', (req, res) => {
    if(req.session.userid && req.session.user)
        return res.json({loggedIn: true, user: req.session.user});
    return res.json({loggedIn: false});
});

app.post('/signup', (req, res) => {
    const {username, disp, email, password, confirmation} = req.body;

    var valid = check(username, email, password, confirmation)

    if(valid[0] === false)
        return res.json({success: false, what: valid[1], cerror: valid[2]});

    db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)', [email, username], (err, dbres) => {
        if(err) return res.json({success:false, error:err});

        if(dbres.rows[0] && dbres.rows[0].email === email)
            return res.json({success: false, cerror: 'Email is already in use.'});
        else if(dbres.rows[0] && dbres.rows[0].username === username)
            return res.json({success: false, cerror: 'Username is already in use.'});
        else {
            bcrypt.hash(password, saltrounds, (err, hash) => {
                if(err)
                    return res.json({success:false, error:err});

                db.query('INSERT INTO users (username, displayname, email, password) VALUES ($1, $2, $3, $4)', [username, disp, email, hash], function(err){
                        if(err)
                            return res.json({success:false, error:'Account already exists'});
                        return res.json({success:true});
                    }
                );
            });
        };
    });
});


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