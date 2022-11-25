const { Server: SocketServer } = require("socket.io");
const {v4 : UUIDv4} = require('uuid') ;
let waitingPlayers = [];
let currentGames = [];



const io = new SocketServer(8080, {
    cors: {
        origin: 'http://localhost:3000'
    }
});



function initializeSocketListeners() {
    io.on('connection', client => {
        console.log(client.id);
        client.on('find_game', (userName) => {
            waitingPlayers.forEach((player) =>
            console.log("Name: " + player.userName)
            );
            client.userName = userName;
            if(waitingPlayers.length > 0) {
                var opponent = waitingPlayers.shift();
                console.log("Zweiter Spieler: " + client.userName);
                var id = UUIDv4();
                console.log(id);
                client.join(id);
                opponent.join(id);
                client.emit('joinedGame', opponent.userName, id);
                opponent.emit('joinedGame', client.userName, id);
                client.gameRoom = id;
                opponent.gameRoom = id;
                currentGames.push(id);
            } else {
                waitingPlayers.push(client);
                console.log("Erster Spieler: " + client.userName);
            }
        });
        client.on('disconnect', () => {
            onDisconnect(client)
        });
    });
}

function onDisconnect(client) {
    if(waitingPlayers.includes(client)) {
        waitingPlayers.splice(waitingPlayers.indexOf(client), 1);
    } else {
        if(client.gameRoom != (null || undefined))
            currentGames.splice(currentGames.indexOf(client.gameRoom), 1);
            try {
                io.sockets.adapter.rooms.get(client.gameRoom).forEach(function (s) {
                    io.sockets.sockets.get(s).leave(client.gameRoom);
                });
            } catch{

            }
        //TODO: Make opponent win
    }

}

initializeSocketListeners();