const { Server: SocketServer } = require("socket.io");
const {v4 : UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");
let waitingPlayers = new Map();
waitingPlayers.set('1 + 0', []);
waitingPlayers.set('2 + 1', []);
waitingPlayers.set('3 + 0', []);
waitingPlayers.set('3 + 2', []);
waitingPlayers.set('5 + 0', []);
waitingPlayers.set('5 + 3', []);
waitingPlayers.set('10 + 0', []);
waitingPlayers.set('10 + 5', []);
waitingPlayers.set('15 + 10', []);
waitingPlayers.set('30 + 0', []);
waitingPlayers.set('30 + 20', []);
let currentGames = new Map();
const port = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_PORT || 8080
console.log(SOCKET_PORT);



const io = new SocketServer(SOCKET_PORT, {
    transports: ['websocket'],
    cors: {
        origin: 'https://gambit.herokuapp.com:${port}'
    }
});



function initializeSocketListeners() {
    console.log('jojo');
    io.on('connection', client => {
        console.log(client.id);
        client.on('find_game', (userName, time) => {
            client.userName = userName;
            if(waitingPlayers.get(time.string).length > 0) {
                var opponent = waitingPlayers.get(time.string).shift();
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
                chessClock.startStartingTimer('white');
                chessClock.ChessClockAPI.on('toggleTime', (timeWhite, timeBlack, turn) => {
                    io.to(client.gameRoom).emit('updatedTime', timeWhite, timeBlack, turn);
                });
                chessClock.ChessClockAPI.on('Cancel Game', () => {
                    //TODO: Cancel Game!
                    console.log('CANCEL GAME');
                })
            } else {
                waitingPlayers.get(time.string).push(client);
                console.log("Erster Spieler: " + client.userName);
                client.on('disconnect', () => {
                    onDisconnect(client, time);
                });
            }
            client.on('newMove', (move, number) => {
                var chessClock = currentGames.get(client.gameRoom);
                client.to(client.gameRoom).emit('opponentMove', move, number);
                chessClock.ChessClockAPI.emit('toggle');
                if(number === 1) {
                    chessClock.startStartingTimer('black');
                    io.to(client.gameRoom).emit('stopTimer');
                } else if(number === 2) {
                    io.to(client.gameRoom).emit('startClock');
                    chessClock.startTimer('white');
                    io.to(client.gameRoom).emit('stopTimer');
                }
            });

        });
    });
}

function onDisconnect(client, time) {
    if(waitingPlayers.get(time.string).includes(client)) {
        waitingPlayers.get(time.string).splice(waitingPlayers.get(time).indexOf(client), 1);
    } else {
        if(client.gameRoom != (null || undefined))
            //currentGames.splice(currentGames.indexOf(client.gameRoom), 1);
            currentGames.delete(client.gameRoom);
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