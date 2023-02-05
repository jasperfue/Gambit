const {requestFriend} = require("../controllers/socketController.js");
const {onDisconnect} = require("../controllers/socketController.js");
const {addFriend} = require("../controllers/socketController.js");
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
let waitingGuests = new Map([...waitingPlayers]);
let currentGames = new Map();

const initializeListeners = (io) => {
    function initializeSocketListeners() {
        io.on('connection', client => {
            client.on('disconnect', () => {
                if(client.user) {
                    onDisconnect(client);
                }
            });
            client.on('send_friend_request', (requestName, cb) => requestFriend(client, requestName, cb));
            console.log(client.id);
            client.on('find_game', (user, time) => {
                let queue;
                if(user.loggedIn) {
                    queue = waitingPlayers;
                    client.userName = user.username;
                } else {
                    queue = waitingGuests;
                    client.userName = 'guest';
                }
                console.log(client.userName);
                if(queue.get(time.string).length > 0) {
                    var opponent = queue.get(time.string).shift();
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
                    queue.get(time.string).push(client);
                    console.log("Erster Spieler: " + client.userName);
                    client.on('disconnect', () => {
                        leaveQueue(client, time);
                    });
                    client.on('leave_queue', () => {
                        leaveQueue(client, time);
                    })
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

    function leaveQueue(client, time) {
        let queue;
        if(client.userName === 'guest') {
            queue = waitingGuests;
        } else {
            queue = waitingPlayers;
        }
        if(queue.get(time.string).includes(client)) {
            queue.get(time.string).splice(queue.get(time.string).indexOf(client), 1);
        } else {
            if(client.gameRoom !== undefined)
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
}
module.exports = {
    initializeListeners
};

