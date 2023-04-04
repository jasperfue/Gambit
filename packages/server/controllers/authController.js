const bcrypt = require("bcrypt");
const {query} = require("../src/database.js");
const {v4: uuidv4} = require('uuid');

module.exports.handleLogin = (req, res) => {
    if (req.session.user && req.session.user.username) {
        res.json({ loggedIn: true, username: req.session.user.username });
    } else {
        res.json({ loggedIn: false });
    }
};

module.exports.attemptLogin = async (req, res) => {
    const potentialLogin = await query(
        "SELECT id, username, password, userid FROM users u WHERE u.username=$1",
        [req.body.username]
    );
    if (potentialLogin.rowCount > 0) {
        const isSamePassword = await bcrypt.compare(
            req.body.password,
            potentialLogin.rows[0].password
        );
        if (isSamePassword) {
            req.session.user = {
                username: req.body.username,
                id: potentialLogin.rows[0].id,
                userid: potentialLogin.rows[0].userid,
            };
            req.session.save(err => {
                if(err) {
                    console.log('ERROR:', err);
                } else {
                    console.log(req.session)
                    res.json({loggedIn: true, username: req.body.username});
                }
            });
        } else {
            res.json({loggedIn: false, message: "Wrong username or password!"});
            console.log("not good");
        }
    } else {
        console.log("not good");
        res.json({loggedIn: false, message: "Wrong username or password!"});
    }
};

module.exports.attemptSignUp = async (req, res) => {
    const existingUserName = await query('SELECT username FROM users WHERE username=$1',
        [req.body.username]
    );
    const existingEmail = await query('SELECT email FROM users WHERE email=$1',
        [req.body.email]
    );
    if (existingUserName.rowCount === 0 && existingEmail.rowCount === 0) {
        //register
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        const newUserQuery = await query('INSERT INTO users(username, email, password, userid) values ($1, $2, $3, $4) RETURNING id, username, userid',
            [req.body.username, req.body.email, hashedPass, uuidv4()]
        );
        req.session.user = {
            username: req.body.username,
            id: newUserQuery.rows[0].id,
            userid: newUserQuery.rows[0].userid,
        }
        res.json({loggedIn: true, username: req.body.username})

    } else if (existingEmail.rowCount !== 0) {
        res.json({loggedIn:false, message:"There is already an Account with that Email"});
    } else if (existingUserName.rowCount !== 0) {
        res.json({loggedIn: false, message: "Username taken"});
    }
}