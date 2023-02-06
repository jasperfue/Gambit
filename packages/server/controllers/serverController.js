const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = require('../src/redis.js');
require('dotenv').config();

const sessionMiddleware = session({
    secret: process.env.COOKIE_SECRET,
    credentials: true,
    name: "sid",
    store: new RedisStore({client: redisClient}),
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? "true" : "auto",
        httpOnly: false,
        expires: 1000 * 60 * 60 * 6,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
});

const wrap = (expressMiddleware) => (socket, next) => {
    expressMiddleware(socket.request, {}, next);
}
const corsConfig = {
    origin: 'http://localhost:3000',
    credentials: true,
}



module.exports = {sessionMiddleware, wrap, corsConfig};