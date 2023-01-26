const express = require('express');
const router = express.Router();
const Yup = require('yup');
require('yup-password')(Yup)
const {query} = require('../src/database.js');
const bcrypt = require('bcrypt');

const formSchemaLogin = Yup.object().shape({
    username: Yup.string()
        .required('Username required')
        .min(6, 'Username too Short!')
        .max(28, 'Username too long!'),
    password: Yup.string()
        .password()
        .required('Password required!'),
});

const formSchemaRegister = Yup.object().shape({
    username: Yup.string()
        .required('Username required')
        .min(6, 'Username too Short!')
        .max(28, 'Username too long!'),
    password: Yup.string()
        .password()
        .required('Password required!'),
    email: Yup.string()
        .email()
        .required('Email required!'),
});

router.route('/login')
    .get(async (req, res) => {
        if (req.session.user && req.session.user.username) {
            res.json({ loggedIn: true, username: req.session.user.username });
        } else {
            res.json({ loggedIn: false });
        }
    })
    .post(async (req, res) => {
        const formData = req.body;
        formSchemaLogin.validate(formData)
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
            /*    req.session.user = {
                    username: req.body.username,
                    id: potentialLogin.rows[0].id,
                };*/
                console.log('logged In')
                res.json({ loggedIn: true, username: req.body.username });
            } else {
                res.json({ loggedIn: false, status: "Wrong username or password!" });
                console.log("not good");
            }
        } else {
            console.log("not good");
            res.json({ loggedIn: false, status: "Wrong username or password!" });
        }
    })


router.post('/register', async (req, res) => {
    const formData = req.body;
    formSchemaRegister.validate(formData)
        .catch(err => {
            res.status(422).send();
            console.log(err.errors);
        }).then(valid => {
        if (valid) {
            console.log('Form is good');
        }
    });
    const existingUser = await query('SELECT username FROM users WHERE username=$1',
        [req.body.username]
    );
    if (existingUser.rowCount === 0) {
        //register
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        const newUserQuery = await query('INSERT INTO users(username, email, password) values ($1, $2, $3) RETURNING id, username',
            [req.body.username, req.body.email, hashedPass]
        );
/*        req.session.user = {
            username: req.body.username,
            id: newUserQuery.rows[0].id,
        }*/

    res.json({loggedIn: true, username: req.body.username})
    } else {
        res.json({loggedIn:false, status:"Username taken"});
    }
});

module.exports = router;