const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const socketServer = require('./src/socketServer.js');
const authRouter = require('./routers/authRouter.js');
const session = require('express-session');
require('dotenv').config();

const server = require('http').createServer(app);

app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true
    })
)
app.use(express.json());
app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        credentials: true,
        name: "sid",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.ENVIRONMENT === "production" ? "true" : "auto",
            httpOnly: false,
            expires: 1000 * 60 * 60 * 6,
            sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
        },
    })
);
app.use("/auth", authRouter);

server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

socketServer.startSocketServer(server);
