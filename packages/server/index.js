const {Server} = require('socket.io');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const {corsConfig} = require('./controllers/serverController.js');
const {initializeListeners} = require('./src/socketServer.js');
const authRouter = require('./routers/authRouter.js');
const {initializeUser} = require("./controllers/socketController.js");
const {initializeChessListeners} = require("./src/socketChessListeners.js");
const {authorizeUser} = require("./controllers/socketController.js");

const server = require('http').createServer(app);
const io = new Server(server, {
    transports: ['websocket'],
    cors: corsConfig,
});


app.use(helmet());
app.use(
    cors(corsConfig)
);
app.use(express.json());
app.use("/auth", authRouter);


io.use(authorizeUser);
initializeListeners(io);
initializeChessListeners(io);
io.on('connection', async (socket) => {
   await initializeUser(socket);
        /*socket.on('login', () => {
            socket.request.session.reload(function(err) {
                if(err) {
                    console.log("RELOAD", err);
                } else {
                    authorizeUser(socket, () => {});
                }
            });
        });*/
});


server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

