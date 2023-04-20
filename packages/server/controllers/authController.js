const bcrypt = require("bcrypt");
const {query} = require("../src/database.js");
const {v4: uuidv4} = require('uuid');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookie = require("cookie");

const getJwtFromCookie = req => {
    const jwtCookie = req.headers["cookie"] && cookie.parse(req.headers["cookie"])["jwt"];
    return jwtCookie;
};

module.exports.handleLogout = (req, res) => {
    res.setHeader(
        "Set-Cookie",
        cookie.serialize("jwt", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: -1,
            sameSite: "lax",
            path: "/"
        })
    );
    res.sendStatus(204);
}



module.exports.handleLogin = (req, res) => {
    const token = getJwtFromCookie(req);
    if(!token) {
        res.json({loggedIn: false});
        return;
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
        if(err) {
            res.json({loggedIn: false});
            return;
        }
        res.json({loggedIn: true, username: decodedPayload.username});
        return;
    })
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
            const user = {
                username: req.body.username,
                id: potentialLogin.rows[0].id,
                userid: potentialLogin.rows[0].userid,
            }
            jwt.sign(
                user,
                process.env.JWT_SECRET,
                {expiresIn: "24h"},
                (err,token) => {
                if(err) {
                    console.log(err);
                    res.json({loggedIn: false, message: "Something went wrong, try again later"});
                    return;
                } else {
                    const jwtCookie = cookie.serialize("jwt", token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production", // Set the Secure flag only in production
                        maxAge: 24 * 60 * 60, // 24 hours
                        sameSite: "lax", // Optional: Set the SameSite attribute to 'lax' or 'strict' to prevent CSRF attacks
                        path: "/"
                    });
                    res.setHeader("Set-Cookie", jwtCookie);
                    res.json({loggedIn: true,  username: user.username});
                }
            }
            );
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
        const user = {
            username: req.body.username,
            id: newUserQuery.rows[0].id,
            userid: newUserQuery.rows[0].userid,
        }
        jwt.sign(
            user,
            process.env.JWT_SECRET,
            {expiresIn: "24h"},
            (err,token) => {
                if(err) {
                    console.log(err);
                    res.json({loggedIn: false, message: "Something went wrong, try again later"});
                    return;
                } else {
                    const jwtCookie = cookie.serialize("jwt", token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production", // Set the Secure flag only in production
                        maxAge: 24 * 60 * 60, // 24 hours
                        sameSite: "lax", // Optional: Set the SameSite attribute to 'lax' or 'strict' to prevent CSRF attacks
                        path: "/"
                    });
                    res.setHeader("Set-Cookie", jwtCookie);
                    res.json({loggedIn: true,  username: user.username});
                }
            }
        );

    } else if (existingEmail.rowCount !== 0) {
        res.json({loggedIn:false, message:"There is already an Account with that Email"});
    } else if (existingUserName.rowCount !== 0) {
        res.json({loggedIn: false, message: "Username taken"});
    }
}