const {newChessMove} = require("../controllers/socketController.js");
const {initializeGame} = require("../controllers/socketController.js");
const {getGame} = require("../controllers/socketController.js");
const {v4: UUIDv4} = require('uuid');
const [ServerChessClock] = require("./ServerChessClock.js");
const { Game, DateValue, pgnWrite } = require('kokopu');

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
console.log('initialized Current Games');
let localio;


module.exports.initializeChessListeners = (io) => {
    io.on('connection', client => {
        localio = io;
        client.on('get_game_data', (roomId, cb) => {
            const chessClock = currentGames.get(roomId);
            console.log(currentGames.size);
            if(!chessClock) {
                cb({done: false, errMsg: "This Game does not exist"});
                console.log('keine chessclock')
            } else {
                getGame(roomId)
                    .catch(error => {
                        console.log('kein Eintrag in redis');
                        cb({done: false, errMsg: "This Game does not exist"})
                    })
                    .then(game => {
                        game.currentState = chessClock.getCurrentMode();
                        if(game.currentState.includes('s')) {
                            game.currentStartingTimer = chessClock.getCurrentStartingTimer();
                        } else {
                            game.currentTimes = chessClock.getCurrentTimes();
                        }
                        cb({done: true, data: game});
                    }
                    )
            }
        });
    client.on('find_game', (user, time) => {
        let queue;
        if (user.loggedIn) {
            queue = waitingPlayers;
            client.userName = user.username;
        } else {
            queue = waitingGuests;
            client.userName = 'guest';
        }
        if (queue.get(time.string).length > 0) {
            let whitePlayer;
            let blackPlayer;
            var opponent = queue.get(time.string).shift();
            console.log("Zweiter Spieler: " + client.userName);
            const chessInstance = new Game();
            var roomId = UUIDv4();
            client.join(roomId);
            opponent.join(roomId);
            const playerIsWhite = Math.random() < 0.5;
            if (playerIsWhite) {
                whitePlayer = client.userName;
                blackPlayer = opponent.userName;
            } else {
                blackPlayer = client.userName;
                whitePlayer = opponent.userName;
            }
            client.emit('joinedGame', opponent.userName, roomId, playerIsWhite);
            opponent.emit('joinedGame', client.userName, roomId, !playerIsWhite);
            chessInstance.playerName('w', whitePlayer);
            chessInstance.playerName('b', blackPlayer);
            chessInstance.date(new DateValue(new Date()));
            if(user.loggedIn) {
                initializeGame(roomId, whitePlayer, blackPlayer, time, pgnWrite(chessInstance, {withPlyCount: true}));
            }
            client.gameRoom = roomId;
            opponent.gameRoom = roomId;
            const chessClock = new ServerChessClock(time);
            currentGames.set(roomId, chessClock);
            chessClock.startStartingTimer('white');
            chessClock.ChessClockAPI.on('Cancel Game', () => {
                //TODO: Cancel Game!
                console.log('CANCEL GAME chessClock');
            })

            client.on('newMove', newMove(chessInstance, roomId, client, user.loggedIn));
            opponent.on('newMove', newMove(chessInstance, roomId, opponent, user.loggedIn));
        } else {
            queue.get(time.string).push(client);
            console.log("Erster Spieler: " + client.userName);
            client.on('disconnect', () => {
                leaveQueue(client, time);
            });
            client.on('leave_queue', () => {
                leaveQueue(client, time);
            });
        }
    });
    });
}

const newMove = (chessInstance, roomId, client, loggedIn) => (move, cb) => {
    let current = chessInstance.mainVariation().nodes()[chessInstance.mainVariation().nodes().length - 1];
    if(!current) {
        current = chessInstance.mainVariation();
    }
    try {
        current.play(move.san).notation();
    } catch (InvalidNotation) {
        console.log(InvalidNotation);
        cb({done: false, errMsg: InvalidNotation.message});
        return;
    }
    const chessClock = currentGames.get(client.gameRoom);
    client.to(client.gameRoom).emit('opponentMove', move);
    chessClock.ChessClockAPI.emit('toggle', ({remainingTimeWhite, remainingTimeBlack, turn}) => {
        console.log('toggle');
        localio.to(client.gameRoom).emit('updatedTime', remainingTimeWhite, remainingTimeBlack, turn);
    });
    if (chessInstance.plyCount() === 1) {
        chessClock.startStartingTimer('black');
        localio.to(client.gameRoom).emit('stopTimer');
    } else if (chessInstance.plyCount() === 2) {
        localio.to(client.gameRoom).emit('startClock');
        chessClock.startTimer('white');
        localio.to(client.gameRoom).emit('stopTimer');
    }
    if (loggedIn) {
        newChessMove(pgnWrite(chessInstance), roomId).then(r => cb({done: true}));
    } else {
        cb({done: true});
    }
}

function leaveQueue(client, time) {
    let queue;
    if (client.userName === 'guest') {
        queue = waitingGuests;
    } else {
        queue = waitingPlayers;
    }
    if (queue.get(time.string).includes(client)) {
        queue.get(time.string).splice(queue.get(time.string).indexOf(client), 1);
    } else {
       // if (client.gameRoom !== undefined) currentGames.delete(client.gameRoom);
    }
}