const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const socketServer = require('./src/socketServer.js')

const server = require('http').createServer(app);

app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true
    })
)
app.use(express.json());

server.listen(4000, () => {
    console.log("Server listening on port 4000");
});

socketServer.startSocketServer(server);
