const express = require('express');
const router = express.Router();
const {query} = require('../src/database.js');
const bcrypt = require('bcrypt');
const {LoginSchema, SignUpSchema} = require("@gambit/common");


router.route('/login')
    .get(async (req, res) => {
        if (req.session.user && req.session.user.username) {
            res.json({ loggedIn: true, username: req.session.user.username });
        } else {
            res.json({ loggedIn: false });
        }
    })
    .post(async (req, res) => {
        console.log(req.body);
        LoginSchema.validate(req.body)
            .catch(err => {
                res.status(422).send();
                console.log(err.errors);
            }).then(valid => {
            if (valid) {
                console.log('Form is good');
            }
        });
        const potentialLogin = await query(
            "SELECT id, username, password FROM users u WHERE u.username=$1",
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
                };
                res.json({ loggedIn: true, username: req.body.username });
            } else {
                res.json({ loggedIn: false, message: "Wrong username or password!" });
                console.log("not good");
            }
        } else {
            console.log("not good");
            res.json({ loggedIn: false, message: "Wrong username or password!" });
        }
    })


router.post('/signup', async (req, res) => {
    const formData = req.body;
    SignUpSchema.validate(formData)
        .catch(err => {
            res.status(422).send();
            console.log(err.errors);
        }).then(valid => {
        if (valid) {
            console.log('Form is good');
        }
    });
    const existingUserName = await query('SELECT username FROM users WHERE username=$1',
        [req.body.username]
    );
    const existingEmail = await query('SELECT email FROM users WHERE email=$1',
        [req.body.email]
    );
    if (existingUserName.rowCount === 0 && existingEmail.rowCount === 0) {
        //register
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        const newUserQuery = await query('INSERT INTO users(username, email, password) values ($1, $2, $3) RETURNING id, username',
            [req.body.username, req.body.email, hashedPass]
        );
        req.session.user = {
            username: req.body.username,
            id: newUserQuery.rows[0].id,
        }
        res.json({loggedIn: true, username: req.body.username})

    } else if (existingEmail.rowCount !== 0) {
        res.json({loggedIn:false, message:"There is already an Account with that Email"});
    } else if (existingUserName.rowCount !== 0) {
        res.json({loggedIn: false, message: "Username taken"});
    }
});

module.exports = router;