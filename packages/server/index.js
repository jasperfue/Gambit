const {Server} = require('socket.io');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const {corsConfig} = require('./controllers/serverController.js');
const {initializeListeners} = require('./src/socketServer.js');
const authRouter = require('./routers/authRouter.js');
const {onServerShutdown} = require("./controllers/socketController.js");
const {initializeChessListeners} = require("./src/socketChessListeners.js");
const {authorizeUser, initializeUser} = require("./controllers/socketController.js");

const server = require('http').createServer(app);
const io = new Server(server, {
    cors: corsConfig,
    cookie: true
});


app.use(helmet());
app.use(
    cors(corsConfig)
);
app.use(express.json());
app.use("/auth", authRouter);

io.engine.use(helmet());
io.use(authorizeUser);
io.use(initializeUser);
io.use((socket, next) => {
    initializeChessListeners(socket, io);
    initializeListeners(socket, io);
    next();
});


process.on('SIGINT', async () => await onShutdown());
process.on('SIGTERM', async () => await onShutdown());
process.on('uncaughtException', async () => await onShutdown());


async function onShutdown() {
    console.log('ONSHUTDOWN');
    await onServerShutdown();
    setTimeout(() => {
        process.exit();
    }, 1000);
}

server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

