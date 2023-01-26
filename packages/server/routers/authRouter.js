const express = require('express');
const router = express.Router();
const Yup = require('yup');
require('yup-password')(Yup)
const {query} = require('../src/database.js');
const bcrypt = require('bcrypt');

const formSchema = Yup.object().shape({
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


router.post('/register', async (req, res) => {
    console.log('hallo?');
    const formData = req.body;
    formSchema.validate(formData)
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
        /*
        req.session.user = {
            username: req.body.username,
            id: newUserQuery.rows[0].id,
        }
         */

    res.json({loggedIn: true, username: req.body.username})
    } else {
        res.json({loggedIn:false, status:"Username taken"});
    }
});

module.exports = router;