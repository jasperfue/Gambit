const {Server} = require('socket.io');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const {corsConfig, sessionMiddleware, wrap} = require('./controllers/serverController.js');
const {initializeListeners} = require('./src/socketServer.js');
const authRouter = require('./routers/authRouter.js');

const server = require('http').createServer(app);
app.use(helmet());
const io = new Server(server, {
    transports: ['websocket'],
    cors: corsConfig,
});
io.use(wrap(sessionMiddleware));
initializeListeners(io);
app.use(
    cors(corsConfig)
)
app.use(express.json());
app.use(sessionMiddleware);
app.use("/auth", authRouter);


server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

