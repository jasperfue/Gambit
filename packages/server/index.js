const {Server} = require('socket.io');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const {corsConfig, sessionMiddleware, wrap} = require('./controllers/serverController.js');
const {initializeListeners} = require('./src/socketServer.js');
const authRouter = require('./routers/authRouter.js');
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
app.use(sessionMiddleware);
app.use("/auth", authRouter);


io.use(wrap(sessionMiddleware));
io.use(authorizeUser);
initializeListeners(io);
io.on('connection', (socket) => {
        socket.on('login', () => {
            socket.request.session.reload(function(err) {
                if(err) {
                    console.log(err);
                } else {
                    authorizeUser(socket, () => {console.log('authorize')});
                }
            });
        });
});


server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

