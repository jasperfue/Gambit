const { Server: SocketServer } = require("socket.io");
const {v4 : UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");
let waitingPlayers = [];
let currentGames = new Map();



const io = new SocketServer(8080, {
    cors: {
        origin: 'http://localhost:3000'
    }
});



function initializeSocketListeners() {
    io.on('connection', client => {
        console.log(client.id);
        client.on('find_game', (userName, time) => {
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
                const chessClock = new ServerChessClock(time);
                currentGames.set(id, chessClock);
                chessClock.ChessClockAPI.on('toggleTime', (timeWhite, timeBlack, turn) => {
                    io.to(client.gameRoom).emit('updatedTime', timeWhite, timeBlack, turn);
                    console.log('toggle');
                });
            } else {
                waitingPlayers.push(client);
                console.log("Erster Spieler: " + client.userName);
            }
            client.on('newMove', (move, number) => {
                var chessClock = currentGames.get(client.gameRoom).ChessClockAPI;
                client.to(client.gameRoom).emit('opponentMove', move, number);
                chessClock.emit('toggle');
            });
            client.on('firstMove', (colour, move, number) => {
                console.log('first Move')
                client.to(client.gameRoom).emit('opponentMove', move, number);
                io.to(client.gameRoom).emit('stopTimer');
                if(number === 2) {
                    io.to(client.gameRoom).emit('startClock');
                }
                if(colour === 'black') {
                    currentGames.get(client.gameRoom).startTimer('white');
                }
            });

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