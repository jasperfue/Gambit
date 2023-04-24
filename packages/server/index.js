const {Server} = require('socket.io');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const {initializeListeners} = require('./src/sockets/socketController.js');
const authRouter = require('./src/routers/authRouter.js');
const {authorizeUser, initializeUser} = require("./src/sockets/socketMiddleware.js");
const {onServerShutdown} = require("./src/redis/redisController.js");
const {initializeChessListeners} = require("./src/sockets/socketChessController.js");
var ON_DEATH = require('death')({uncaughtException: true, debug: true}); //this is intentionally ugly


const corsConfig = {
    origin: 'http://localhost:3000',
    credentials: true,
}


ON_DEATH(function(signal, err) {
    onServerShutdown().then(() => process.exit());
    if(err) {
        console.error(err);
    }
    //await onShutdown();
});

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





server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

