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
        client.on('find_game', (userName, time) => {
            waitingPlayers.forEach((player) =>
            console.log("Name: " + player.userName)
            );
            client.userName = userName;
            if(waitingPlayers.length > 0) {
                var opponent = waitingPlayers.shift();
                console.log("Zweiter Spieler: " + client.userName);
                var id = UUIDv4();
                client.join(id);
                opponent.join(id);
                var playerIsWhite = (Math.random() < 0.5);
                client.emit('joinedGame', opponent.userName, id, playerIsWhite);
                opponent.emit('joinedGame', client.userName, id, !playerIsWhite);
                client.gameRoom = id;
                opponent.gameRoom = id;
                currentGames.push(id);
            } else {
                waitingPlayers.push(client);
                console.log("Erster Spieler: " + client.userName);
            }
        });
        client.on('newMove', (roomId, move) => {
            client.to(roomId).emit('opponentMove', move);
        });
        client.on('firstMove', (roomId) => {
            io.to(roomId).emit('stopTimer');
        })
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